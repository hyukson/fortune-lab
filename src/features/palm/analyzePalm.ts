// 전체 분석 흐름: 사진 → 손 찾기 → 손금 찾기 → 길이·곡률·연속성 → 손 모양·손가락 → 판정·점수
import { LINE_KEYS, MAX_IMAGE_SIDE, MIN_FINGER_RATIO, MIN_PIECE_PIXELS, type LineKey } from './config';
import { detectHand, type HandInfo } from './handDetector';
import { categorizeHand, measureHand, type HandCategories, type HandMetrics } from './handShape';
import { measureMask, type Pt } from './lineMetrics';
import { ModelMissingError, segmentPalmLines, type SegmentResult } from './lineSegmenter';
import { makePalmCrop } from './palmCrop';
import {
  continuityCategory,
  curveCategory,
  lengthCategory,
  type LineCategories,
} from './reading';
import { computeScores, type Score } from './scores';

export type LineResult = {
  key: LineKey;
  found: boolean;
  ratio: number;        // 길이 ÷ 손바닥 너비
  straightness: number; // 직선도 (1 = 일직선)
  pieces: number;       // 조각 수
  paths: Pt[][];        // 원본 사진 좌표
  cats: LineCategories | null;
};

export type PalmResult = {
  image: HTMLCanvasElement;
  hand: HandInfo;
  lines: LineResult[];
  handMetrics: HandMetrics;
  handCats: HandCategories;
  scores: Score[];
};

export type AnalyzeErrorCode = 'no-hand' | 'fingers' | 'model-missing' | 'unknown';

export class AnalyzeError extends Error {
  code: AnalyzeErrorCode;
  constructor(code: AnalyzeErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

/** 분석 단계 (스캔 화면 체크리스트와 같은 순서) */
export const ANALYZE_STAGES = [
  '손 특징점 21개 찾기',
  '생명선 · 두뇌선 · 감정선 찾기',
  '길이 · 곡률 · 연속성 재기',
  '손 모양 · 손가락 비율 판정',
] as const;

/** 파일(사진)을 캔버스로 읽기 — 큰 사진은 MAX_IMAGE_SIDE에 맞게 줄임 */
export async function fileToCanvas(file: Blob): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file); // 휴대폰 사진의 회전 정보도 반영됨
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

export async function analyzePalm(
  image: HTMLCanvasElement,
  onStage: (stage: number) => void = () => {},
): Promise<PalmResult> {
  // 1) 손 특징점 (손바닥 너비 = 길이 비교 기준)
  onStage(0);
  let hand: HandInfo | null;
  try {
    hand = await detectHand(image);
  } catch (e) {
    console.error(e);
    throw new AnalyzeError('unknown', '손 인식 모델을 불러오지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.');
  }
  if (!hand) {
    throw new AnalyzeError('no-hand', '사진에서 손을 찾지 못했어요.');
  }
  const handMetrics = measureHand(hand.points);
  if (handMetrics.fingerRatio < MIN_FINGER_RATIO) {
    throw new AnalyzeError('fingers', '손가락이 접혀 있는 것 같아요.');
  }

  // 2)+3) 손금 분할 모델 → 선마다 길이·곡률·연속성 계산 → 판정
  onStage(1);
  let lines: LineResult[];
  try {
    lines = await findLines(image, hand.points, hand.palmWidth, () => onStage(2));
  } catch (e) {
    if (e instanceof ModelMissingError) {
      throw new AnalyzeError(
        'model-missing',
        '손금 검출 모델 파일이 아직 준비되지 않았어요. (public/models/palm/palm-lines.onnx)',
      );
    }
    console.error(e);
    throw new AnalyzeError('unknown', '손금 검출 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.');
  }

  // 4) 손 모양 · 손가락 판정 → 운세 지표 점수
  onStage(3);
  const handCats = categorizeHand(handMetrics);
  const lineCats = Object.fromEntries(lines.filter((l) => l.cats).map((l) => [l.key, l.cats!]));
  const scores = computeScores({ lines: lineCats, hand: handCats });

  return { image, hand, lines, handMetrics, handCats, scores };
}

/**
 * 손금 3대 선 찾기 (사진 분석 · 카메라 촬영 전 확인 공용)
 *  1) 손바닥만 크게 잘라 똑바로 세운 그림으로 먼저 찾고
 *  2) 거기서 못 찾은 선이 있으면 사진 전체로 한 번 더 찾아서 채움
 * 결과 좌표는 원본 사진 좌표, 길이 비율은 손바닥 너비 기준.
 */
export async function findLines(
  image: HTMLCanvasElement,
  points: Pt[],
  palmWidth: number,
  onSegmented: () => void = () => {},
): Promise<LineResult[]> {
  const crop = makePalmCrop(image, points);
  const cropSeg = await segmentPalmLines(crop.canvas);
  onSegmented();

  const measure = (key: LineKey, seg: SegmentResult, toImage: (p: Pt) => Pt, pxPerImagePx: number) => {
    const mask = seg.masks[key];
    const m = mask ? measureMask(mask, seg.size, MIN_PIECE_PIXELS) : null;
    if (!m) return null;
    const ratio = m.length / pxPerImagePx / palmWidth;
    const result: LineResult = {
      key,
      found: true,
      ratio,
      straightness: m.straightness,
      pieces: m.pieces,
      paths: m.paths.map((path) => path.map(toImage)),
      cats: {
        length: lengthCategory(ratio),
        curve: curveCategory(m.straightness),
        continuity: continuityCategory(m.pieces),
      },
    };
    return result;
  };

  // 잘라낸 그림 좌표 → 모델 입력 여백 보정 → 원본 사진 좌표
  const fromCrop = (p: Pt) => crop.toImage({ x: (p.x - cropSeg.padX) / cropSeg.scale, y: (p.y - cropSeg.padY) / cropSeg.scale });
  const found = new Map<LineKey, LineResult>();
  for (const key of LINE_KEYS) {
    const r = measure(key, cropSeg, fromCrop, cropSeg.scale * crop.scale);
    if (r) found.set(key, r);
  }

  if (found.size < LINE_KEYS.length) {
    const fullSeg = await segmentPalmLines(image);
    const fromFull = (p: Pt) => ({ x: (p.x - fullSeg.padX) / fullSeg.scale, y: (p.y - fullSeg.padY) / fullSeg.scale });
    for (const key of LINE_KEYS) {
      if (found.has(key)) continue;
      const r = measure(key, fullSeg, fromFull, fullSeg.scale);
      if (r) found.set(key, r);
    }
  }

  return LINE_KEYS.map(
    (key) => found.get(key) ?? { key, found: false, ratio: 0, straightness: 0, pieces: 0, paths: [], cats: null },
  );
}
