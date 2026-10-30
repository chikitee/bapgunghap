// 입력 폼 제출을 받는 Vercel 서버 함수.
// 검증 → 사주 계산 → DB 저장 순서로 처리하고, 본인 사주만 돌려준다.
import { createClient } from '@supabase/supabase-js';
import { computeSaju } from '../lib/saju.js';
import { findIdealMatch } from '../lib/match.js';

const CONSENT_VERSION = '2026-10-30-v2';
const LIBRARY_VERSIONS = { manseryeok: '2.0.0', 'lunar-javascript': '1.7.7' };

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function bad(res, status, message) {
  return res.status(status).json({ error: message });
}

function parseInput(body) {
  const name = String(body.name ?? '').trim();
  if (name.length < 1 || name.length > 20) return { error: '이름(닉네임)은 1~20자로 입력해 주세요.' };

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(body.birthDate ?? ''));
  if (!dateMatch) return { error: '생년월일을 다시 확인해 주세요.' };
  const [year, month, day] = dateMatch.slice(1).map(Number);
  const asDate = new Date(Date.UTC(year, month - 1, day));
  if (asDate.getUTCMonth() !== month - 1 || year < 1900 || asDate > new Date()) {
    return { error: '실제로 있는 날짜를 입력해 주세요.' };
  }

  let hour = null;
  let minute = null;
  if (body.birthTime) {
    const t = /^(\d{2}):(\d{2})$/.exec(String(body.birthTime));
    if (!t || Number(t[1]) > 23 || Number(t[2]) > 59) return { error: '태어난 시각을 다시 확인해 주세요.' };
    [hour, minute] = [Number(t[1]), Number(t[2])];
  }
  return { name, year, month, day, hour, minute, birthDate: dateMatch[0], birthTime: body.birthTime || null };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return bad(res, 405, '허용되지 않은 요청입니다.');

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});

  // 봇이 채우는 숨김 필드. 사람이 쓰는 화면에는 보이지 않는다.
  if (body.website) return res.status(200).json({ ok: true });
  if (!process.env.INVITE_CODE || body.inviteCode !== process.env.INVITE_CODE) {
    return bad(res, 403, '초대 링크로 접속해 주세요.');
  }
  if (body.consent !== true) return bad(res, 400, '개인정보 수집·이용에 동의해 주세요.');

  const input = parseInput(body);
  if (input.error) return bad(res, 400, input.error);

  let saju;
  try {
    saju = computeSaju(input);
  } catch {
    return bad(res, 400, '사주를 계산할 수 없는 날짜예요. 입력값을 확인해 주세요.');
  }

  const { data: participant, error: pErr } = await supabase
    .from('participants')
    .insert({ display_name: input.name, consent_at: new Date().toISOString(), consent_version: CONSENT_VERSION })
    .select('id')
    .single();
  if (pErr) {
    if (pErr.code === '23505') return bad(res, 409, '이미 같은 이름으로 참여했어요. 수정이 필요하면 운영자에게 알려주세요.');
    return bad(res, 500, '저장 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.');
  }

  const id = participant.id;
  const { error: bErr } = await supabase
    .from('birth_inputs')
    .insert({ participant_id: id, birth_date: input.birthDate, birth_time: input.birthTime });
  const { error: sErr } = bErr ? { error: bErr } : await supabase.from('saju_results').insert({
    participant_id: id,
    year_pillar: saju.pillars.year,
    month_pillar: saju.pillars.month,
    day_pillar: saju.pillars.day,
    hour_pillar: saju.pillars.hour,
    day_master: saju.dayMaster,
    day_master_element: saju.dayMasterElement,
    elements: saju.elements,
    cross_check_ok: saju.crossCheck.ok,
    cross_check_detail: saju.crossCheck,
    library_versions: LIBRARY_VERSIONS,
  });
  if (sErr) {
    // 반쪽짜리 기록이 남지 않게 지운다(birth_inputs, saju_results는 cascade로 함께 삭제).
    await supabase.from('participants').delete().eq('id', id);
    return bad(res, 500, '저장 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.');
  }

  return res.status(200).json({
    ok: true,
    pillars: saju.pillars,
    dayMaster: saju.dayMaster,
    dayMasterElement: saju.dayMasterElement,
    elements: saju.elements,
    timeKnown: saju.timeKnown,
    match: findIdealMatch(saju),
  });
}
