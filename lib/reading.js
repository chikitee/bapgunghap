// 사주를 모르는 사람도 읽을 수 있게 성격, 연애·결혼운, 재물운, 직업운을 쉬운 말로 풀이한다.
// 십성(나와 다른 글자의 관계)을 다섯 묶음으로 세어 규칙으로 문장을 고른다. 재미로 보는 풀이다.

const GROUP_OF = {
  비견: '비겁', 겁재: '비겁',
  식신: '식상', 상관: '식상',
  편재: '재성', 정재: '재성',
  편관: '관성', 정관: '관성',
  편인: '인성', 정인: '인성',
};

const PERSONALITY = {
  갑: '곧게 뻗는 큰 나무처럼 목표가 생기면 앞장서서 끌고 가요. 정의감이 강하고 한번 맡은 일은 끝까지 책임지는 리더 스타일이에요.',
  을: '덩굴처럼 어디서든 유연하게 적응하고 사람들과 잘 어울려요. 부드러워 보여도 속은 끈질겨서 결국 원하는 걸 해내요.',
  병: '한낮의 태양처럼 밝고 솔직해서 있는 곳마다 분위기가 살아나요. 숨기는 게 없고 사람들에게 에너지를 나눠주는 타입이에요.',
  정: '촛불처럼 은은하고 따뜻해요. 세심하게 주변을 챙기고, 가까운 사람에게는 누구보다 깊은 정을 줘요.',
  무: '큰 산처럼 묵직하고 믿음직해요. 쉽게 흔들리지 않아서 주변 사람들이 기대고 싶어 하는 든든한 존재예요.',
  기: '기름진 밭처럼 사람을 품고 키워내요. 현실 감각이 좋고 살림과 관리에 강한 실속파예요.',
  경: '단단한 바위처럼 결단력이 있고 의리가 강해요. 할 말은 하는 시원한 성격이라 위기 때 빛나는 해결사예요.',
  신: '잘 다듬어진 보석처럼 섬세하고 감각이 뛰어나요. 기준이 높고 깔끔해서 결과물의 완성도가 남달라요.',
  임: '넓은 바다처럼 생각의 폭이 넓고 자유로워요. 호기심이 많고 어떤 사람이든 품을 수 있는 큰 그릇이에요.',
  계: '봄비처럼 조용히 스며드는 공감 능력자예요. 눈치가 빠르고 상상력이 풍부해서 사람 마음을 잘 읽어요.',
};

const PARTNER_BY_PALACE = {
  비겁: '친구처럼 편하고 동등한 사람',
  식상: '유쾌하고 말이 잘 통하는 사람',
  재성: '현실적이고 생활력 강한 사람',
  관성: '듬직하고 책임감 있는 사람',
  인성: '나를 챙겨주고 깊이 이해해 주는 사람',
};

const CAREER = {
  관성: ['조직에서 빛나는 리더형', '원칙과 책임감이 강해서 체계가 잡힌 곳에서 인정받아요. 대기업, 공기업, 공무원, 회계·법조처럼 신뢰가 중요한 일이 잘 맞고 승진운도 좋은 편이에요.'],
  인성: ['배우고 나누는 전문가형', '공부하고 깊이 파고드는 힘이 있어요. 연구, 교육, 상담, 자격증이 필요한 전문직처럼 지식이 무기가 되는 일이 잘 맞아요.'],
  식상: ['아이디어로 승부하는 크리에이터형', '머릿속 생각을 결과물로 만드는 재능이 있어요. 기획, 마케팅, 콘텐츠, 디자인, 강연처럼 표현하는 일이 잘 맞아요.'],
  재성: ['숫자와 사람을 움직이는 비즈니스형', '돈의 흐름과 기회를 읽는 감각이 있어요. 금융, 투자, 영업, 창업처럼 성과가 숫자로 보이는 일이 잘 맞아요.'],
  비겁: ['내 이름을 걸고 하는 독립형', '주도적으로 일할 때 힘이 나요. 창업, 프리랜서, 팀을 이끄는 자리처럼 내가 결정권을 갖는 일이 잘 맞아요.'],
};
const CAREER_ORDER = ['관성', '인성', '식상', '재성', '비겁'];

function countGroups(tenGods, timeKnown) {
  const counts = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  const has = new Set();
  const gods = {};
  for (const pos of ['year', 'month', 'day', 'hour']) {
    if (pos === 'hour' && !timeKnown) continue;
    for (const part of ['stem', 'branch']) {
      const god = tenGods[pos][part];
      if (!GROUP_OF[god]) continue; // 일간 자신은 세지 않는다
      counts[GROUP_OF[god]] += 1;
      gods[god] = (gods[god] ?? 0) + 1;
      has.add(god);
    }
  }
  return { counts, has, gods };
}

function loveReading(counts, gender, palace, gods) {
  const star = gender === 'male' ? '재성' : '관성';
  const k = counts[star];
  const [headline, body] =
    k === 0 ? ['천천히 타오르는 늦깎이 인연형', '첫눈에 반하기보다 친구로 지내다 연인이 되는 경우가 많아요. 결혼은 서두르지 않을수록 좋은 사람을 만나요.']
    : k === 1 ? ['한 사람만 바라보는 일편단심형', '마음을 쉽게 주진 않지만 한번 주면 오래 가요. 안정적인 연애를 거쳐 결혼까지 이어지기 좋은 흐름이에요.']
    : k === 2 ? ['인기 많은 연애 체질', '이성에게 자연스럽게 호감을 사는 편이라 인연이 끊이지 않아요. 여러 사람 중 나와 결이 맞는 사람을 알아보는 눈이 중요해요.']
    : ['인연이 넘치는 매력형', '주변에 늘 이성이 있는 타입이에요. 선택지가 많은 만큼 신중하게 고르면 결혼 생활도 행복해요.'];

  // 끌리는 사람: 연인 기운(남자는 재성, 여자는 관성) 중 정·편 어느 쪽이 많은지로 고른다
  const [jeong, pyeon] = gender === 'male' ? ['정재', '편재'] : ['정관', '편관'];
  const nj = gods[jeong] ?? 0;
  const np = gods[pyeon] ?? 0;
  const ATTRACT = {
    정재: '차분하고 생활력 있는 사람에게 마음이 가요. 기념일을 챙기고 일상을 함께 꾸려 가는 안정적인 연애가 잘 맞아요.',
    편재: '밝고 활동적인 사람에게 끌려요. 맛집, 여행 코스를 직접 짜서 함께 노는 이벤트형 연애를 즐겨요.',
    정관: '예의 바르고 약속을 잘 지키는 믿음직한 사람에게 끌려요. 천천히 신뢰를 쌓아 가는 연애가 잘 맞아요.',
    편관: '카리스마 있고 추진력 강한 사람에게 끌려요. 애매하게 밀고 당기기보다 확실하게 다가오는 사람이 좋아요.',
  };
  const pick = nj + np === 0 ? null : np > nj ? pyeon : jeong;
  const attract = pick
    ? { text: ATTRACT[pick], basis: `연인을 뜻하는 기운(${star}) 중 ${pick}${pick.endsWith('재') ? '가' : '이'} ${pick === pyeon ? np : nj}개 있어요.` }
    : { text: '처음엔 친구나 동료로 편하게 지내던 사람에게 마음이 열려요. 같이 있는 시간이 쌓일수록 매력을 알아보는 타입이에요.', basis: `연인을 뜻하는 기운(${star})이 사주 겉에 드러나 있지 않아요.` };

  // 연애할 때 나: 표현하는 기운(식상)과 나와 같은 기운(비겁)으로 본다
  const s = counts.식상;
  let style = s === 0 ? '말보다 행동으로 마음을 보여 주는 타입이에요. 상대가 지나가듯 한 말을 기억해 두었다가 챙겨 주는 게 내 방식이에요.'
    : s === 1 ? '좋아하면 티가 나는 솔직한 타입이에요. 대화가 잘 통하는 사이에서 마음이 빠르게 깊어져요.'
    : '표현이 풍부하고 센스 있어서 썸 단계가 짧은 편이에요. 상대의 속도에 한 박자만 맞춰 주면 더 오래 설레요.';
  if (counts.비겁 >= 3) style += ' 연애를 해도 내 시간과 친구를 소중히 하는 독립적인 스타일이라, 서로의 영역을 지켜 주는 사람과 잘 맞아요.';
  const styleBasis = `생각을 표현하는 기운(식상)이 ${s ? `${s}개 있어요` : '없어요'}.${counts.비겁 >= 3 ? ` 나와 같은 기운(비겁)은 ${counts.비겁}개 있어요.` : ''}`;

  const points = [
    { label: '이런 사람에게 끌려요', ...attract },
    { label: '연애할 때 나는', text: style, basis: styleBasis },
  ];
  if (palace) points.push({ label: '결혼한다면', text: `${PARTNER_BY_PALACE[palace]}과 함께할 가능성이 높아요.`, basis: `배우자 자리(일지)에 ${palace} 기운이 있어요.` });
  return { headline, body, points };
}

function moneyReading(counts, has) {
  const r = counts.재성;
  let headline;
  let body;
  if (r === 0) {
    headline = '돈이 따라오게 만드는 실력파';
    body = counts.식상 > 0
      ? '돈 자체를 쫓기보다 내 재능으로 버는 구조예요. 실력을 키울수록 수입이 자연스럽게 따라와요.'
      : '돈에 크게 집착하지 않는 편이에요. 자동이체 저축처럼 모이는 장치를 만들어 두면 든든해져요.';
  } else if (r <= 2) {
    headline = has.has('편재') && !has.has('정재') ? '기회를 잡는 투자 감각형' : '차곡차곡 모으는 알뜰형';
    body = has.has('편재') && !has.has('정재')
      ? '부수입이나 투자처럼 새로운 돈 길을 찾는 감각이 있어요. 큰 기회가 올 때 과감하게 잡을 줄 알아요.'
      : '월급처럼 꾸준한 수입을 성실하게 모으는 타입이에요. 시간이 지날수록 재산이 단단하게 쌓여요.';
  } else {
    headline = '돈 냄새를 잘 맡는 사업가형';
    body = '돈이 들어오는 길을 잘 찾아요. 들어오는 만큼 나가기도 쉬우니 관리만 잘하면 큰 재산을 모을 수 있어요.';
  }
  if (counts.비겁 >= 3) body += ' 다만 친구들과 어울리다 지출이 커질 수 있으니 밥값은 더치페이 추천!';
  return { headline, body };
}

function careerReading(counts) {
  const ranked = [...CAREER_ORDER].sort((a, b) => counts[b] - counts[a]);
  const top = counts[ranked[0]] > 0 ? ranked[0] : '비겁';
  const [headline, body] = CAREER[top];
  const second = ranked.find((g) => g !== top && counts[g] > 0);
  const extra = second ? ` ${CAREER[second][0].replace(/형$/, '')} 기질도 함께 있어서 두 가지를 섞은 일에서 특히 강해요.` : '';
  return { headline, body: body + extra };
}

/**
 * @param {{dayMaster: string, tenGods: object, timeKnown: boolean}} saju computeSaju 결과
 * @param {'male'|'female'} gender
 */
export function readSaju(saju, gender) {
  const { counts, has, gods } = countGroups(saju.tenGods, saju.timeKnown);
  const palace = GROUP_OF[saju.tenGods.day.branch];
  return {
    personality: { headline: '나는 이런 사람', body: PERSONALITY[saju.dayMaster] },
    love: loveReading(counts, gender, palace, gods),
    money: moneyReading(counts, has),
    career: careerReading(counts),
  };
}
