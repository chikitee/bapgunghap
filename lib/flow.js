// 나의 기운(센 편·부드러운 편), 10년 단위 인생 흐름(대운), 2027년 월별 하이라이트를 쉬운 말로 풀이한다.
// 낮은 시기를 겁주는 말은 넣지 않고, 시기마다 "이럴 때 힘이 난다"는 식의 장점 위주로 쓴다. 재미로 보는 풀이다.
import { getTenGod, getBranchTenGod } from 'manseryeok';

const GROUP_OF = {
  비견: '비겁', 겁재: '비겁', 식신: '식상', 상관: '식상',
  편재: '재성', 정재: '재성', 편관: '관성', 정관: '관성', 편인: '인성', 정인: '인성',
};
const STEM_ELEMENT = { 갑: '목', 을: '목', 병: '화', 정: '화', 무: '토', 기: '토', 경: '금', 신: '금', 임: '수', 계: '수' };
const GENERATES = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' };
const GENERATED_BY = { 화: '목', 토: '화', 금: '토', 수: '금', 목: '수' };
const EL_NAME = { 목: '나무', 화: '불', 토: '흙', 금: '쇠', 수: '물' };
const EL_LIFE = {
  목: '새로운 걸 시작하고 계획을 세울 때',
  화: '사람을 만나고 내 생각을 표현할 때',
  토: '규칙적인 루틴으로 생활을 안정시킬 때',
  금: '주변을 정리하고 하나를 끝까지 마무리할 때',
  수: '혼자 쉬면서 생각을 정리하고 배울 때',
};

/** 나를 돕는 기운(비겁·인성)이 전체의 40% 이상이면 센 편. 태어난 달의 지지는 두 배로 센다. */
export function strengthOf(saju) {
  let support = 0;
  let total = 0;
  for (const pos of ['year', 'month', 'day', 'hour']) {
    if (pos === 'hour' && !saju.timeKnown) continue;
    for (const part of ['stem', 'branch']) {
      const g = GROUP_OF[saju.tenGods[pos][part]];
      if (!g) continue;
      const w = pos === 'month' && part === 'branch' ? 2 : 1;
      total += w;
      if (g === '비겁' || g === '인성') support += w;
    }
  }
  return support * 10 >= total * 4 ? 'strong' : 'soft';
}

// 센 사주는 기운을 내보내고 쓰는 시기(식상·재성·관성)가, 부드러운 사주는 채워주는 시기(비겁·인성)가 힘이 된다.
function helps(strength, group) {
  return strength === 'strong' ? ['식상', '재성', '관성'].includes(group) : ['비겁', '인성'].includes(group);
}

const DECADE_THEME = {
  비겁: ['동료의 시기', '좋은 친구와 동료가 모여들어요. 함께하는 일에서 내 자리가 단단해져요.'],
  식상: ['표현의 시기', '재능과 아이디어가 밖으로 드러나요. 내 이름이 담긴 결과물을 만들기 좋아요.'],
  재성: ['결실의 시기', '해온 일이 돈과 성과로 돌아와요. 현실 감각이 가장 날카로워져요.'],
  관성: ['도약의 시기', '책임 있는 자리와 인정이 따라와요. 커리어가 한 단계 올라가는 흐름이에요.'],
  인성: ['배움의 시기', '귀인과 스승을 만나고 실력을 깊게 채워요. 다음 도약을 위한 힘을 모으는 때예요.'],
};

// 회계사 커리어 단계(대략적인 나이대)마다 그 10년의 기운이 어떻게 나타나는지
const STAGE = (from) => (from < 20 ? 'study' : from < 30 ? 'junior' : from < 40 ? 'senior' : 'lead');
const DECADE_CAREER = {
  study: {
    비겁: '같이 공부하는 친구들이 큰 힘이 되는 때예요.',
    식상: '하고 싶은 게 뚜렷해지고 재능이 보이기 시작해요.',
    재성: '숫자와 돈의 흐름에 관심이 생기는 때예요.',
    관성: '목표를 세우고 시험을 준비하는 힘이 길러져요.',
    인성: '공부 머리가 트이고 좋은 선생님을 만나요.',
  },
  junior: {
    비겁: '동기들과 함께 수습과 첫 시즌을 버티며 평생 인맥이 생겨요.',
    식상: '스태프 때부터 보고서와 아이디어로 눈에 띄어요.',
    재성: '실무 감각이 빨리 붙어서 현장에서 금방 인정받아요.',
    관성: '시험, 입사, 첫 평가처럼 공식적인 결과가 잘 나오는 때예요.',
    인성: '좋은 시니어와 매니저를 만나 기본기를 단단히 다져요.',
  },
  senior: {
    비겁: '내 팀이 생기고 믿고 따르는 후배들이 늘어나요.',
    식상: '전문 분야가 생기고 강의, 자문처럼 내 이름으로 하는 일이 늘어요.',
    재성: '딜과 프로젝트를 직접 따오고 성과가 연봉으로 돌아와요.',
    관성: '매니저, 시니어 매니저로 올라가며 책임 있는 자리를 맡아요.',
    인성: '대학원, 해외 연수처럼 한 단계 더 배우며 전문성을 키워요.',
  },
  lead: {
    비겁: '독립하거나 내 사무소를 열기 좋은 때예요.',
    식상: '후배를 가르치고 업계에 이름을 알리는 때예요.',
    재성: '그동안 쌓은 경험이 큰 결실로 돌아와요.',
    관성: '파트너, 임원처럼 조직을 이끄는 자리와 인연이 있어요.',
    인성: '멘토로서 존경받고 여유 있게 일하는 때예요.',
  },
};

// 10년 중 앞 5년(천간)·뒤 5년(지지)에 들어오는 기운을 한 줄로
const HALF_TEXT = {
  비겁: '동료의 기운: 함께하는 사람이 늘고 자신감이 붙어요.',
  식상: '표현의 기운: 말, 글, 아이디어가 잘 풀려요.',
  재성: '결실의 기운: 해온 만큼 성과와 보상이 따라와요.',
  관성: '인정의 기운: 평가, 자리, 책임이 나를 찾아와요.',
  인성: '배움의 기운: 공부가 잘 되고 도와주는 사람이 생겨요.',
};
// 그 10년을 잘 쓰는 방법
const DECADE_TIP = {
  비겁: '스터디, 동기 모임처럼 함께하는 자리를 늘려 보세요.',
  식상: '보고서, 발표, 글처럼 내 이름이 남는 결과물을 만들어 보세요.',
  재성: '연봉과 조건을 챙기고, 돈 공부를 시작하기 좋은 때예요.',
  관성: '승진, 자격, 평가처럼 공식적인 도전에 나서 보세요.',
  인성: '자격증, 대학원, 멘토 찾기처럼 실력을 채우는 데 투자해 보세요.',
};
const BRANCH_ELEMENT = { 자: '수', 축: '토', 인: '목', 묘: '목', 진: '토', 사: '화', 오: '화', 미: '토', 신: '금', 유: '금', 술: '토', 해: '수' };

const MONTH_THEME = {
  비겁: ['동료운', '든든한 내 편이 생기는 달이에요. 함께 준비하는 사람들과 시너지가 커요.'],
  식상: ['표현운', '말과 글이 잘 통하는 달이에요. 면접, 발표, 자기소개처럼 나를 보여주는 일에 좋아요.'],
  재성: ['실속운', '일한 만큼 보상이 따라오는 달이에요. 좋은 조건과 기회를 알아보는 눈이 밝아져요.'],
  관성: ['합격·인정운', '공식적인 결과에 운이 따르는 달이에요. 시험, 평가, 발표가 있다면 기대해도 좋아요.'],
  인성: ['공부·귀인운', '공부가 잘 되고 도와주는 사람이 나타나는 달이에요. 좋은 선배나 멘토와 인연이 닿아요.'],
};

// 2026년 남은 두 달(MT 이후). 절기 기준: 입동 11/7, 대설 12/7, 소한 2027/1/5
const REST_2026 = [
  ['11월 7일 ~ 12월 6일', '기해'],
  ['12월 7일 ~ 연말', '경자'],
];
const REST_TYPE = {
  비겁: '사람을 만나면 좋은 시기',
  식상: '나를 보여주면 좋은 시기',
  재성: '경험을 쌓기 좋은 시기',
  관성: '스펙업 시기',
  인성: '나에게 집중할 시기',
};
const REST_TODO = {
  비겁: ['학회, 동기 모임에 자주 얼굴을 비추면 좋은 인연이 생겨요.', '혼자보다 같이 하는 계획(여행, 스터디, 운동)이 오래가요.'],
  식상: ['블로그, 포트폴리오처럼 내 이야기를 정리해 두기 좋아요.', '하고 싶은 말을 아끼지 말고 표현할수록 기회가 와요.'],
  재성: ['인턴, 실습, 아르바이트처럼 실무 경험을 쌓기 좋아요.', '돈과 시간 쓰는 법을 점검하고 내년 계획을 세워 보세요.'],
  관성: ['어학, 엑셀, 데이터 분석처럼 이력서에 한 줄 더할 스펙을 챙기기 좋아요.', '목표를 하나 정해 끝까지 해내면 자신감이 크게 붙어요.'],
  인성: ['책이나 강의로 관심 분야를 깊게 파기 좋아요.', '무리한 약속은 줄이고 충분히 쉬면서 나를 채워 보세요.'],
};

// 2027년(정미년)의 월 간지. 절기 기준이라 각 달은 대략 그 달 4~8일쯤 시작한다.
const MONTHS_2027 = [
  [2, '임인'], [3, '계묘'], [4, '갑진'], [5, '을사'], [6, '병오'], [7, '정미'],
  [8, '무신'], [9, '기유'], [10, '경술'], [11, '신해'], [12, '임자'],
];

function pillarScore(dm, strength, stem, branch) {
  const gs = GROUP_OF[getTenGod(dm, stem)];
  const gb = GROUP_OF[getBranchTenGod(dm, branch)];
  return { gs, gb, score: (helps(strength, gs) ? 1 : 0) + (helps(strength, gb) ? 1.2 : 0) };
}

/**
 * @param {object} saju computeSaju 결과(gender를 넣어 계산하면 luckPillars가 있다)
 * @param {number} birthYear 양력 출생 연도
 */
export function readFlow(saju, birthYear) {
  const dm = saju.dayMaster;
  const strength = strengthOf(saju);
  const myEl = STEM_ELEMENT[dm];
  const helpEl = strength === 'strong' ? GENERATES[myEl] : GENERATED_BY[myEl];

  const energy = strength === 'strong'
    ? {
      title: '에너지가 넘치는 직진형',
      body: '나를 받쳐주는 기운이 넉넉한 사주예요. 스스로 결정하고 밀고 나갈 때 가장 나다워요. 넘치는 힘을 밖으로 쓸수록 운이 더 잘 돌아요.',
    }
    : {
      title: '주변과 함께 커지는 흡수형',
      body: '주변의 좋은 기운을 잘 받아들이는 사주예요. 좋은 사람, 좋은 환경을 만나면 실력이 빠르게 늘어요. 혼자 버티기보다 기대고 나눌 때 운이 열려요.',
    };
  energy.help = `${EL_NAME[helpEl]} 기운이 힘이 돼요. ${EL_LIFE[helpEl]} 컨디션이 가장 좋아져요.`;

  // 10년 단위 흐름: 10대부터 70대까지 보여 준다
  let decades = [];
  const lp = saju.luckPillars?.pillars ?? [];
  const nowAge = 2026 - birthYear + 1; // 대운 나이는 세는 나이 기준으로 본다
  for (const p of lp) {
    if (p.age + 9 < 15) continue;
    const { gs, gb, score } = pillarScore(dm, strength, p.pillar.heavenlyStem, p.pillar.earthlyBranch);
    const group = score > 0 ? (helps(strength, gb) ? gb : gs) : gb;
    const [name, body] = DECADE_THEME[group];
    const stem = p.pillar.heavenlyStem;
    const branch = p.pillar.earthlyBranch;
    const y0 = birthYear + p.age - 1; // 세는 나이 → 연도
    const half = (label, g, from, el) => ({
      label, years: `${from}~${from + 4}`, el: EL_NAME[el], text: HALF_TEXT[g],
      note: helps(strength, g) ? '특히 힘이 잘 붙는 5년이에요.' : '차분히 기본기를 다지는 5년이에요.',
    });
    const now = nowAge >= p.age && nowAge <= p.age + 9;
    decades.push({
      from: p.age, to: p.age + 9, years: `${y0}~${y0 + 9}`, ganzhi: stem + branch,
      elements: `${EL_NAME[STEM_ELEMENT[stem]]} + ${EL_NAME[BRANCH_ELEMENT[branch]]}`,
      name, body, career: DECADE_CAREER[STAGE(p.age)][group], tip: DECADE_TIP[group],
      halves: [half('앞 5년', gs, y0, STEM_ELEMENT[stem]), half('뒤 5년', gb, y0 + 5, BRANCH_ELEMENT[branch])],
      nowHalf: now ? (nowAge < p.age + 5 ? 0 : 1) : null,
      score, now,
    });
  }
  decades = decades.slice(0, 6);
  // 낮은 시기도 0으로 보이지 않게 55~100 사이로 그린다
  const max = Math.max(...decades.map((d) => d.score), 0.1);
  for (const d of decades) d.level = Math.round(55 + (d.score / max) * 45);
  // 황금기는 사회생활을 시작한 뒤(20세 이후 포함 구간)에서 고른다
  const adult = decades.filter((d) => d.to >= 25);
  const peak = adult.reduce((a, b) => (b.score > a.score ? b : a), adult[0]);
  if (peak) peak.peak = true;

  // 2027년 월별: 힘이 되는 달 3개를 고른다
  const seed = [...saju.pillars.day, ...(saju.pillars.hour ?? '')].reduce((n, ch) => n + ch.charCodeAt(0), 0);
  const tie = (i) => (i * 7 + seed) % 11;
  // 점수가 높은 달부터, 되도록 서로 다른 이야기가 나오게 3개를 고른다
  const ranked = MONTHS_2027
    .map(([m, gz], i) => {
      const x = pillarScore(dm, strength, gz[0], gz[1]);
      return { m, i, score: x.score, theme: helps(strength, x.gb) ? x.gb : x.gs };
    })
    // 점수가 같으면 사람마다 다른 달이 나오도록 일주로 정한 순서로 고른다
    .sort((a, b) => b.score - a.score || tie(a.i) - tie(b.i));
  const picked = [];
  // 겹치지 않게 고르는 건 실제로 나를 돕는 기운이 들어오는 달(점수 > 0) 안에서만 한다
  for (const x of ranked) if (x.score > 0 && picked.length < 3 && !picked.some((p) => p.theme === x.theme)) picked.push(x);
  for (const x of ranked) if (picked.length < 3 && !picked.includes(x)) picked.push(x);
  const months = picked.sort((a, b) => a.m - b.m).map((x) => ({ month: x.m, label: MONTH_THEME[x.theme][0], body: MONTH_THEME[x.theme][1] }));

  const intro = {
    start: saju.luckPillars?.startAge ?? null,
    why: strength === 'strong'
      ? '에너지가 넘치는 사주라, 힘을 밖으로 쓰게 해 주는 표현·결실·인정의 기운이 들어올 때 막대가 높아져요.'
      : '흡수형 사주라, 나를 채워 주는 동료·배움의 기운이 들어올 때 막대가 높아져요.',
  };

  // 2026년 남은 두 달: 그 달의 하늘 기운(천간)과 땅 기운(지지)에서 하나씩 할 일을 뽑는다
  // 두 달 사이에 같은 문장이 반복되지 않게, 묶음마다 아직 안 쓴 문장을 고른다
  const used = new Set();
  const pick = (g, prefer) => {
    const t = [REST_TODO[g][prefer], REST_TODO[g][1 - prefer]].find((x) => !used.has(x)) ?? REST_TODO[g][prefer];
    used.add(t);
    return t;
  };
  const GROUP_WORD = { 비겁: '동료의 기운(비겁)', 식상: '표현의 기운(식상)', 재성: '실속의 기운(재성)', 관성: '인정의 기운(관성)', 인성: '배움의 기운(인성)' };
  const rest = REST_2026.map(([period, gz]) => {
    const x = pillarScore(dm, strength, gz[0], gz[1]);
    const theme = helps(strength, x.gb) ? x.gb : x.gs;
    const todo = [pick(x.gs, 0), pick(x.gb, 1)];
    const basis = x.gs === x.gb
      ? `근거: ${gz}월의 두 글자가 모두 내게 ${GROUP_WORD[x.gs]}이에요.`
      : `근거: ${gz}월의 '${gz[0]}'(${EL_NAME[STEM_ELEMENT[gz[0]]]}) 글자는 내게 ${GROUP_WORD[x.gs]}, '${gz[1]}'(${EL_NAME[BRANCH_ELEMENT[gz[1]]]}) 글자는 ${GROUP_WORD[x.gb]}이에요.`;
    return {
      period, ganzhi: gz, label: REST_TYPE[theme], todo, basis,
      note: x.score > 0 ? '나에게 힘이 되는 기운이 들어와서 속도를 내기 좋은 때예요.' : '차분히 기본기를 다지면 내년에 크게 돌아오는 때예요.',
    };
  });

  return { strength, energy, intro, decades, rest, months };
}
