// 재미로 보는 "살"과 내년 운세. 모두 매력과 장점 위주로 풀고, 불안을 주는 내용은 넣지 않는다.
import { getTenGod, getBranchTenGod } from 'manseryeok';

// 삼합 묶음별 도화(매력)와 역마(이동) 지지. 연지나 일지 기준으로 본다.
const PEACH = { 인: '묘', 오: '묘', 술: '묘', 사: '오', 유: '오', 축: '오', 신: '유', 자: '유', 진: '유', 해: '자', 묘: '자', 미: '자' };
const HORSE = { 인: '신', 오: '신', 술: '신', 사: '해', 유: '해', 축: '해', 신: '인', 자: '인', 진: '인', 해: '사', 묘: '사', 미: '사' };
// 일간별 홍염 지지
const RED_FLAME = { 갑: '오', 을: '오', 병: '인', 정: '미', 무: '진', 기: '진', 경: '술', 신: '유', 임: '자', 계: '신' };
const GOEGANG = new Set(['경진', '경술', '임진', '임술', '무진', '무술']);

const GROUP_OF = {
  비견: '비겁', 겁재: '비겁', 식신: '식상', 상관: '식상',
  편재: '재성', 정재: '재성', 편관: '관성', 정관: '관성', 편인: '인성', 정인: '인성',
};

const NEXT_YEAR = { year: 2027, name: '정미년', stem: '정', branch: '미', animal: '붉은 양' };

const YEAR_THEME = {
  비겁: {
    headline: '내 편이 늘어나는 해',
    love: '친구 사이에서 연인으로 발전하는 인연이 생기기 쉬워요.',
    money: '모임과 약속이 많아 지출이 커질 수 있어요. 같이 버는 프로젝트는 대박 가능성!',
    study: '스터디나 팀플처럼 함께할 때 실력이 확 늘어요.',
  },
  식상: {
    headline: '끼와 재능이 터지는 해',
    love: '표현력이 좋아져서 고백하거나 받기 좋은 해예요.',
    money: '재능으로 버는 부수입 운이 좋아요. 과외, 콘텐츠, 공모전을 노려보세요.',
    study: '창작과 발표처럼 결과물을 내는 공부에서 좋은 평가를 받아요.',
  },
  재성: {
    headline: '돈 들어오는 소리가 들리는 해',
    love: '현실적인 감각이 좋아져서 오래 갈 사람을 알아보는 눈이 생겨요.',
    money: '용돈, 알바, 장학금처럼 돈 들어올 일이 늘어나요. 모으는 습관을 들이기 딱 좋아요.',
    study: '실무형 공부와 자격증처럼 바로 쓸 수 있는 공부가 잘 맞아요.',
  },
  관성: {
    headline: '인정받고 한 단계 올라가는 해',
    love: '듬직한 사람과 진지한 관계로 이어지기 좋은 해예요.',
    money: '돈보다 자리와 명예가 먼저 오고, 돈은 그 뒤를 따라와요.',
    study: '취업, 인턴, 시험처럼 공식적인 결과가 나오는 일에 운이 따라요.',
  },
  인성: {
    headline: '귀인이 도와주는 해',
    love: '나를 아껴주는 사람이 곁에 생겨요. 편하게 기대도 되는 해예요.',
    money: '선배나 어른의 도움으로 좋은 기회를 얻어요.',
    study: '공부운 최고! 자격증이나 어학 점수를 따기 딱 좋은 해예요.',
  },
};

/**
 * @param {{pillars: {year: string, month: string, day: string, hour: string|null}, dayMaster: string,
 *   tenGods: object, timeKnown: boolean}} saju
 * @param {'male'|'female'} gender
 */
export function readSpecials(saju, gender) {
  const branches = ['year', 'month', 'day', 'hour'].map((k) => saju.pillars[k]?.[1]).filter(Boolean);
  const yearBranch = saju.pillars.year[1];
  const dayBranch = saju.pillars.day[1];
  const has = (b) => b && branches.includes(b);

  const peach = has(PEACH[yearBranch]) || has(PEACH[dayBranch]);
  const peachCount = branches.filter((b) => b === PEACH[yearBranch] || b === PEACH[dayBranch]).length;
  const redFlame = has(RED_FLAME[saju.dayMaster]);
  const horse = has(HORSE[yearBranch]) || has(HORSE[dayBranch]);
  const goegang = GOEGANG.has(saju.pillars.day);

  // 매력 지수: 도화·홍염과 연인을 뜻하는 기운, 표현력(식상)을 더해 재미로 만든 점수
  const groups = { 식상: 0, 재성: 0, 관성: 0 };
  for (const pos of ['year', 'month', 'day', 'hour']) {
    if (pos === 'hour' && !saju.timeKnown) continue;
    for (const part of ['stem', 'branch']) {
      const g = GROUP_OF[saju.tenGods[pos][part]];
      if (g in groups) groups[g] += 1;
    }
  }
  const spouseStars = gender === 'male' ? groups.재성 : groups.관성;
  const charm = Math.min(99, 62 + peachCount * 14 + (redFlame ? 15 : 0) + spouseStars * 5 + groups.식상 * 3);

  const badges = [];
  if (peach) badges.push({ key: '도화살', icon: '桃', title: '도화살 보유', body: '사람을 끌어당기는 복숭아꽃 매력이 있어요. 가만히 있어도 눈길이 가는 타입이라 첫인상에서 이기고 들어가요.' });
  if (redFlame) badges.push({ key: '홍염살', icon: '紅', title: '홍염살 보유', body: '은근하게 스며드는 진한 매력이에요. 알면 알수록 빠져드는 사람이라 오래 볼수록 인기가 올라가요.' });
  if (horse) badges.push({ key: '역마살', icon: '馬', title: '역마살 보유', body: '한곳에 머물기보다 넓은 세상으로 나가야 운이 열려요. 교환학생, 해외여행, 해외취업과 인연이 깊어요.' });
  if (goegang) badges.push({ key: '괴강살', icon: '魁', title: '괴강살 보유 (희귀)', body: '타고난 카리스마와 강한 추진력의 상징이에요. 위기에서 판을 뒤집는 리더 기질이 숨어 있어요.' });

  const stemGroup = GROUP_OF[getTenGod(saju.dayMaster, NEXT_YEAR.stem)];
  const branchGroup = GROUP_OF[getBranchTenGod(saju.dayMaster, NEXT_YEAR.branch)];
  const theme = YEAR_THEME[stemGroup];
  const loveStar = gender === 'male' ? '재성' : '관성';
  const loveBoost = stemGroup === loveStar || branchGroup === loveStar;
  const nextYear = {
    year: NEXT_YEAR.year,
    name: `${NEXT_YEAR.year}년 ${NEXT_YEAR.name} (${NEXT_YEAR.animal}의 해)`,
    headline: theme.headline,
    love: loveBoost ? `연애운 상승! ${theme.love}` : theme.love,
    money: theme.money,
    study: YEAR_THEME[branchGroup] && branchGroup !== stemGroup
      ? `${theme.study} 하반기에는 ${YEAR_THEME[branchGroup].headline.replace(/ 해$/, '')} 흐름도 더해져요.`
      : theme.study,
  };

  return { charm, badges, nextYear };
}
