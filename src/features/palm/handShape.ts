// MediaPipe 손 특징점 21개로 손 모양 · 손가락 비율을 계산합니다. (화면·라이브러리와 무관한 순수 계산)
//
//  특징점 번호:  0 손목
//               1~4 엄지 (1 손목 쪽 관절, 2 뿌리 관절, 3 가운데 마디, 4 끝)
//               5~8 검지  9~12 중지  13~16 약지  17~20 새끼 (뿌리 → 끝 순서)
import {
  FINGER_LONG_RATIO,
  INDEX_RING_HIGH,
  INDEX_RING_LOW,
  PALM_LONG_RATIO,
  THUMB_LONG,
  THUMB_SHORT,
} from './config';

type P = { x: number; y: number };

export type HandMetrics = {
  palmWidth: number;   // 검지 뿌리 ~ 새끼 뿌리 (px)
  palmLength: number;  // 손목 ~ 중지 뿌리 (px)
  palmRatio: number;   // 손바닥 길이 ÷ 너비 (클수록 길쭉한 손바닥)
  fingerRatio: number; // 중지 길이 ÷ 손바닥 길이 (클수록 긴 손가락)
  indexRing: number;   // 검지 ÷ 약지
  thumbRatio: number;  // 엄지 ÷ 검지
};

export type HandType = 'earth' | 'air' | 'fire' | 'water';
export type PalmShape = 'square' | 'long';
export type FingerLength = 'short' | 'long';
export type IndexRingCat = 'ring' | 'even' | 'index';
export type ThumbCat = 'short' | 'normal' | 'long';

export type HandCategories = {
  palm: PalmShape;
  fingers: FingerLength;
  type: HandType;
  indexRing: IndexRingCat;
  thumb: ThumbCat;
};

const d = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);

/** 마디를 따라 잰 손가락 길이 (손가락이 살짝 굽어도 덜 흔들림) */
function fingerLength(pts: P[], from: number): number {
  return d(pts[from], pts[from + 1]) + d(pts[from + 1], pts[from + 2]) + d(pts[from + 2], pts[from + 3]);
}

export function measureHand(pts: P[]): HandMetrics {
  const palmWidth = d(pts[5], pts[17]);
  const palmLength = d(pts[0], pts[9]);
  const index = fingerLength(pts, 5);
  const middle = fingerLength(pts, 9);
  const ring = fingerLength(pts, 13);
  const thumb = d(pts[2], pts[3]) + d(pts[3], pts[4]);
  return {
    palmWidth,
    palmLength,
    palmRatio: palmLength / palmWidth,
    fingerRatio: middle / palmLength,
    indexRing: index / ring,
    thumbRatio: thumb / index,
  };
}

// --------------------------- 판정 규칙 ---------------------------
// 전통 손금의 4가지 손 유형: 손바닥 모양 × 손가락 길이
//   네모난 손바닥 + 짧은 손가락 = 흙   /  네모난 손바닥 + 긴 손가락 = 바람
//   긴 손바닥   + 짧은 손가락 = 불   /  긴 손바닥   + 긴 손가락 = 물
export function handTypeOf(palm: PalmShape, fingers: FingerLength): HandType {
  if (palm === 'square') return fingers === 'short' ? 'earth' : 'air';
  return fingers === 'short' ? 'fire' : 'water';
}

export function categorizeHand(m: HandMetrics): HandCategories {
  const palm: PalmShape = m.palmRatio >= PALM_LONG_RATIO ? 'long' : 'square';
  const fingers: FingerLength = m.fingerRatio >= FINGER_LONG_RATIO ? 'long' : 'short';
  const indexRing: IndexRingCat =
    m.indexRing < INDEX_RING_LOW ? 'ring' : m.indexRing > INDEX_RING_HIGH ? 'index' : 'even';
  const thumb: ThumbCat = m.thumbRatio < THUMB_SHORT ? 'short' : m.thumbRatio > THUMB_LONG ? 'long' : 'normal';
  return { palm, fingers, type: handTypeOf(palm, fingers), indexRing, thumb };
}
