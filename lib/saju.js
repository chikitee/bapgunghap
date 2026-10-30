// 사주 계산 모듈: manseryeok(한국천문연구원 기준)으로 계산하고 lunar-javascript로 교차검증한다.
import {
  calculateFourPillars,
  getHeavenlyStemElement,
  getEarthlyBranchElement,
  HEAVENLY_STEMS,
  HEAVENLY_STEMS_HANJA,
  EARTHLY_BRANCHES,
  EARTHLY_BRANCHES_HANJA,
} from 'manseryeok';
import lunar from 'lunar-javascript';

const { Solar } = lunar;
const ELEMENTS = ['목', '화', '토', '금', '수'];

// 한자 간지(예: 壬申)를 한글(임신)로 바꾼다.
function hanjaToKorean(ganzhi) {
  const stem = HEAVENLY_STEMS[HEAVENLY_STEMS_HANJA.indexOf(ganzhi[0])];
  const branch = EARTHLY_BRANCHES[EARTHLY_BRANCHES_HANJA.indexOf(ganzhi[1])];
  return stem + branch;
}

// lunar-javascript는 중국 표준시(UTC+8) 기준이라, 연주·월주는 1시간 당긴 시각으로,
// 일주·시주는 입력 시각 그대로 계산한다.
function crossCheck({ year, month, day, hour, minute }) {
  const kst = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const cst = new Date(kst.getTime() - 60 * 60 * 1000);
  const forYearMonth = Solar.fromYmdHms(
    cst.getUTCFullYear(), cst.getUTCMonth() + 1, cst.getUTCDate(),
    cst.getUTCHours(), cst.getUTCMinutes(), 0,
  ).getLunar().getEightChar();
  const forDayHour = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar().getEightChar();
  return {
    year: hanjaToKorean(forYearMonth.getYear()),
    month: hanjaToKorean(forYearMonth.getMonth()),
    day: hanjaToKorean(forDayHour.getDay()),
    hour: hanjaToKorean(forDayHour.getTime()),
  };
}

/**
 * 양력 생년월일(시각 선택)로 사주와 오행 분포를 계산한다.
 * @param {{year:number, month:number, day:number, hour?:number|null, minute?:number|null}} input
 *   hour가 null이면 시각 미상으로 보고 시주를 비운다.
 * @param {{trueSolarTime?: boolean}} options 진태양시 보정 여부(기본 true)
 */
export function computeSaju(input, { trueSolarTime = true } = {}) {
  const timeKnown = input.hour !== null && input.hour !== undefined;
  // 시각을 모르면 정오로 계산하고 시주는 버린다. 정오는 날짜 경계와 멀어 일주가 흔들리지 않는다.
  const birth = {
    year: input.year,
    month: input.month,
    day: input.day,
    hour: timeKnown ? input.hour : 12,
    minute: timeKnown ? (input.minute ?? 0) : 0,
  };

  const main = calculateFourPillars({
    ...birth,
    ...(trueSolarTime ? { trueSolarTime: {} } : {}),
  });
  const pillars = main.toObject();
  if (!timeKnown) pillars.hour = null;

  // 교차검증은 보정 전 시각 기준으로 비교한다(두 라이브러리의 보정 방식이 달라서).
  const plain = calculateFourPillars(birth).toObject();
  const other = crossCheck(birth);
  const mismatches = ['year', 'month', 'day', ...(timeKnown ? ['hour'] : [])]
    .filter((k) => plain[k] !== other[k]);

  const elements = Object.fromEntries(ELEMENTS.map((e) => [e, 0]));
  for (const key of ['year', 'month', 'day', 'hour']) {
    const p = pillars[key];
    if (!p) continue;
    elements[getHeavenlyStemElement(p[0])] += 1;
    elements[getEarthlyBranchElement(p[1])] += 1;
  }

  return {
    pillars,
    dayMaster: pillars.day[0],
    dayMasterElement: getHeavenlyStemElement(pillars.day[0]),
    elements,
    timeKnown,
    trueSolarTime,
    crossCheck: { ok: mismatches.length === 0, mismatches, reference: other },
  };
}
