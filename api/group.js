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

  if (body.action !== 'run') return res.status(400).json({ error: '알 수 없는 요청이에요.' });
  if (rows.length < 4) return res.status(400).json({ error: '편성하려면 최소 4명이 필요해요.' });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았어요.' });

  const { people, realIdOf } = pseudonymize(rows);
  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const startedAt = Date.now();

  let result;
  try {
    result = await runGroupingAgent(people, { apiKey: process.env.GEMINI_API_KEY, model });
  } catch (err) {
    return res.status(502).json({ error: `AI 편성에 실패했어요: ${err.message}` });
  }
  const baseline = baselineGrouping(people);

  // AI 판단 기록: 무엇을 보냈고 어떤 도구를 불렀고 무엇을 냈는지 남긴다. 실명은 넣지 않는다.
  await supabase.from('grouping_runs').insert({
    model,
    sent_to_ai: [...people.values()],
    tool_log: result.log,
    ai_groups: result.groups,
    ai_score: result.evaluation.totalScore,
    baseline_score: baseline.totalScore,
    duration_ms: Date.now() - startedAt,
  });

  const named = (ids) => ids.map((alias) => ({
    alias,
    name: realIdOf.get(alias).display_name,
    gender: people.get(alias).gender,
  }));
  return res.status(200).json({
    model,
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
