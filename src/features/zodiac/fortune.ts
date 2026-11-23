// 담당: 김예진
// 별자리 운세 계산 (팀 규칙 AGENTS.md 5번 "운세 산출 방식"을 따름)
//
// ① 12별자리 순위: Seed = Hash(조회 날짜)
//    → 같은 날에는 누가 봐도 같은 순위 (TV 아침 별자리 순위처럼)
// ② 내 운세 상세(멘트·행운의 색·아이템·숫자·점수): Seed = Hash(생일 + 조회 날짜 + 사용자ID)
//    → 같은 날 같은 사람은 몇 번을 봐도 같은 결과
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 작성했습니다. (AI 사용 비율: 약 100%)

import {
  ADVICES,
  AREA_MESSAGES,
  HEADLINES,
  LUCKY_ACTIONS,
  LUCKY_COLORS,
  LUCKY_ITEMS,
  MESSAGES,
  SHORT_COMMENTS,
  getLevel,
  getTier,
  type Area,
  type Tier,
} from './messages';
import { pick, randomFrom, shuffle } from './seed';
import { SIGNS, getSign, type ZodiacSign } from './signs';

export type RankingRow = {
  rank: number;
  sign: ZodiacSign;
  comment: string;
  yesterdayRank: number; // 어제 순위
  change: number; // 어제 대비 변동 (양수 = 상승, 음수 = 하락, 0 = 그대로)
};

export type Scores = {
  love: number; // 애정운 (1~5)
  money: number; // 금전운
  study: number; // 학업·일
  health: number; // 건강운
};

export type Fortune = {
  date: string; // 조회 날짜 YYYY-MM-DD
  birth: string; // 생년월일 YYYY-MM-DD
  sign: ZodiacSign;
  rank: number;
  yesterdayRank: number;
  change: number; // 어제 대비 변동 (양수 = 상승)
  tier: Tier;
  headline: string;
  message: string; // 전체 운세
  areaMessages: Record<Area, string>; // 분야별 풀이 (별점에 맞는 문장)
  advice: string; // 오늘의 조언
  luckyColor: { name: string; emoji: string };
  luckyItem: string;
  luckyAction: string;
  luckyNumber: number;
  scores: Scores;
};

/** 오늘 날짜를 YYYY-MM-DD 로 (한국 시간 = 내 컴퓨터 시간 기준) */
export function todayString(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

/** "2026-11-22" → "2026년 11월 22일" */
export function formatDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

/** "2026-11-22" → 하루 전 "2026-11-21" (월말·연말도 자동 처리) */
export function previousDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const prev = new Date(y, m - 1, d - 1);
  const mm = String(prev.getMonth() + 1).padStart(2, '0');
  const dd = String(prev.getDate()).padStart(2, '0');
  return `${prev.getFullYear()}-${mm}-${dd}`;
}

/** 날짜만으로 12별자리 순서를 정함 (index 0 = 1위) */
function rankOrder(date: string): ZodiacSign[] {
  return shuffle(randomFrom(`ranking|${date}`), SIGNS);
}

/** ① 그날의 12별자리 순위 + 어제 대비 변동 (날짜만으로 결정 → 순위는 매일 자동 계산되므로 기록이 없어도 비교 가능) */
export function getDailyRanking(date: string): RankingRow[] {
  const yesterday = rankOrder(previousDay(date));
  return rankOrder(date).map((sign, index) => {
    const rank = index + 1;
    const yesterdayRank = yesterday.findIndex((s) => s.id === sign.id) + 1;
    // 한 줄 멘트도 날짜 + 별자리로 정해서 모두에게 같게 보이도록 함
    const comment = pick(randomFrom(`comment|${date}|${sign.id}`), SHORT_COMMENTS[getTier(rank)]);
    return { rank, sign, comment, yesterdayRank, change: yesterdayRank - rank };
  });
}

/** 순위가 높을수록 점수가 높게 나오도록: 기본 점수 ± 1 (1~5 사이) */
function makeScore(random: () => number, rank: number): number {
  const base = 5 - Math.floor((rank - 1) / 3); // 1~3위:5, 4~6위:4, 7~9위:3, 10~12위:2
  const change = Math.floor(random() * 3) - 1; // -1, 0, +1
  return Math.min(5, Math.max(1, base + change));
}

/** ② 내 운세 */
export function getFortune(birth: string, date: string, userId: string): Fortune {
  const [, month, day] = birth.split('-').map(Number);
  const sign = getSign(month, day);
  const row = getDailyRanking(date).find((r) => r.sign.id === sign.id)!;
  const rank = row.rank;
  const tier = getTier(rank);

  // 팀 규칙: Seed = Hash(생일 + 날짜 + 사용자ID)
  // ⚠️ 아래에서 random()을 부르는 순서를 바꾸면 같은 날에도 결과가 달라지니 순서를 유지하세요.
  const random = randomFrom(`${birth}|${date}|${userId}`);

  const headline = pick(random, HEADLINES[tier]);
  const message = pick(random, MESSAGES[tier]);
  const luckyColor = pick(random, LUCKY_COLORS);
  const luckyItem = pick(random, LUCKY_ITEMS);
  const luckyAction = pick(random, LUCKY_ACTIONS);
  const luckyNumber = Math.floor(random() * 9) + 1;
  const scores: Scores = {
    love: makeScore(random, rank),
    money: makeScore(random, rank),
    study: makeScore(random, rank),
    health: makeScore(random, rank),
  };
  // 분야별 문장: 그 분야 별점(높음/보통/낮음)에 맞는 문장 중에서 고름
  const areaMessages = {} as Record<Area, string>;
  for (const area of Object.keys(scores) as Area[]) {
    areaMessages[area] = pick(random, AREA_MESSAGES[area][getLevel(scores[area])]);
  }
  const advice = pick(random, ADVICES)({
    color: luckyColor.name,
    item: luckyItem,
    action: luckyAction,
    number: luckyNumber,
  });

  return {
    date,
    birth,
    sign,
    rank,
    yesterdayRank: row.yesterdayRank,
    change: row.change,
    tier,
    headline,
    message,
    areaMessages,
    advice,
    luckyColor,
    luckyItem,
    luckyAction,
    luckyNumber,
    scores,
  };
}
