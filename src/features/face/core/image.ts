import { IMAGE_RULES } from '../config';
import type { Box, IssueCode } from '../types';

// 어떤 크기의 원본이든 긴 변을 같은 크기로 맞춘 분석용 캔버스로 변환
export function toAnalysisCanvas(source: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
  const scale = IMAGE_RULES.analysisLongSide / Math.max(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

// 파일 검사 (형식·용량·해상도) + 휴대폰 사진 회전 정보 반영
export async function fileToCanvas(
  file: File,
): Promise<{ ok: true; canvas: HTMLCanvasElement } | { ok: false; issue: IssueCode }> {
  if (!IMAGE_RULES.acceptTypes.includes(file.type)) return { ok: false, issue: 'FILE_TYPE' };
  if (file.size > IMAGE_RULES.maxBytes) return { ok: false, issue: 'FILE_TOO_BIG' };

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return { ok: false, issue: 'FILE_BROKEN' };
  }
  if (Math.min(bitmap.width, bitmap.height) < IMAGE_RULES.minShortSide) {
    bitmap.close();
    return { ok: false, issue: 'IMAGE_TOO_SMALL' };
  }
  const canvas = toAnalysisCanvas(bitmap, bitmap.width, bitmap.height);
  bitmap.close();
  return { ok: true, canvas };
}

// 영역을 작은 흑백 이미지로 잘라냄 (빠르고, 사진 크기와 무관하게 측정됨)
function grayCrop(canvas: HTMLCanvasElement, box: Box, size: number): Float32Array {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(canvas, box.x, box.y, Math.max(1, box.w), Math.max(1, box.h), 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const gray = new Float32Array(size * size);
  for (let i = 0; i < gray.length; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }
  return gray;
}

// 평균 밝기 (0~255)
export function brightness(canvas: HTMLCanvasElement, box: Box): number {
  const gray = grayCrop(canvas, box, 64);
  let sum = 0;
  for (const v of gray) sum += v;
  return sum / gray.length;
}

// 선명도: 라플라시안 분산 (흐린 사진일수록 작음)
export function sharpness(canvas: HTMLCanvasElement, box: Box): number {
  const size = 128;
  const g = grayCrop(canvas, box, size);
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const i = y * size + x;
      const v = g[i - 1] + g[i + 1] + g[i - size] + g[i + size] - 4 * g[i];
      sum += v;
      sumSq += v * v;
      n++;
    }
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
}
