// Gemini 함수 호출(function calling)로 밥조를 편성하는 에이전트.
// AI는 궁합 점수를 직접 만들지 않고 코드가 제공하는 도구를 호출해 판단하며,
// 최종안은 submit_groups 도구로만 제출할 수 있다. 서버가 규칙을 검사해 통과해야 확정된다.
import { pairScore, evaluateGroups, groupSizes, genderPlan } from './compat.js';

const API = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_TURNS = 20;
// Vercel 함수 제한(60초) 안에서 끝나도록 AI 호출에 쓸 시간 상한
const TIME_BUDGET_MS = 45_000;

const TOOLS = [{
  functionDeclarations: [
    {
      name: 'pair_compatibility',
      description: '두 사람의 궁합 점수와 이유를 규칙으로 계산한다.',
      parameters: {
        type: 'OBJECT',
        properties: { a: { type: 'STRING' }, b: { type: 'STRING' } },
        required: ['a', 'b'],
      },
    },
    {
      name: 'person_overview',
      description: '한 사람과 나머지 모두의 궁합 점수를 계산해 잘 맞는 순서로 돌려준다. 인원이 많을 때 먼저 쓰면 좋다.',
      parameters: {
        type: 'OBJECT',
        properties: { id: { type: 'STRING' } },
        required: ['id'],
      },
    },
    {
      name: 'baseline_groups',
      description: '코드가 여러 번 다시 짜 보고 찾은 기준 편성안과 그 점수를 돌려준다. 제출안의 objective는 이 기준안보다 낮으면 안 된다.',
      parameters: { type: 'OBJECT', properties: {} },
    },
    {
      name: 'evaluate_groups',
      description: '편성안이 규칙(모두 한 번씩, 조 인원)을 지키는지 검사하고 조별 점수와 성비를 돌려준다.',
      parameters: {
        type: 'OBJECT',
        properties: {
          groups: { type: 'ARRAY', items: { type: 'ARRAY', items: { type: 'STRING' } } },
        },
        required: ['groups'],
      },
    },
    {
      name: 'submit_groups',
      description: '최종 편성안을 제출한다. 규칙을 어기거나 objective가 기준안보다 낮으면 거절되고 이유가 돌아온다.',
      parameters: {
        type: 'OBJECT',
        properties: {
          groups: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                members: { type: 'ARRAY', items: { type: 'STRING' } },
                reason: { type: 'STRING', description: '이 조가 잘 맞는 이유. 사주 용어 없이 친근한 해요체(~해요)로 3~4문장. 도구 결과에 나온 구체적인 근거(누가 누구의 부족한 기운을 채우는지, 어떤 분위기의 조인지)를 가명 번호 없이 풀어 써' },
              },
              required: ['members', 'reason'],
            },
          },
        },
        required: ['groups'],
      },
    },
  ],
}];

function systemPrompt(people, sizes, plan, floor) {
  return `너는 학회 밥조를 짜는 편성 담당자야.
참여자는 가명 번호로만 주어지고, 각자의 성별, 일간·일지(나를 나타내는 두 글자), 오행 개수만 알 수 있어.
목표:
1. 조 인원은 [${sizes.join(', ')}]명이어야 하고 모든 사람이 정확히 한 조에 들어가야 해.
2. 모든 조가 고르게 잘 맞게 짜. evaluate_groups의 objective(전체 합계 + 가장 약한 조의 한 쌍 평균 가중치)가 높을수록 좋아. 인원이 다른 조끼리는 합계 대신 한 쌍 평균(average)으로 비교해.
3. 성비는 반드시 지켜. 조별 [여, 남] 인원: ${JSON.stringify(plan.map((p) => [p.female, p.male]))}. 어기면 제출이 거절돼.
${floor === null ? '' : `4. 먼저 baseline_groups로 코드 기준안(objective ${floor})을 확인해. 제출안의 objective는 이보다 낮으면 거절돼. 기준안에서 사람을 바꿔 보며 더 좋은 안을 찾고, 못 찾으면 기준안 조합을 그대로 제출해도 돼. 어느 경우든 조마다 이유는 네가 직접 써.\n`}방법: 인원이 적은 조도 큰 조와 똑같이 정성껏 이유를 써. person_overview로 사람마다 잘 맞는 상대를 보고, 필요하면 pair_compatibility로 두 사람의 이유를 확인하고, evaluate_groups로 후보안을 비교한 뒤, 가장 좋은 안을 submit_groups로 제출해.
궁합 점수는 직접 계산하지 말고 반드시 도구 결과를 따라.
조 이름은 서버가 1조, 2조처럼 붙이니 따로 짓지 마. 이유는 사주를 모르는 대학생도 이해할 쉬운 말로, 친구에게 말하듯 해요체(~해요, ~예요)로 써. 습니다체는 쓰지 마. 이유는 '잘 맞아요'처럼 뭉뚱그리지 말고, 조원들이 서로 어떤 기운을 채워주는지와 함께 있으면 어떤 분위기일지를 3~4문장으로 구체적으로 써. 가명 번호(P01 등)는 이유에 쓰지 마. 연애, 설렘, 이성으로 끌림처럼 특정 사람끼리 엮는 표현도 쓰지 마.

참여자: ${JSON.stringify(people)}`;
}

async function callGemini({ apiKey, model, contents, system }) {
  const res = await fetch(`${API}/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      tools: TOOLS,
      toolConfig: { functionCallingConfig: { mode: 'ANY' } },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${data.error?.message ?? 'unknown error'}`);
  return data.candidates?.[0]?.content;
}

/**
 * @param {Map<string, import('./compat.js').Person>} people 가명 번호 → AI에 보낼 정보
 * @returns {Promise<{groups: {members: string[], name: string, reason: string}[], evaluation: object, log: object[]}>}
 */
export async function runGroupingAgent(people, { apiKey, model, baseline = null, callModel = callGemini, timeBudgetMs = TIME_BUDGET_MS }) {
  const deadline = Date.now() + timeBudgetMs;
  const sizes = groupSizes(people.size);
  // 코드 기준안의 목표 점수. AI 제출안은 이보다 낮으면 거절해서, 확정되는 편성이 항상 기준안 이상이 되게 한다.
  const floor = baseline ? Math.round(baseline.objective * 100) / 100 : null;
  const system = systemPrompt([...people.values()], sizes, genderPlan(people), floor);
  const contents = [{ role: 'user', parts: [{ text: '밥조를 편성해 줘.' }] }];
  const log = [];

  for (let turn = 0; turn < MAX_TURNS; turn += 1) {
    if (Date.now() > deadline) throw new Error('AI가 제한 시간 안에 편성안을 내지 못했어요.');
    const content = await callModel({ apiKey, model, contents, system });
    if (!content?.parts?.length) throw new Error('AI 응답이 비어 있어요.');
    contents.push(content);

    const responses = [];
    for (const part of content.parts) {
      const call = part.functionCall;
      if (!call) continue;
      const args = call.args ?? {};
      let result;
      if (call.name === 'pair_compatibility') {
        const a = people.get(args.a);
        const b = people.get(args.b);
        result = a && b ? pairScore(a, b) : { error: '없는 번호예요.' };
      } else if (call.name === 'person_overview') {
        const me = people.get(args.id);
        result = me
          ? [...people.values()].filter((p) => p.id !== me.id)
            .map((p) => ({ id: p.id, gender: p.gender, score: pairScore(me, p).score }))
            .sort((x, y) => y.score - x.score)
          : { error: '없는 번호예요.' };
      } else if (call.name === 'baseline_groups') {
        result = baseline
          ? { objective: floor, groups: baseline.groups.map((g) => ({ members: g.members, average: g.average })) }
          : { error: '기준안이 없어요. 직접 편성해 줘.' };
      } else if (call.name === 'evaluate_groups') {
        result = evaluateGroups(args.groups ?? [], people);
      } else if (call.name === 'submit_groups') {
        const groups = args.groups ?? [];
        const evaluation = evaluateGroups(groups.map((g) => g.members ?? []), people);
        log.push({ turn, tool: call.name, args, result: evaluation });
        // 조 이름은 AI가 짓지 않고 번호로 통일한다.
        const belowFloor = evaluation.valid && floor !== null && evaluation.objective < baseline.objective - 1e-9;
        if (evaluation.valid && !belowFloor) return { groups: groups.map((g, i) => ({ ...g, name: `${i + 1}조` })), evaluation, log, turns: turn + 1 };
        result = belowFloor
          ? { accepted: false, errors: [`objective ${Math.round(evaluation.objective * 100) / 100}점이 기준안(${floor}점)보다 낮아요. 더 좋은 안을 내거나 baseline_groups의 조합을 그대로 제출해 줘.`] }
          : { accepted: false, errors: evaluation.errors };
      } else {
        result = { error: `모르는 도구: ${call.name}` };
      }
      if (call.name !== 'submit_groups') log.push({ turn, tool: call.name, args, result });
      responses.push({ functionResponse: { name: call.name, response: { result } } });
    }
    if (!responses.length) {
      responses.push({ text: '도구를 호출해서 진행하고, 마지막에는 submit_groups로 제출해 줘.' });
    }
    contents.push({ role: 'user', parts: responses });
  }
  throw new Error(`AI가 ${MAX_TURNS}번 안에 규칙에 맞는 편성안을 내지 못했어요.`);
}
