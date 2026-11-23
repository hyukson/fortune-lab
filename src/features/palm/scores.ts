// 운세 지표 점수: 판정 결과(선 · 손 모양 · 손가락)에 정해진 점수를 더해서 계산합니다.
// 무작위 요소가 없어서 같은 사진이면 항상 같은 점수가 나옵니다. 점수는 아래 표의 숫자만 바꾸면 돼요.
import type { LineKey } from './config';
import type { HandCategories } from './handShape';
import type { LineCategories } from './reading';

export type ScoreKey = 'love' | 'money' | 'health' | 'work' | 'social';

export const SCORE_INFO: Record<ScoreKey, { name: string; short: string }> = {
  love: { name: '애정운', short: '애정' },
  money: { name: '재물운', short: '재물' },
  health: { name: '건강운', short: '건강' },
  work: { name: '성취운', short: '성취' },
  social: { name: '대인운', short: '대인' },
};

export const SCORE_ORDER: ScoreKey[] = ['love', 'money', 'health', 'work', 'social'];

export const SCORE_BASE = 50; // 모든 지표의 시작 점수
export const SCORE_MIN = 30;
export const SCORE_MAX = 98;

type Features = {
  lines: Partial<Record<LineKey, LineCategories>>;
  hand: HandCategories;
};

type Rule = { key: ScoreKey; points: number; reason: string; when: (f: Features) => boolean };

// ------------------------------- 점수표 -------------------------------
export const SCORE_RULES: Rule[] = [
  // 건강운 — 생명선 중심
  { key: 'health', points: 18, reason: '긴 생명선', when: (f) => f.lines.life?.length === 'long' },
  { key: 'health', points: 10, reason: '보통 길이 생명선', when: (f) => f.lines.life?.length === 'normal' },
  { key: 'health', points: 10, reason: '끊김 없는 생명선', when: (f) => f.lines.life?.continuity === 'solid' },
  { key: 'health', points: 6, reason: '크게 휜 생명선', when: (f) => f.lines.life?.curve === 'deep' },
  { key: 'health', points: 8, reason: '흙의 손', when: (f) => f.hand.type === 'earth' },

  // 애정운 — 감정선 중심
  { key: 'love', points: 16, reason: '긴 감정선', when: (f) => f.lines.heart?.length === 'long' },
  { key: 'love', points: 9, reason: '보통 길이 감정선', when: (f) => f.lines.heart?.length === 'normal' },
  { key: 'love', points: 10, reason: '곡선형 감정선', when: (f) => f.lines.heart?.curve !== undefined && f.lines.heart.curve !== 'straight' },
  { key: 'love', points: 8, reason: '끊김 없는 감정선', when: (f) => f.lines.heart?.continuity === 'solid' },
  { key: 'love', points: 9, reason: '물의 손', when: (f) => f.hand.type === 'water' },
  { key: 'love', points: 5, reason: '불의 손', when: (f) => f.hand.type === 'fire' },

  // 재물운 — 두뇌선 · 엄지 · 손 모양
  { key: 'money', points: 12, reason: '곧은 두뇌선', when: (f) => f.lines.head?.curve === 'straight' },
  { key: 'money', points: 8, reason: '긴 두뇌선', when: (f) => f.lines.head?.length === 'long' },
  { key: 'money', points: 10, reason: '긴 엄지', when: (f) => f.hand.thumb === 'long' },
  { key: 'money', points: 8, reason: '흙의 손', when: (f) => f.hand.type === 'earth' },
  { key: 'money', points: 5, reason: '검지가 긴 손', when: (f) => f.hand.indexRing === 'index' },

  // 성취운 — 두뇌선 연속성 · 검지 · 엄지
  { key: 'work', points: 12, reason: '끊김 없는 두뇌선', when: (f) => f.lines.head?.continuity === 'solid' },
  { key: 'work', points: 6, reason: '긴 두뇌선', when: (f) => f.lines.head?.length === 'long' },
  { key: 'work', points: 10, reason: '검지가 긴 손', when: (f) => f.hand.indexRing === 'index' },
  { key: 'work', points: 7, reason: '긴 엄지', when: (f) => f.hand.thumb === 'long' },
  { key: 'work', points: 9, reason: '불의 손', when: (f) => f.hand.type === 'fire' },

  // 대인운 — 감정선 모양 · 약지 · 손 모양
  { key: 'social', points: 10, reason: '곡선형 감정선', when: (f) => f.lines.heart?.curve !== undefined && f.lines.heart.curve !== 'straight' },
  { key: 'social', points: 6, reason: '완만한 두뇌선', when: (f) => f.lines.head?.curve === 'gentle' },
  { key: 'social', points: 8, reason: '약지가 긴 손', when: (f) => f.hand.indexRing === 'ring' },
  { key: 'social', points: 12, reason: '바람의 손', when: (f) => f.hand.type === 'air' },
  { key: 'social', points: 6, reason: '물의 손', when: (f) => f.hand.type === 'water' },
  { key: 'social', points: 5, reason: '짧은 엄지', when: (f) => f.hand.thumb === 'short' },
];

export type Score = { key: ScoreKey; value: number; reasons: string[] };

export function computeScores(f: Features): Score[] {
  return SCORE_ORDER.map((key) => {
    let value = SCORE_BASE;
    const reasons: string[] = [];
    for (const rule of SCORE_RULES) {
      if (rule.key === key && rule.when(f)) {
        value += rule.points;
        reasons.push(rule.reason);
      }
    }
    return { key, value: Math.max(SCORE_MIN, Math.min(SCORE_MAX, value)), reasons };
  });
}

/** 가장 높은 지표 (같으면 SCORE_ORDER 앞쪽) */
export function topScore(scores: Score[]): Score {
  return scores.reduce((best, s) => (s.value > best.value ? s : best), scores[0]);
}
