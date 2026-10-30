// 운영자 전용: 참여 현황 조회와 AI 밥조 편성.
// 이름은 서버에만 두고, AI에는 무작위 가명 번호와 궁합에 필요한 최소 정보만 보낸다.
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual, randomInt } from 'node:crypto';
import { runGroupingAgent } from '../lib/agent.js';
import { baselineGrouping } from '../lib/compat.js';

export const config = { maxDuration: 60 };

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function isAdmin(req) {
  const expected = process.env.ADMIN_PASSWORD;
  const given = String(req.headers['x-admin-password'] ?? '');
  if (!expected || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

async function loadParticipants() {
  const { data, error } = await supabase
    .from('participants')
    .select('id, display_name, saju_results(day_pillar, day_master_element, elements, gender, cross_check_ok)');
  if (error) throw error;
  return data.filter((p) => p.saju_results);
}

// 실제 ID 대신 쓸 가명 번호를 무작위로 섞어 붙인다. 매 실행마다 바뀐다.
function pseudonymize(rows) {
  const shuffled = [...rows];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const people = new Map();
  const realIdOf = new Map();
  shuffled.forEach((row, i) => {
    const alias = `P${String(i + 1).padStart(2, '0')}`;
    const s = row.saju_results;
    people.set(alias, {
      id: alias,
      gender: s.gender,
      dayStem: s.day_pillar[0],
      dayBranch: s.day_pillar[1],
      dayMasterElement: s.day_master_element,
      elements: s.elements,
    });
    realIdOf.set(alias, row);
  });
  return { people, realIdOf };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: '허용되지 않은 요청입니다.' });
  if (!isAdmin(req)) return res.status(401).json({ error: '운영자 비밀번호가 맞지 않아요.' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
  let rows;
  try {
    rows = await loadParticipants();
  } catch {
    return res.status(500).json({ error: '참여자 정보를 불러오지 못했어요.' });
  }

  if (body.action === 'status') {
    return res.status(200).json({
      count: rows.length,
      participants: rows.map((r) => ({
        name: r.display_name,
        gender: r.saju_results.gender,
        crossCheckOk: r.saju_results.cross_check_ok,
      })),
    });
  }

  if (body.action === 'publish') {
    const { data: run } = await supabase.from('grouping_runs').select('assignment').eq('id', body.runId).maybeSingle();
    if (!run?.assignment) return res.status(404).json({ error: '확정할 편성안을 찾지 못했어요.' });
    const rowsToSave = run.assignment.flatMap((g, i) => g.participant_ids.map((id) => ({
      participant_id: id, group_no: i + 1, group_name: g.name, group_reason: g.reason,
    })));
    // 이전에 공개한 편성은 지우고 새 편성으로 바꾼다.
    const { error: delErr } = await supabase.from('bapjo_assignments').delete().not('participant_id', 'is', null);
    const { error: insErr } = delErr ? { error: delErr } : await supabase.from('bapjo_assignments').insert(rowsToSave);
    if (insErr) return res.status(500).json({ error: '편성을 공개하지 못했어요.' });
    return res.status(200).json({ published: rowsToSave.length });
  }

  if (body.action !== 'run') return res.status(400).json({ error: '알 수 없는 요청이에요.' });
  if (rows.length < 4) return res.status(400).json({ error: '편성하려면 최소 4명이 필요해요.' });

  const { people, realIdOf } = pseudonymize(rows);
  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const startedAt = Date.now();

  // 코드 편성을 먼저 만들어 두고, AI가 실패하면(한도 초과, 모델 종료, 시간 초과) 이 안으로 대신한다.
  const baseline = baselineGrouping(people);
  let result;
  let fallbackReason = null;
  try {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY가 설정되지 않았어요.');
    result = await runGroupingAgent(people, { apiKey: process.env.GEMINI_API_KEY, model });
  } catch (err) {
    fallbackReason = err.message;
    result = {
      groups: baseline.groups.map((g, i) => ({
        name: `${i + 1}조`,
        reason: '궁합 점수 합이 가장 높아지도록 코드로 찾은 조합이에요. 서로 부족한 기운을 채워주는 사람끼리 모였어요.',
        members: g.members,
      })),
      evaluation: baseline,
      log: [{ tool: 'fallback', error: err.message }],
      turns: 0,
    };
  }

  // AI 판단 기록: 무엇을 보냈고 어떤 도구를 불렀고 무엇을 냈는지 남긴다. 실명은 넣지 않는다.
  const { data: run } = await supabase.from('grouping_runs').insert({
    model: fallbackReason ? `fallback:${model}` : model,
    sent_to_ai: [...people.values()],
    tool_log: result.log,
    ai_groups: result.groups,
    ai_score: result.evaluation.totalScore,
    baseline_score: baseline.totalScore,
    duration_ms: Date.now() - startedAt,
    assignment: result.groups.map((g) => ({
      name: g.name,
      reason: g.reason,
      participant_ids: g.members.map((alias) => realIdOf.get(alias).id),
    })),
  }).select('id').single();

  const named = (ids) => ids.map((alias) => ({
    alias,
    name: realIdOf.get(alias).display_name,
    gender: people.get(alias).gender,
  }));
  return res.status(200).json({
    runId: run?.id ?? null,
    model,
    fallbackReason,
    turns: result.turns,
    toolCalls: result.log.length,
    ai: {
      totalScore: result.evaluation.totalScore,
      lowestGroup: result.evaluation.lowestGroup,
      groups: result.groups.map((g, i) => ({
        name: g.name,
        reason: g.reason,
        score: result.evaluation.groups[i].score,
        members: named(g.members),
      })),
    },
    baseline: {
      totalScore: baseline.totalScore,
      lowestGroup: baseline.lowestGroup,
      groups: baseline.groups.map((g) => ({ score: g.score, members: named(g.members) })),
    },
  });
}
