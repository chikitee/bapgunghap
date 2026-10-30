// 두 사람의 궁합 점수를 규칙으로 계산하고, 코드만으로 찾은 최적 편성(기준선)을 구한다.
// AI 에이전트는 이 함수들을 도구로 호출해서 판단한다. 점수 자체는 AI가 만들지 않는다.

const STEM_COMBINE = { 갑: '기', 기: '갑', 을: '경', 경: '을', 병: '신', 신: '병', 정: '임', 임: '정', 무: '계', 계: '무' };
const BRANCH_COMBINE = { 자: '축', 축: '자', 인: '해', 해: '인', 묘: '술', 술: '묘', 진: '유', 유: '진', 사: '신', 신: '사', 오: '미', 미: '오' };
const BRANCH_CLASH = { 자: '오', 오: '자', 축: '미', 미: '축', 인: '신', 신: '인', 묘: '유', 유: '묘', 진: '술', 술: '진', 사: '해', 해: '사' };
const GENERATES = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' };
const CONTROLS = { 목: '토', 토: '수', 수: '화', 화: '금', 금: '목' };
const ELEMENTS = ['목', '화', '토', '금', '수'];

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

/** n명을 5명 기준으로 나눌 때 조별 인원. 예: 10 → [5,5], 12 → [6,6], 13 → [5,4,4] */
export function groupSizes(n, target = 5) {
  const count = Math.max(1, Math.round(n / target));
  const base = Math.floor(n / count);
  return Array.from({ length: count }, (_, i) => base + (i < n % count ? 1 : 0));
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

  const detail = groups.map((g) => {
    let total = 0;
    for (let i = 0; i < g.length; i += 1) {
      for (let j = i + 1; j < g.length; j += 1) {
        if (people.has(g[i]) && people.has(g[j])) total += pairScore(people.get(g[i]), people.get(g[j])).score;
      }
    }
    const female = g.filter((id) => people.get(id)?.gender === 'female').length;
    return { members: g, score: total, female, male: g.length - female };
  });
  const totalScore = detail.reduce((s, d) => s + d.score, 0);
  const lowestGroup = Math.min(...detail.map((d) => d.score));
  return { valid: errors.length === 0, errors, totalScore, lowestGroup, groups: detail };
}

/** 코드만으로 찾은 기준선 편성. 무작위 시작 + 맞바꾸기로 총점을 최대화한다. */
export function baselineGrouping(people, { restarts = 40, seed = 1 } = {}) {
  const ids = [...people.keys()];
  const sizes = groupSizes(ids.length);
  let s = seed;
  const rand = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  const score = (gs) => evaluateGroups(gs, people).totalScore;

  let best = null;
  let bestScore = -Infinity;
  for (let r = 0; r < restarts; r += 1) {
    const shuffled = [...ids].sort(() => rand() - 0.5);
    let k = 0;
    let groups = sizes.map((n) => shuffled.slice(k, (k += n)));
    let current = score(groups);
    let improved = true;
    while (improved) {
      improved = false;
      for (let g1 = 0; g1 < groups.length; g1 += 1) {
        for (let g2 = g1 + 1; g2 < groups.length; g2 += 1) {
          for (let i = 0; i < groups[g1].length; i += 1) {
            for (let j = 0; j < groups[g2].length; j += 1) {
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
