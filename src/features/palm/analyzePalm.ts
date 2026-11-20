// 전체 분석 흐름: 사진 → 손 찾기 → 손금 찾기 → 길이·곡률·연속성 → 판정
import { LINE_KEYS, MAX_IMAGE_SIDE, MIN_PIECE_PIXELS, type LineKey } from './config';
import { detectHand, type HandInfo } from './handDetector';
import { measureMask, type Pt } from './lineMetrics';
import { ModelMissingError, segmentPalmLines } from './lineSegmenter';
import {
  continuityCategory,
  curveCategory,
  lengthCategory,
  type LineCategories,
} from './reading';

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
};

export type AnalyzeErrorCode = 'no-hand' | 'model-missing' | 'unknown';

export class AnalyzeError extends Error {
  code: AnalyzeErrorCode;
  constructor(code: AnalyzeErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

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
  onProgress: (message: string) => void,
): Promise<PalmResult> {
  // 1) 손 특징점 (손바닥 너비 = 길이 비교 기준)
  onProgress('손을 찾고 있어요...');
  let hand: HandInfo | null;
  try {
    hand = await detectHand(image);
  } catch (e) {
    console.error(e);
    throw new AnalyzeError('unknown', '손 인식 모델을 불러오지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.');
  }
  if (!hand) {
    throw new AnalyzeError(
      'no-hand',
      '사진에서 손을 찾지 못했어요. 손바닥 전체가 화면에 나오게, 밝은 곳에서 다시 찍어 주세요.',
    );
  }

  // 2) 손금 분할 모델
  onProgress('손금을 찾고 있어요...');
  let seg;
  try {
    seg = await segmentPalmLines(image);
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

  // 3) 선마다 길이·곡률·연속성 계산 → 판정
  onProgress('길이 · 곡률 · 연속성을 계산하고 있어요...');
  const toImage = (p: Pt): Pt => ({ x: (p.x - seg.padX) / seg.scale, y: (p.y - seg.padY) / seg.scale });

  const lines: LineResult[] = LINE_KEYS.map((key) => {
    const mask = seg.masks[key];
    const m = mask ? measureMask(mask, seg.size, MIN_PIECE_PIXELS) : null;
    if (!m) {
      return { key, found: false, ratio: 0, straightness: 0, pieces: 0, paths: [], cats: null };
    }
    const ratio = m.length / seg.scale / hand.palmWidth;
    return {
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
  });

  return { image, hand, lines };
}
