// 손 모양 · 손가락 비율 판정 → 풀이 문장, 그리고 '손금 유형 도감' 데이터. 문구는 여기서 자유롭게 고치면 됩니다.
import type { HandType, IndexRingCat, ThumbCat } from './handShape';
import type { LineKey } from './config';
import type { CurveCat, LengthCat } from './reading';

// --------------------------- 왼손 · 오른손 기준 ---------------------------
// 전통 손금: 주로 쓰는 손 = 살면서 만들어 가는 지금과 앞으로(후천운), 반대쪽 손 = 타고난 성향(선천운)
// 사진만으로는 왼손/오른손을 믿을 만하게 구분하기 어려워서(셀카 좌우 반전 등) 사용자가 직접 고릅니다.
export type HandSide = 'left' | 'right';

export type HandChoice = {
  side: HandSide;     // 찍은 손
  dominant: HandSide; // 주로 쓰는 손 (오른손잡이 = 'right')
};

export const SIDE_LABEL: Record<HandSide, string> = { left: '왼손', right: '오른손' };
export const DOMINANT_LABEL: Record<HandSide, string> = { left: '왼손잡이', right: '오른손잡이' };

export type ReadingFrame = { short: string; title: string; desc: string };

export const READING_FRAME: Record<'dominant' | 'other', ReadingFrame> = {
  dominant: {
    short: '후천운',
    title: '지금의 나와 앞으로의 흐름',
    desc: '주로 쓰는 손은 살아오며 쌓은 습관과 노력, 그리고 앞으로의 흐름을 보여 준다고 풀이해요.',
  },
  other: {
    short: '선천운',
    title: '타고난 성향',
    desc: '주로 쓰지 않는 손은 태어날 때부터 가진 기질과 잠재력을 보여 준다고 풀이해요.',
  },
};

export function readingFrame(choice: HandChoice): ReadingFrame {
  return READING_FRAME[choice.side === choice.dominant ? 'dominant' : 'other'];
}

// --------------------------- 손 모양 4유형 ---------------------------
export type HandTypeInfo = {
  name: string;     // 흙의 손
  symbol: string;   // 土 (도감 카드에 크게 표시)
  palm: string;     // 손바닥 모양 설명
  fingers: string;  // 손가락 설명
  keywords: string[];
  summary: string;  // 한 줄 요약
  reading: string;  // 결과 화면 풀이
};

export const HAND_TYPES: Record<HandType, HandTypeInfo> = {
  earth: {
    name: '흙의 손',
    symbol: '土',
    palm: '네모난 손바닥',
    fingers: '짧은 손가락',
    keywords: ['성실', '현실 감각', '믿음직함'],
    summary: '단단한 땅처럼 한결같고 믿음직한 손',
    reading:
      '말보다 행동으로 보여 주는 타입이에요. 손으로 직접 만들고 해 보는 일에서 실력이 잘 드러나고, 주변 사람들이 기대기 좋은 든든한 사람으로 풀이돼요.',
  },
  air: {
    name: '바람의 손',
    symbol: '風',
    palm: '네모난 손바닥',
    fingers: '긴 손가락',
    keywords: ['호기심', '소통', '분석력'],
    summary: '바람처럼 가볍게 생각을 나르는 손',
    reading:
      '궁금한 게 많고 말과 글로 생각을 정리하는 데 강해요. 새로운 사람과도 금방 대화가 통하고, 정보를 모아 분석하는 일에서 빛나는 타입으로 풀이돼요.',
  },
  fire: {
    name: '불의 손',
    symbol: '火',
    palm: '긴 손바닥',
    fingers: '짧은 손가락',
    keywords: ['열정', '추진력', '직감'],
    summary: '불꽃처럼 뜨겁게 먼저 움직이는 손',
    reading:
      '하고 싶은 일이 생기면 바로 시작하는 실행력이 있어요. 직감이 좋아서 결정이 빠르고, 분위기를 끌어올리는 에너지가 넘치는 타입으로 풀이돼요.',
  },
  water: {
    name: '물의 손',
    symbol: '水',
    palm: '긴 손바닥',
    fingers: '긴 손가락',
    keywords: ['감수성', '공감', '상상력'],
    summary: '물처럼 섬세하게 마음을 읽는 손',
    reading:
      '다른 사람의 기분을 잘 알아채고 공감해 주는 따뜻한 사람이에요. 상상력이 풍부해서 예술이나 이야기를 만드는 일과 잘 어울리는 타입으로 풀이돼요.',
  },
};

export const HAND_TYPE_ORDER: HandType[] = ['earth', 'air', 'fire', 'water'];

// --------------------------- 손가락 비율 ---------------------------
export const INDEX_RING_INFO: Record<IndexRingCat, { name: string; reading: string }> = {
  index: {
    name: '검지가 긴 손',
    reading: '스스로 정한 목표를 향해 앞장서는 리더형이에요. 자신감 있게 의견을 말하는 편이에요.',
  },
  even: {
    name: '검지·약지 균형형',
    reading: '상황에 따라 앞에 서기도, 뒤에서 돕기도 하는 균형 잡힌 타입이에요.',
  },
  ring: {
    name: '약지가 긴 손',
    reading: '새로운 경험과 도전을 즐기는 모험가형이에요. 감각적이고 창의적인 일에 끌리는 편이에요.',
  },
};

export const THUMB_INFO: Record<ThumbCat, { name: string; reading: string }> = {
  long: { name: '긴 엄지', reading: '의지가 강하고, 마음먹은 일은 끝까지 밀고 나가는 힘이 있어요.' },
  normal: { name: '보통 엄지', reading: '고집과 유연함 사이에서 균형을 잘 잡는 편이에요.' },
  short: { name: '짧은 엄지', reading: '부드럽고 융통성이 있어서 다른 사람의 의견을 잘 받아들여요.' },
};

// --------------------------- 손금 유형 도감 ---------------------------
// 결과 제목에 쓰는 선별 유형 (생명선·감정선은 길이, 두뇌선은 곡률 기준)
export type LineTypeEntry = { cat: LengthCat | CurveCat; name: string; desc: string };

export const LINE_TYPES: Record<LineKey, { basis: string; entries: LineTypeEntry[] }> = {
  life: {
    basis: '생명선 길이',
    entries: [
      { cat: 'short', name: '집중형', desc: '짧고 굵게 에너지를 쓰는 타입' },
      { cat: 'normal', name: '안정형', desc: '꾸준한 생활 리듬을 지키는 타입' },
      { cat: 'long', name: '지구력형', desc: '오래 버티며 끝까지 해내는 타입' },
    ],
  },
  head: {
    basis: '두뇌선 곡률',
    entries: [
      { cat: 'straight', name: '논리형', desc: '현실적이고 이성적으로 생각하는 타입' },
      { cat: 'gentle', name: '균형형', desc: '현실 감각과 상상력을 함께 쓰는 타입' },
      { cat: 'deep', name: '창의형', desc: '감성과 아이디어가 풍부한 타입' },
    ],
  },
  heart: {
    basis: '감정선 길이',
    entries: [
      { cat: 'short', name: '담백형', desc: '감정을 차분하게 표현하는 타입' },
      { cat: 'normal', name: '다정형', desc: '자연스럽게 마음을 나누는 타입' },
      { cat: 'long', name: '표현형', desc: '애정 표현이 풍부한 타입' },
    ],
  },
};
