// 나와 잘 맞는 상대의 사주를 규칙으로 계산한다. 성별이나 다른 참여자 정보는 쓰지 않는다.
import { getHeavenlyStemElement, getEarthlyBranchElement } from 'manseryeok';

// 천간합: 서로 끌리는 일간 짝
const STEM_COMBINE = { 갑: '기', 기: '갑', 을: '경', 경: '을', 병: '신', 신: '병', 정: '임', 임: '정', 무: '계', 계: '무' };
// 지지 육합: 생활 리듬이 맞는 일지 짝
const BRANCH_COMBINE = { 자: '축', 축: '자', 인: '해', 해: '인', 묘: '술', 술: '묘', 진: '유', 유: '진', 사: '신', 신: '사', 오: '미', 미: '오' };
// 지지 충: 부딪히기 쉬운 일지
const BRANCH_CLASH = { 자: '오', 오: '자', 축: '미', 미: '축', 인: '신', 신: '인', 묘: '유', 유: '묘', 진: '술', 술: '진', 사: '해', 해: '사' };

const ELEMENTS = ['목', '화', '토', '금', '수'];

/**
 * @param {{pillars: {day: string}, elements: Record<string, number>}} saju computeSaju 결과
 */
export function findIdealMatch(saju) {
  const [myStem, myBranch] = saju.pillars.day;
  const stem = STEM_COMBINE[myStem];
  const branch = BRANCH_COMBINE[myBranch];

  const min = Math.min(...ELEMENTS.map((e) => saju.elements[e]));
  const lacking = ELEMENTS.filter((e) => saju.elements[e] === min);

  return {
    pillar: stem + branch,
    stem,
    branch,
    stemElement: getHeavenlyStemElement(stem),
    branchElement: getEarthlyBranchElement(branch),
    lacking,
    lackingCount: min,
    clashBranch: BRANCH_CLASH[myBranch],
  };
}
