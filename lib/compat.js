// 두 사람의 궁합 점수를 규칙으로 계산하고, 코드만으로 찾은 최적 편성(기준선)을 구한다.
// AI 에이전트는 이 함수들을 도구로 호출해서 판단한다. 점수 자체는 AI가 만들지 않는다.

const STEM_COMBINE = { 갑: '기', 기: '갑', 을: '경', 경: '을', 병: '신', 신: '병', 정: '임', 임: '정', 무: '계', 계: '무' };
const BRANCH_COMBINE = { 자: '축', 축: '자', 인: '해', 해: '인', 묘: '술', 술: '묘', 진: '유', 유: '진', 사: '신', 신: '사', 오: '미', 미: '오' };
const BRANCH_CLASH = { 자: '오', 오: '자', 축: '미', 미: '축', 인: '신', 신: '인', 묘: '유', 유: '묘', 진: '술', 술: '진', 사: '해', 해: '사' };
const GENERATES = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' };
const CONTROLS = { 목: '토', 토: '수', 수: '화', 화: '금', 금: '목' };
const ELEMENTS = ['목', '화', '토', '금', '수'];
const FAIRNESS_WEIGHT = 20;

const controlledBy = (el) => ELEMENTS.find((e) => CONTROLS[e] === el);

// 연인을 뜻하는 기운: 남자는 내가 극하는 오행(재성), 여자는 나를 극하는 오행(관성)
function spouseElement(p) {
  return p.gender === 'male' ? CONTROLS[p.dayMasterElement] : controlledBy(p.dayMasterElement);
}

/**
 * @typedef {{id: string, gender: 'male'|'female', dayStem: string, dayBranch: string,
 *   dayMasterElement: string, elements: Record<string, number>}} Person
 * AI에 넘기는 사람 정보. 생년월일을 역산할 수 있는 연주·월주는 넣지 않는다.
 */

/** @returns {{score: number, reasons: string[]}} */
export function pairScore(a, b) {
  let score = 0;
  const reasons = [];
  if (STEM_COMBINE[a.dayStem] === b.dayStem) { score += 3; reasons.push('천간합(서로 끌림) +3'); }
  if (BRANCH_COMBINE[a.dayBranch] === b.dayBranch) { score += 2; reasons.push('육합(생활 리듬) +2'); }
  if (BRANCH_CLASH[a.dayBranch] === b.dayBranch) { score -= 2; reasons.push('충(부딪힘) -2'); }
  if (GENERATES[a.dayMasterElement] === b.dayMasterElement || GENERATES[b.dayMasterElement] === a.dayMasterElement) {
    score += 1; reasons.push('상생(서로 북돋움) +1');
  }
  for (const el of ELEMENTS) {
    if ((a.elements[el] === 0 && b.elements[el] >= 2) || (b.elements[el] === 0 && a.elements[el] >= 2)) {
      score += 1; reasons.push(`부족한 ${el} 기운 보완 +1`);
    }
  }
  if (a.gender !== b.gender && (spouseElement(a) === b.dayMasterElement || spouseElement(b) === a.dayMasterElement)) {
    score += 2; reasons.push('연인 기운(이성) +2');
  }
  return { score, reasons };
}

const EL_NAME = { 목: '나무', 화: '불', 토: '흙', 금: '쇠', 수: '물' };

const ANIMAL_OF = { 자: '쥐', 축: '소', 인: '호랑이', 묘: '토끼', 진: '용', 사: '뱀', 오: '말', 미: '양', 신: '원숭이', 유: '닭', 술: '개', 해: '돼지' };
const EL_MEANING = {
  목: '새로운 걸 시작하는 추진력',
  화: '분위기를 살리는 열정과 표현력',
  토: '사람을 편하게 품는 안정감',
  금: '깔끔하게 정리하는 결단력',
  수: '차분하게 생각하는 깊이',
};
const FLOW = {
  목: '물이 나무를 키우듯',
  화: '나무가 불을 피우듯',
  토: '불이 타고 남은 재가 흙을 기름지게 하듯',
  금: '흙 속에서 쇠가 단단해지듯',
  수: '차가운 쇠에 물방울이 맺히듯',
};
const batchim = (w) => (w.charCodeAt(w.length - 1) - 0xac00) % 28;
const 와 = (w) => (batchim(w) ? `${w}과` : `${w}와`);
const 이라 = (w) => (batchim(w) ? `${w}이라` : `${w}라`);
// ㄹ 받침(8)은 '로', 다른 받침은 '으로'
const 로 = (w) => (batchim(w) && batchim(w) !== 8 ? `${w}으로` : `${w}로`);

/**
 * 내 입장에서 본 조원과의 궁합을 쉬운 말로, 근거와 함께. 좋은 점만 보여주고, 없으면 무난하다고 쓴다.
 * @returns {{score: number, lines: string[]}}
 */
export function pairStory(me, other) {
  const lines = [];
  const myEl = EL_NAME[me.dayMasterElement];
  const otherEl = EL_NAME[other.dayMasterElement];
  if (STEM_COMBINE[me.dayStem] === other.dayStem) {
    lines.push(`나를 뜻하는 글자와 상대를 뜻하는 글자가 서로 짝을 이루는 조합이에요. 사주에서 가장 끌리는 관계라, 처음 만나도 말이 잘 통하고 묘하게 편해요.`);
  }
  if (BRANCH_COMBINE[me.dayBranch] === other.dayBranch) {
    lines.push(`태어난 날의 동물이 ${와(ANIMAL_OF[me.dayBranch])} ${로(ANIMAL_OF[other.dayBranch])} 짝꿍이에요. 생활 리듬과 취향이 비슷해서 같이 밥 먹고 쉬는 템포가 잘 맞아요.`);
  }
  if (GENERATES[me.dayMasterElement] === other.dayMasterElement) {
    lines.push(`${FLOW[other.dayMasterElement]}, 내 ${myEl} 기운이 상대의 ${otherEl} 기운을 살려줘요. 내가 응원해 주면 상대가 힘을 받는 관계예요.`);
  } else if (GENERATES[other.dayMasterElement] === me.dayMasterElement) {
    lines.push(`${FLOW[me.dayMasterElement]}, 상대의 ${otherEl} 기운이 내 ${myEl} 기운을 살려줘요. 지칠 때 옆에 있으면 힘이 나는 든든한 사람이에요.`);
  }
  for (const el of ELEMENTS) {
    if (me.elements[el] === 0 && other.elements[el] >= 2) {
      lines.push(`나는 ${EL_NAME[el]} 기운이 하나도 없는데 상대는 ${other.elements[el]}개나 있어요. ${EL_NAME[el]} 기운은 ${이라(EL_MEANING[el])}, 나에게 없는 부분을 자연스럽게 채워줘요.`);
    } else if (other.elements[el] === 0 && me.elements[el] >= 2) {
      lines.push(`상대에게 없는 ${EL_NAME[el]} 기운을 내가 ${me.elements[el]}개 갖고 있어요. ${EL_NAME[el]} 기운은 ${이라(EL_MEANING[el])}, 내가 옆에 있으면 상대가 든든해해요.`);
    }
  }
  const { score } = pairScore(me, other);
  const fallback = score < 0
      ? `태어난 날의 동물이 ${와(ANIMAL_OF[me.dayBranch])} ${ANIMAL_OF[other.dayBranch]}처럼 서로 반대편이라 성향이 달라요. 처음엔 어색해도 내가 못 보던 면을 보여줘서 얘기할수록 재밌는 사이예요.`
      : myEl === otherEl
        ? `둘 다 ${myEl} 기운을 타고난 사람이에요. 성향이 닮아서 말하지 않아도 통하는 게 있고, 부담 없이 편하게 어울릴 수 있어요.`
        : `나는 ${myEl}, 상대는 ${otherEl} 기운의 사람이에요. 크게 부딪히는 기운이 없어서 부담 없이 편하게 어울릴 수 있어요.`;
  if (!lines.length) lines.push(fallback);
  // 같은 기본 문장이 조 안에서 겹칠 때 쓰는 그 사람만의 문장
  const animal = ANIMAL_OF[other.dayBranch];
  const alt = `상대는 태어난 날의 동물이 ${animal}${batchim(animal) ? '이에요' : '예요'}. 나와 다른 리듬을 가진 사람이라, 같이 있으면 내가 몰랐던 새로운 면을 보게 돼요.`;
  return { score, lines, fallback, alt };
}

/**
 * 조원별 궁합 문장에서 같은 문장이 여러 번 나오지 않게 정리한다.
 * 그 사람에게만 해당하는 문장을 먼저 보여 주고, 여러 명에게 겹치는 문장은 처음 한 번만 쓴다.
 * @param {{lines: string[], fallback: string}[]} stories 궁합이 잘 맞는 순서로 정렬된 조원별 문장
 */
export function arrangeStories(stories) {
  const count = new Map();
  for (const st of stories) for (const l of new Set(st.lines)) count.set(l, (count.get(l) ?? 0) + 1);
  const shown = new Set();
  return stories.map((st) => {
    const own = st.lines.filter((l) => count.get(l) === 1);
    const shared = st.lines.filter((l) => count.get(l) > 1 && !shown.has(l));
    const lines = [...own, ...shared];
    lines.forEach((l) => shown.add(l));
    if (lines.length) return lines;
    // 다른 조원에게 이미 쓰였거나 뒤에 나올 문장은 피한다
    const extra = [st.fallback, st.alt].find((l) => l && !shown.has(l) && !count.has(l)) ?? st.alt ?? st.fallback;
    shown.add(extra);
    return [extra];
  });
}

/** 조 전체 오행을 더해 가장 강한 기운과 빠진 기운을 쉬운 말로. */
export function groupEnergy(members) {
  const total = Object.fromEntries(ELEMENTS.map((el) => [el, members.reduce((s, m) => s + (m.elements[el] ?? 0), 0)]));
  const strongest = [...ELEMENTS].sort((x, y) => total[y] - total[x])[0];
  const missing = ELEMENTS.filter((el) => total[el] === 0);
  const MOOD = {
    목: '새로운 걸 시작하길 좋아하는 도전형',
    화: '분위기가 뜨겁고 텐션 높은 파티형',
    토: '편안하고 든든한 수다형',
    금: '계획적이고 깔끔한 실속형',
    수: '대화가 깊어지는 새벽 감성형',
  };
  const summary = `우리 조는 ${EL_NAME[strongest]} 기운이 가장 강한 ${MOOD[strongest]} 조예요.`;
  const balance = missing.length
    ? ` ${missing.map((el) => EL_NAME[el]).join('·')} 기운은 조금 아쉬워요.`
    : ' 나무·불·흙·쇠·물 다섯 기운이 모두 모여 균형이 좋아요.';
  return { total, text: summary + balance };
}

/**
 * 조별 인원. 기본은 5명씩이고, 남는 사람은 4명 조를 만드는 대신 기존 조에 붙여 6명 조로 만든다(최대 6명).
 * 예: 27 → [6,6,5,5,5], 23 → [6,6,6,5], 25 → [5,5,5,5,5], 9 → [5,4]
 */
export function groupSizes(n, target = 5, max = 6) {
  const count = Math.max(1, Math.floor(n / target), Math.ceil(n / max));
  const base = Math.floor(n / count);
  return Array.from({ length: count }, (_, i) => base + (i < n % count ? 1 : 0));
}

/** 조마다 여자·남자를 몇 명씩 넣을지. 예: 여 15, 남 10, 5조 → 모든 조 여 3·남 2 */
export function genderPlan(people) {
  const sizes = groupSizes(people.size);
  const females = [...people.values()].filter((p) => p.gender === 'female').length;
  const k = sizes.length;
  const f = Array.from({ length: k }, (_, i) => Math.floor(females / k) + (i < females % k ? 1 : 0));
  // 큰 조에 여자를 더 많이 배정하되 남자 수도 조마다 고르게 맞춘다.
  return sizes.map((n, i) => ({ size: n, female: f[i], male: n - f[i] }));
}

/**
 * 편성안을 검사하고 점수를 매긴다.
 * @param {string[][]} groups
 * @param {Map<string, Person>} people
 */
export function evaluateGroups(groups, people) {
  const errors = [];
  const seen = new Set();
  for (const g of groups) {
    for (const id of g) {
      if (!people.has(id)) errors.push(`없는 번호: ${id}`);
      if (seen.has(id)) errors.push(`중복 배정: ${id}`);
      seen.add(id);
    }
  }
  for (const id of people.keys()) if (!seen.has(id)) errors.push(`빠진 사람: ${id}`);
  const expected = groupSizes(people.size).sort().join(',');
  const actual = groups.map((g) => g.length).sort().join(',');
  if (expected !== actual) errors.push(`조 인원은 [${expected}]이어야 하는데 [${actual}]이에요`);

  const plan = genderPlan(people);
  const females = plan.map((p) => p.female);
  const [fMin, fMax] = [Math.min(...females), Math.max(...females)];
  const males = plan.map((p) => p.male);
  const [mMin, mMax] = [Math.min(...males), Math.max(...males)];
  groups.forEach((g, i) => {
    const f = g.filter((id) => people.get(id)?.gender === 'female').length;
    const m = g.length - f;
    if (f < fMin || f > fMax || m < mMin || m > mMax) {
      errors.push(`${i + 1}번째 조 성비가 여 ${f}·남 ${m}이에요. 조마다 여 ${fMin === fMax ? fMin : `${fMin}~${fMax}`}·남 ${mMin === mMax ? mMin : `${mMin}~${mMax}`}명이어야 해요`);
    }
  });

  const detail = groups.map((g) => {
    let total = 0;
    for (let i = 0; i < g.length; i += 1) {
      for (let j = i + 1; j < g.length; j += 1) {
        if (people.has(g[i]) && people.has(g[j])) total += pairScore(people.get(g[i]), people.get(g[j])).score;
      }
    }
    const female = g.filter((id) => people.get(id)?.gender === 'female').length;
    // 조 인원이 다르면 짝 수가 달라서(5명 10쌍, 6명 15쌍) 합계로 비교하면 작은 조가 늘 낮다. 그래서 한 쌍 평균으로 비교한다.
    const pairs = (g.length * (g.length - 1)) / 2;
    const average = pairs ? Math.round((total / pairs) * 10) / 10 : 0;
    return { members: g, score: total, average, female, male: g.length - female };
  });
  const totalScore = detail.reduce((s, d) => s + d.score, 0);
  const lowestGroup = Math.min(...detail.map((d) => d.score));
  const lowestAverage = Math.min(...detail.map((d) => d.average));
  // 편성 목표: 전체 궁합 합계를 높이되, 가장 약한 조의 평균도 끌어올린다.
  const objective = totalScore + FAIRNESS_WEIGHT * lowestAverage;
  return { valid: errors.length === 0, errors, totalScore, lowestGroup, lowestAverage, objective, groups: detail };
}

/** 코드만으로 찾은 기준선 편성. 무작위 시작 + 맞바꾸기로 총점을 최대화한다. */
export function baselineGrouping(people, { restarts = 40, seed = 1 } = {}) {
  const ids = [...people.keys()];
  const plan = genderPlan(people);
  let s = seed;
  const rand = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  const score = (gs) => evaluateGroups(gs, people).objective;

  let best = null;
  let bestScore = -Infinity;
  for (let r = 0; r < restarts; r += 1) {
    // 성비를 먼저 맞춰 나눈 뒤, 같은 성별끼리만 맞바꿔서 성비가 깨지지 않게 한다.
    const fs = ids.filter((id) => people.get(id).gender === 'female').sort(() => rand() - 0.5);
    const ms = ids.filter((id) => people.get(id).gender !== 'female').sort(() => rand() - 0.5);
    let fi = 0;
    let mi = 0;
    let groups = plan.map((p) => [...fs.slice(fi, (fi += p.female)), ...ms.slice(mi, (mi += p.male))]);
    let current = score(groups);
    let improved = true;
    while (improved) {
      improved = false;
      for (let g1 = 0; g1 < groups.length; g1 += 1) {
        for (let g2 = g1 + 1; g2 < groups.length; g2 += 1) {
          for (let i = 0; i < groups[g1].length; i += 1) {
            for (let j = 0; j < groups[g2].length; j += 1) {
              if (people.get(groups[g1][i]).gender !== people.get(groups[g2][j]).gender) continue;
              const next = groups.map((g) => [...g]);
              [next[g1][i], next[g2][j]] = [next[g2][j], next[g1][i]];
              const nextScore = score(next);
              if (nextScore > current) { groups = next; current = nextScore; improved = true; }
            }
          }
        }
      }
    }
    if (current > bestScore) { best = groups; bestScore = current; }
  }
  return evaluateGroups(best, people);
}
