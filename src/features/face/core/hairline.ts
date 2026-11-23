import type { ImageSegmenter } from '@mediapipe/tasks-vision';
import { HAIRLINE_RULES as R } from '../config';
import type { Hairline, Point } from '../types';
import { dist, LM } from './geometry';

// 이마 위 머리카락 경계(헤어라인) 찾기
// 얼굴 특징점은 이마 위쪽 끝까지만 있어서, 상정(이마 길이)을 제대로 재려면 머리카락이 시작되는 곳이 필요합니다.
//  1. 머리카락 분할 모델로 사진의 픽셀마다 "머리카락일 확률"을 구함
//  2. 이마 맨 위 특징점에서 얼굴 위쪽 방향으로 올라가며 머리카락이 시작되는 지점을 찾음
//  3. 이마 가운데를 중심으로 여러 줄을 재서 가운데 값(중앙값)을 사용
export function findHairline(segmenter: ImageSegmenter | null, image: HTMLCanvasElement, pts: Point[]): Hairline {
  if (!segmenter) return { kind: 'unavailable' };

  let probs: Float32Array;
  let mw: number;
  let mh: number;
  try {
    const result = segmenter.segment(image);
    const masks = result.confidenceMasks ?? [];
    const hairMask = masks[masks.length - 1]; // 마지막 채널이 '머리카락'
    if (!hairMask) return { kind: 'unavailable' };
    probs = hairMask.getAsFloat32Array().slice();
    mw = hairMask.width;
    mh = hairMask.height;
    masks.forEach((m) => m.close());
  } catch (e) {
    console.warn(e);
    return { kind: 'unavailable' };
  }

  // 사진 좌표 → 마스크 좌표
  const sx = mw / image.width;
  const sy = mh / image.height;
  const hairAt = (x: number, y: number) => {
    const mx = Math.round(x * sx);
    const my = Math.round(y * sy);
    if (mx < 0 || my < 0 || mx >= mw || my >= mh) return -1; // 사진 밖
    return probs[my * mw + mx];
  };

  // 얼굴의 위쪽 방향 (두 눈을 잇는 선에 수직)
  const eyeR = pts[LM.rightEyeOuter];
  const eyeL = pts[LM.leftEyeOuter];
  const ex = eyeL.x - eyeR.x;
  const ey = eyeL.y - eyeR.y;
  const len = Math.hypot(ex, ey);
  const side = { x: ex / len, y: ey / len };
  const up = { x: side.y, y: -side.x };

  const top = pts[LM.foreheadTop];
  const faceWidth = dist(pts[LM.faceRight], pts[LM.faceLeft]);
  const faceLength = dist(pts[LM.foreheadTop], pts[LM.chin]);
  const maxSteps = Math.round(faceLength * R.maxSearch);

  const found: number[] = [];
  let covered = 0;
  for (const offset of R.columns) {
    const ox = top.x + side.x * faceWidth * offset;
    const oy = top.y + side.y * faceWidth * offset;
    // 시작점이 이미 머리카락이면 앞머리가 이마를 덮은 것
    if (hairAt(ox, oy) > R.threshold) {
      covered++;
      continue;
    }
    let run = 0;
    for (let s = 1; s <= maxSteps; s++) {
      const v = hairAt(ox + up.x * s, oy + up.y * s);
      if (v < 0) break; // 사진 위쪽 끝에 닿음
      run = v > R.threshold ? run + 1 : 0;
      if (run >= R.minRun) {
        found.push(s - R.minRun + 1);
        break;
      }
    }
  }

  if (covered > R.columns.length / 2) return { kind: 'covered' };
  if (found.length < R.minColumns) return { kind: 'notFound' };

  found.sort((a, b) => a - b);
  const d = found[Math.floor(found.length / 2)];
  return { kind: 'found', point: { x: top.x + up.x * d, y: top.y + up.y * d, z: top.z } };
}
