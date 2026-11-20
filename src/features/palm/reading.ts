// 측정값 → 판정(짧음/보통/김 등) → 풀이 문장. 문구는 여기서 자유롭게 고치면 됩니다.
import {
  GENTLE_CURVE,
  LENGTH_LONG,
  LENGTH_SHORT,
  STRAIGHT_LINE,
  type LineKey,
} from './config';

export type LengthCat = 'short' | 'normal' | 'long';
export type CurveCat = 'straight' | 'gentle' | 'deep';
export type ContinuityCat = 'solid' | 'once' | 'many';

export const LENGTH_LABEL: Record<LengthCat, string> = { short: '짧음', normal: '보통', long: '김' };
export const CURVE_LABEL: Record<CurveCat, string> = { straight: '직선형', gentle: '완만한 곡선', deep: '깊은 곡선' };
export const CONTINUITY_LABEL: Record<ContinuityCat, string> = {
  solid: '끊김 없음',
  once: '한 번 끊김',
  many: '여러 번 끊김',
};

export const LINE_MEANING: Record<LineKey, string> = {
  life: '활력 · 생활 리듬',
  head: '생각하는 방식',
  heart: '감정 표현',
};

// --------------------------- 판정 규칙 ---------------------------
export function lengthCategory(ratio: number): LengthCat {
  if (ratio < LENGTH_SHORT) return 'short';
  if (ratio > LENGTH_LONG) return 'long';
  return 'normal';
}

export function curveCategory(straightness: number): CurveCat {
  if (straightness >= STRAIGHT_LINE) return 'straight';
  if (straightness >= GENTLE_CURVE) return 'gentle';
  return 'deep';
}

export function continuityCategory(pieces: number): ContinuityCat {
  if (pieces <= 1) return 'solid';
  if (pieces === 2) return 'once';
  return 'many';
}

// --------------------------- 풀이 문장 ---------------------------
type LineTexts = {
  length: Record<LengthCat, string>;
  curve: Record<CurveCat, string>;
  continuity: Record<ContinuityCat, string>;
};

export const READING_TEXT: Record<LineKey, LineTexts> = {
  life: {
    length: {
      short: '에너지를 짧고 굵게 쓰는 집중형이에요. 바쁜 일정 뒤에는 쉬는 시간을 꼭 챙겨 주세요.',
      normal: '생활 리듬이 안정적인 편이에요. 지금의 페이스를 꾸준히 유지하면 좋아요.',
      long: '지구력이 좋아서 오래 꾸준히 해내는 일에 강한 타입으로 풀이돼요.',
    },
    curve: {
      straight: '계획한 대로 차근차근 움직이는 신중한 성향이 보여요.',
      gentle: '일과 휴식의 균형을 잘 맞추는 편이에요.',
      deep: '활동적이고, 사람들과 어울리며 에너지를 얻는 타입이에요.',
    },
    continuity: {
      solid: '큰 흔들림 없이 꾸준한 흐름을 이어 가는 모습이에요.',
      once: '생활에 큰 변화를 맞으며 새로 출발하는 시기가 한 번쯤 있다고 봐요.',
      many: '다양한 경험을 하며 여러 번 방향을 바꾸는 변화무쌍한 흐름이에요.',
    },
  },
  head: {
    length: {
      short: '결정이 빠르고 실용적인 판단을 잘해요.',
      normal: '생각과 행동의 균형이 잘 잡혀 있어요.',
      long: '한 가지를 깊이 파고들어 분석하는 힘이 있어요.',
    },
    curve: {
      straight: '논리적이고 현실적으로 생각하는 편이에요.',
      gentle: '현실 감각과 상상력을 함께 쓰는 균형형이에요.',
      deep: '창의적이고 감성적인 아이디어가 풍부해요.',
    },
    continuity: {
      solid: '한번 시작한 일에 집중력을 오래 유지해요.',
      once: '관심사가 한 번 크게 바뀌며 새로운 분야에 도전할 수 있어요.',
      many: '아이디어가 많아서 여러 일을 동시에 떠올리는 타입이에요.',
    },
  },
  heart: {
    length: {
      short: '감정을 담백하고 차분하게 표현하는 편이에요.',
      normal: '감정 표현이 자연스럽고 적당해요.',
      long: '애정 표현이 풍부하고 주변 사람을 잘 챙겨요.',
    },
    curve: {
      straight: '연애에서도 차분하고 이성적인 편이에요.',
      gentle: '따뜻하고 배려 깊은 마음을 가졌어요.',
      deep: '좋아하는 마음을 솔직하고 열정적으로 표현해요.',
    },
    continuity: {
      solid: '한결같은 마음으로 관계를 이어 가요.',
      once: '마음의 전환점을 한 번 맞으며 더 성숙해지는 시기가 있다고 봐요.',
      many: '감수성이 섬세해서 작은 일에도 마음이 잘 움직이는 편이에요.',
    },
  },
};

// 결과 제목에 쓰는 한 단어 (예: "지구력형 · 창의형 · 표현형")
const TYPE_WORD = {
  life: { short: '집중형', normal: '안정형', long: '지구력형' } as Record<LengthCat, string>,
  head: { straight: '논리형', gentle: '균형형', deep: '창의형' } as Record<CurveCat, string>,
  heart: { short: '담백형', normal: '다정형', long: '표현형' } as Record<LengthCat, string>,
};

export type LineCategories = { length: LengthCat; curve: CurveCat; continuity: ContinuityCat };

export function typeTitle(cats: Partial<Record<LineKey, LineCategories>>): string {
  const words: string[] = [];
  if (cats.life) words.push(TYPE_WORD.life[cats.life.length]);
  if (cats.head) words.push(TYPE_WORD.head[cats.head.curve]);
  if (cats.heart) words.push(TYPE_WORD.heart[cats.heart.length]);
  return words.length ? words.join(' · ') : '손금을 찾지 못했어요';
}

export function lineReading(key: LineKey, cats: LineCategories): string {
  const t = READING_TEXT[key];
  return `${t.length[cats.length]} ${t.curve[cats.curve]} ${t.continuity[cats.continuity]}`;
}
