import type { FaceDetector } from '@mediapipe/tasks-vision';
import { FACE_COUNT_RULES as R } from '../config';
import type { Box } from '../types';

// 사진 속 얼굴 수 다시 세기
// 특징점 모델은 큰 얼굴 위주로 찾아서, 콜라주·포스터·2인 사진의 작은 얼굴을 놓치기 쉽습니다.
// 가벼운 얼굴 검출 모델로 사진 전체 + 2×2 조각을 훑어 얼굴을 모두 찾고,
// 주 얼굴과 비슷한 크기(40% 이상)인 얼굴이 2개 이상이면 여러 명으로 판단합니다.
export function countFaces(detector: FaceDetector | null, image: HTMLCanvasElement, mainFaceWidth: number): number {
  return findFaces(detector, image, mainFaceWidth).length || 1;
}

// 주 얼굴과 비슷한 크기의 얼굴 상자 목록 (개발용 확인에도 사용)
export function findFaces(
  detector: FaceDetector | null,
  image: HTMLCanvasElement,
  mainFaceWidth: number,
): (Box & { score: number })[] {
  if (!detector) return [];

  const boxes: (Box & { score: number })[] = [];
  const scan = (sx: number, sy: number, sw: number, sh: number) => {
    const tile = document.createElement('canvas');
    tile.width = Math.round(sw);
    tile.height = Math.round(sh);
    tile.getContext('2d')!.drawImage(image, sx, sy, sw, sh, 0, 0, tile.width, tile.height);
    for (const d of detector.detect(tile).detections) {
      const b = d.boundingBox;
      const score = d.categories[0]?.score ?? 0;
      if (!b || score < R.minScore) continue;
      boxes.push({ x: b.originX + sx, y: b.originY + sy, w: b.width, h: b.height, score });
    }
  };

  scan(0, 0, image.width, image.height);
  // 겹치는 조각: 가로세로를 tiles+1 등분한 격자 위에 2칸 크기 창을 놓음
  const n = R.tiles;
  const tw = (image.width * 2) / (n + 1);
  const th = (image.height * 2) / (n + 1);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) scan((i * tw) / 2, (j * th) / 2, tw, th);
  }

  // 같은 얼굴이 여러 번 잡힌 것은 하나로 합침
  // (조각 경계에 걸려 반만 잡힌 얼굴도 있으므로, 작은 쪽 넓이의 30% 이상 겹치면 같은 얼굴로 봄)
  const overlap = (a: Box, b: Box) => {
    const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    return w > 0 && h > 0 ? (w * h) / Math.min(a.w * a.h, b.w * b.h) : 0;
  };
  const unique: (Box & { score: number })[] = [];
  for (const b of boxes.sort((a, c) => c.w - a.w)) {
    if (!unique.some((u) => overlap(u, b) > 0.3)) unique.push(b);
  }
  return unique.filter((b) => b.w >= mainFaceWidth * R.minRelativeWidth);
}
