// 학회원 대부분이 회계사 시험 합격·유예생이라, 직업운을 회계법인 입사 부서(감사·세무·딜·컨설팅)와 그다음 커리어(파트너·이직·개업)에 맞춰 풀이한다.
// 십성 다섯 묶음의 개수로 잘 맞는 분야를, 나를 돕는 기운의 양(직진형·균형형·흡수형)으로 일하는 스타일을 고른다.
// 모두 장점 위주로 쓰고, 특정 분야가 안 맞는다는 말은 하지 않는다. 재미로 보는 풀이다.
import { getTenGod } from 'manseryeok';
import { strengthOf, readFlow } from './flow.js';

const GROUP_OF = {
  비견: '비겁', 겁재: '비겁', 식신: '식상', 상관: '식상',
  편재: '재성', 정재: '재성', 편관: '관성', 정관: '관성', 편인: '인성', 정인: '인성',
};

const FIELD = {
  관성: {
    name: '감사(Assurance)',
    title: '원칙으로 신뢰를 만드는 감사인',
    body: '기준과 책임을 중요하게 여기는 기운이 강해요. 숫자 하나도 근거를 확인하고 넘어가는 꼼꼼함이 감사 현장에서 큰 무기가 돼요. 시니어, 매니저로 올라가며 팀을 이끄는 자리에서 특히 인정받는 흐름이에요.',
  },
  인성: {
    name: '세무(Tax)',
    title: '법령을 깊게 파는 세무 전문가',
    body: '배우고 파고드는 기운이 강해요. 복잡한 세법과 예규를 끝까지 읽어내고 정리하는 힘이 있어서, 세무 자문이나 회계 기준 해석처럼 깊이가 실력이 되는 일에서 빛나요.',
  },
  재성: {
    name: '딜(M&A·가치평가)',
    title: '숫자 속 기회를 읽는 딜 전문가',
    body: '돈의 흐름과 기회를 읽는 기운이 강해요. 기업 가치를 매기고 거래 구조를 짜는 딜 업무에서 감각이 살아나요. 성과가 숫자로 바로 보이는 일일수록 동기부여가 커지는 타입이에요.',
  },
  식상: {
    name: '컨설팅·디지털',
    title: '문제를 풀어 보여주는 컨설턴트',
    body: '생각을 결과물로 만들어 보여주는 기운이 강해요. 문제를 정의하고 보고서와 발표로 설득하는 컨설팅, 새로운 도구로 일하는 방식을 바꾸는 디지털·AI 업무에서 재능이 드러나요.',
  },
  비겁: {
    name: '개업·리더',
    title: '내 이름을 거는 독립형 회계사',
    body: '주도적으로 판단할 때 힘이 나는 기운이 강해요. 경험을 쌓은 뒤 내 사무소를 열거나, 스타트업 CFO처럼 결정권을 갖는 자리에서 크게 성장하는 흐름이에요.',
  },
};
// 입사 부서를 더 자세히: 이런 순간에 강해요
const FIELD_DETAIL = {
  관성: {
    strengths: ['정해진 기준에 맞춰 하나씩 확인하는 일을 끝까지 해내요.', '클라이언트에게 필요한 자료를 정중하지만 단호하게 요청할 수 있어요.', '팀의 일정과 품질을 함께 챙기는 시니어 역할이 잘 어울려요.'],
  },
  인성: {
    strengths: ['세법, 예규, 판례를 끝까지 읽고 근거를 찾아내요.', '복잡한 규정을 클라이언트가 이해하기 쉽게 정리해 줘요.', '한 분야를 깊게 파서 "이건 저 사람한테 물어봐" 소리를 듣는 전문가 타입이에요.'],
  },
  재성: {
    strengths: ['숫자 속에서 돈이 되는 포인트를 빨리 찾아내요.', '마감이 정해진 프로젝트에서 집중력이 확 올라가요.', '성과가 딜 성사로 바로 보여서 동기부여가 커요.'],
  },
  식상: {
    strengths: ['복잡한 상황을 한 장짜리 그림으로 정리해 보여줘요.', '새로운 도구와 방법을 빨리 익혀 일하는 방식을 바꿔요.', '발표와 인터뷰에서 내 생각을 설득력 있게 전달해요.'],
  },
};

// 그다음 커리어를 더 자세히: 이 길에서 내가 가진 무기
const PATH_DETAIL = {
  partner: {
    weapon: '윗사람과 고객이 믿고 맡기는 안정감이 가장 큰 무기예요.',
  },
  move: {
    weapon: '새로운 환경에 빨리 적응하고 기회를 먼저 알아보는 감각이 무기예요.',
  },
  own: {
    weapon: '스스로 판단하고 밀고 나가는 추진력이 무기예요.',
  },
};
const PATH_NAME = { partner: '파트너예요', move: '이직이에요', own: '개업·독립이에요' };

const BASIS = {
  관성: '원칙과 책임을 뜻하는 기운(관성)',
  인성: '배우고 깊이 파는 기운(인성)',
  재성: '돈의 흐름과 기회를 읽는 기운(재성)',
  식상: '생각을 표현하고 결과물로 만드는 기운(식상)',
  비겁: '내 뜻대로 주도하는 기운(비겁)',
};
const ORDER = ['관성', '인성', '재성', '식상', '비겁'];

const STYLE = {
  strong: {
    title: '혼자서도 판을 끌고 가는 타입',
    body: '나를 받쳐주는 기운이 넉넉해서 맡은 일을 스스로 밀고 나가는 힘이 좋아요. 담당 범위를 정해 주고 믿고 맡겨줄 때 성과가 가장 커요. 가끔은 동기에게 일을 나눠도 괜찮아요.',
  },
  balanced: {
    title: '상황 따라 역할을 바꾸는 조율 타입',
    body: '혼자 밀고 나가는 힘과 팀과 맞추는 힘이 고르게 있어요. 리드가 필요할 땐 앞에 서고, 받쳐 줄 땐 뒤에서 챙기는 유연함이 강점이에요. 팀에서 의견을 모으는 역할을 맡으면 특히 빛나요.',
  },
  soft: {
    title: '함께할 때 실력이 커지는 타입',
    body: '주변의 기운을 잘 받아들이는 사주라 좋은 팀과 선배를 만나면 성장 속도가 빨라요. 혼자 끌어안기보다 묻고 나눌수록 일이 잘 풀리고, 팀에서 분위기를 살리는 역할도 잘해요.',
  },
};

// 바쁜 시즌(감사 시즌·신고 기간)을 버티는 나만의 방법. 일간의 오행으로 고른다.
const BUSY = {
  목: '할 일을 작게 쪼개 하나씩 지워 나갈 때 힘이 나요. 진행 상황이 눈에 보이는 체크리스트를 만들어 보세요.',
  화: '사람들과 이야기하며 에너지를 충전해요. 야근 중 동기들과의 짧은 수다와 맛있는 저녁이 최고의 회복제예요.',
  토: '규칙적인 루틴이 흔들리지 않게 지켜줘요. 출근 시간, 식사, 잠만 일정하게 챙겨도 컨디션이 오래가요.',
  금: '깔끔하게 정리된 환경에서 집중력이 올라가요. 폴더와 조서를 정리하는 시간이 오히려 일을 빨리 끝내 줘요.',
  수: '중간중간 머리를 비우는 시간이 필요해요. 짧은 산책이나 음악 한 곡이 막혔던 생각을 풀어줘요.',
};

// 타고난 성격(일간)이 회계사 일에서 어떻게 드러나는지
const TRAIT = {
  갑: '앞장서서 끌고 가는 성격이라 현장에서 팀의 방향을 잡는 역할을 자연스럽게 맡아요.',
  을: '어떤 고객, 어떤 팀과도 유연하게 맞춰서 까다로운 클라이언트 응대에 강해요.',
  병: '밝고 솔직한 에너지 덕분에 클라이언트 미팅과 인터뷰에서 분위기를 풀어줘요.',
  정: '세심하게 챙기는 성격이라 놓치기 쉬운 부분을 잡아내고 후배를 잘 돌봐요.',
  무: '쉽게 흔들리지 않는 믿음직함 덕분에 바쁜 시즌에 팀이 기대는 사람이 돼요.',
  기: '현실 감각과 관리력이 좋아서 일정과 자료를 꼼꼼하게 챙기는 실무의 중심이 돼요.',
  경: '결단력 있고 할 말은 하는 성격이라 이슈가 생겼을 때 정리하고 해결하는 데 강해요.',
  신: '기준이 높고 섬세해서 조서와 보고서의 완성도가 남다르다는 말을 들어요.',
  임: '생각의 폭이 넓어 큰 그림을 보는 눈이 있어요. 복잡한 거래 구조도 빨리 이해해요.',
  계: '눈치가 빠르고 사람 마음을 잘 읽어서 클라이언트가 진짜 원하는 걸 먼저 알아채요.',
};

const STEM_ELEMENT = { 갑: '목', 을: '목', 병: '화', 정: '화', 무: '토', 기: '토', 경: '금', 신: '금', 임: '수', 계: '수' };

const EL_NAME = { 목: '나무', 화: '불', 토: '흙', 금: '쇠', 수: '물' };
const EL_MEANING = {
  목: '쭉쭉 뻗어 나가는 성장',
  화: '밖으로 퍼지는 열정과 사교성',
  토: '단단하게 버티는 꾸준함과 안정',
  금: '군더더기 없이 다듬는 정리와 결단',
  수: '흐르며 스며드는 유연함과 생각',
};
const GROUP_PLAIN = {
  비겁: '나와 같은 편이 되어 주는 기운(비겁)',
  식상: '내 능력을 밖으로 보여주는 기운(식상)',
  재성: '성과와 보상을 거두는 기운(재성)',
  관성: '인정과 책임을 가져다주는 기운(관성)',
  인성: '나를 배우게 하고 채워 주는 기운(인성)',
};

// 2027년(정미년) 천간과 나의 관계로 보는 커리어 흐름
const YEAR_2027 = {
  비겁: '동기, 스터디 메이트와 함께 성장하는 해예요. 같이 준비하고 같이 버티는 사람이 큰 힘이 돼요.',
  식상: '내 능력을 보여줄 기회가 많은 해예요. 발표나 보고서처럼 결과물을 내는 일에서 눈에 띄어요.',
  재성: '실무 감각이 확 올라가는 해예요. 현장에서 배운 것이 바로 실력과 보상으로 이어져요.',
  관성: '공식적인 결과와 인정이 따라오는 해예요. 시험, 입사, 평가처럼 결과가 나오는 일에 운이 좋아요.',
  인성: '배움이 쌓이는 해예요. 좋은 선배나 멘토를 만나 실력이 한 단계 올라가요.',
};

function countGroups(saju) {
  const counts = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  const gods = {};
  for (const pos of ['year', 'month', 'day', 'hour']) {
    if (pos === 'hour' && !saju.timeKnown) continue;
    for (const part of ['stem', 'branch']) {
      const g = GROUP_OF[saju.tenGods[pos][part]];
      if (!g) continue; // 일간 자신은 세지 않는다
      counts[g] += 1;
      gods[saju.tenGods[pos][part]] = (gods[saju.tenGods[pos][part]] ?? 0) + 1;
    }
  }
  return { counts, gods };
}

// 역마(이동) 지지: 연지나 일지의 삼합 묶음으로 본다
const HORSE = { 인: '신', 오: '신', 술: '신', 사: '해', 유: '해', 축: '해', 신: '인', 자: '인', 진: '인', 해: '사', 묘: '사', 미: '사' };
const GOEGANG = new Set(['경진', '경술', '임진', '임술', '무진', '무술']);

const PATH = {
  partner: {
    title: '한 법인에서 파트너까지 올라가는 길',
    body: '조직 안에서 신뢰를 쌓을수록 힘이 붙는 사주예요. 한 곳에서 오래 인정받으며 시니어, 매니저, 파트너로 차근차근 올라갈 때 운이 가장 크게 열려요.',
  },
  move: {
    title: '이직으로 몸값을 올리는 길',
    body: '새로운 판에서 기회를 잡을 때 힘이 나는 사주예요. 법인에서 기본기를 다진 뒤 딜 자문사, 기업 재무팀, 금융권처럼 더 좋은 조건으로 옮기며 몸값을 키우는 흐름이 잘 맞아요.',
  },
  own: {
    title: '내 이름으로 독립하는 길',
    body: '남의 결정보다 내 결정으로 움직일 때 운이 도는 사주예요. 경험과 인맥을 충분히 쌓은 뒤 개업하거나, 결정권을 쥔 자리로 가는 흐름이 잘 맞아요.',
  },
};

function careerPath(saju, counts, gods) {
  const branches = ['year', 'month', 'day', 'hour'].map((k) => saju.pillars[k]?.[1]).filter(Boolean);
  const horse = [HORSE[saju.pillars.year[1]], HORSE[saju.pillars.day[1]]].some((b) => branches.includes(b));
  const goegang = GOEGANG.has(saju.pillars.day);
  const n = (god) => gods[god] ?? 0;

  const reasons = { partner: [], move: [], own: [] };
  const score = { partner: 0, move: 0, own: 0 };
  const add = (k, pts, why) => { if (pts > 0) { score[k] += pts; reasons[k].push(why); } };

  add('partner', counts.관성 * 1.5, '조직과 직책을 뜻하는 기운(관성)');
  add('partner', n('정관'), '원칙대로 차근차근 올라가는 기운(정관)');
  add('partner', counts.인성 * 0.5, '윗사람의 신뢰와 도움을 받는 기운(인성)');
  add('move', counts.재성, '기회와 보상을 읽는 기운(재성)');
  add('move', n('편재') + n('상관'), '틀에 얽매이지 않고 새 판을 찾는 기운(편재·상관)');
  add('move', horse ? 2 : 0, '자리를 옮길수록 운이 열리는 기운(역마)');
  add('own', counts.비겁 * 1.5, '내 뜻대로 움직이려는 기운(비겁)');
  add('own', goegang ? 2 : 0, '판을 직접 이끄는 카리스마(괴강)');

  const order = ['partner', 'move', 'own'];
  const best = order.reduce((a, b) => (score[b] > score[a] ? b : a), 'partner');
  const next = order.filter((k) => k !== best).reduce((a, b) => (score[b] > score[a] ? b : a));
  return {
    ...PATH[best],
    ...PATH_DETAIL[best],
    planB: score[next] > 0
      ? `플랜 B는 ${PATH_NAME[next]}. ${reasons[next][0]}도 있어서, "${PATH[next].title}"도 충분히 열려 있어요.`
      : '',
    basis: `근거: ${reasons[best].slice(0, 2).join(', ') || '조직과 직책을 뜻하는 기운(관성)'}이 다른 기운보다 많아요.`,
  };
}

/**
 * @param {{dayMaster: string, tenGods: object, timeKnown: boolean}} saju computeSaju 결과
 */
export function readCareer(saju) {
  const { counts, gods } = countGroups(saju);
  // 입사 부서(감사·세무·딜·컨설팅) 중에서만 2개를 고른다. 개업은 그 뒤 진로라 '파트너 vs 이직 vs 개업' 카드에서 다룬다.
  const ranked = ORDER.filter((g) => g !== '비겁').sort((a, b) => counts[b] - counts[a]);
  // 가장 많은 기운과 두 번째로 많은 기운으로 잘 맞는 분야 2개를 고른다
  const [top, second] = ranked;
  const fields = [top, second].map((g, i) => ({
    rank: i + 1,
    label: FIELD[g].name,
    title: FIELD[g].title,
    body: FIELD[g].body,
    strengths: FIELD_DETAIL[g].strengths,
    basis: i === 0
      ? counts[g] > 0
        ? `근거: 회계법인 부서와 이어지는 기운 중 ${BASIS[g]}이 ${counts[g]}개로 가장 많아요.`
        : '근거: 주도하는 기운이 강해서, 원칙과 책임을 배우는 감사 현장에서 기본기를 쌓으면 크게 성장해요.'
      : counts[g] === counts[top]
        ? `근거: ${BASIS[g]}도 ${counts[g]}개로 1순위와 똑같이 많아요.`
        : counts[g] > 0
          ? `근거: ${BASIS[g]}이 ${counts[g]}개로 두 번째로 많아요.`
          : '근거: 1순위 기운을 가장 잘 살려주는 분야예요.',
  }));

  const style = STYLE[strengthOf(saju)];
  const yearGroup = GROUP_OF[getTenGod(saju.dayMaster, '정')];

  // 대운 황금기와 커리어 결정 시기를 이어 준다
  const peak = saju.luckPillars && saju.birthYear ? readFlow(saju, saju.birthYear).decades.find((d) => d.peak) : null;
  const path = careerPath(saju, counts, gods);
  if (peak) path.timing = `대운 그래프의 황금기가 ${peak.from}~${peak.to}세(${peak.years}년)예요. 승진, 이직, 독립처럼 큰 결정을 이 시기에 맞추면 힘을 받기 쉬워요.`;

  return {
    fields,
    trait: TRAIT[saju.dayMaster],
    style,
    path,
    busy: BUSY[STEM_ELEMENT[saju.dayMaster]],
    busyBasis: `근거: 나를 나타내는 글자(일간)가 '${saju.dayMaster}', 곧 ${EL_NAME[STEM_ELEMENT[saju.dayMaster]]} 기운이에요. ${EL_NAME[STEM_ELEMENT[saju.dayMaster]]} 기운은 ${EL_MEANING[STEM_ELEMENT[saju.dayMaster]]}을 뜻해서, 그 성질을 살릴 때 회복이 빨라요.`,
    year: YEAR_2027[yearGroup],
    yearBasis: `근거: 2027년은 정미년이고, 한 해를 이끄는 글자 '정'은 불 기운이에요. 이 불이 내 일간 '${saju.dayMaster}'(${EL_NAME[STEM_ELEMENT[saju.dayMaster]]})에게는 ${GROUP_PLAIN[yearGroup]}이 돼요.`,
  };
}
