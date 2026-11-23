import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { Box, Point } from '../types';

// MediaPipe 478개 특징점 중 관상에 쓰는 번호
// "오른쪽/왼쪽"은 사진 속 사람 기준 (사진에서는 반대쪽에 보임)
// 번호가 맞는 부위인지는 개발 모드의 "점 번호 보기"로 확인할 수 있습니다.
export const LM = {
  foreheadTop: 10,
  browCenter: 9, // 미간 (상정/중정 경계)
  noseBase: 2, // 코 밑 (중정/하정 경계)
  chin: 152,
  faceRight: 234,
  faceLeft: 454,
  jawRight: 172,
  jawLeft: 397,

  rightEyeOuter: 33,
  rightEyeInner: 133,
  rightEyeTop: 159,
  rightEyeBottom: 145,
  leftEyeInner: 362,
  leftEyeOuter: 263,
  leftEyeTop: 386,
  leftEyeBottom: 374,

  noseBridge: 168, // 두 눈 사이 콧대
  noseRight: 129,
  noseLeft: 358,

  mouthRight: 61,
  mouthLeft: 291,
  upperLipTop: 0,
  upperLipInner: 13,
  lowerLipInner: 14,
  lowerLipBottom: 17,
  chinFront: 199, // 아랫입술 아래 턱

  cheekRightHigh: 117, // 눈 밑 광대
  cheekLeftHigh: 346,
  cheekRightLow: 205, // 코 옆 볼
  cheekLeftLow: 425,
} as const;

// 정규화 좌표(0~1)를 픽셀 좌표로 변환
// (정규화 좌표 그대로 거리를 재면 가로세로 비율이 다른 사진에서 값이 왜곡됨)
export function toPixels(landmarks: NormalizedLandmark[], width: number, height: number): Point[] {
  return landmarks.map((p) => ({ x: p.x * width, y: p.y * height, z: p.z * width }));
}

export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

const toDeg = (rad: number) => (rad * 180) / Math.PI;

// 고개 각도 (도). 0에 가까울수록 정면
// matrix: MediaPipe가 주는 얼굴 변환 행렬(4x4, 열 우선). 없으면 특징점 깊이로 추정
export function headPose(pts: Point[], matrix?: number[]) {
  const eyeR = pts[LM.rightEyeOuter];
  const eyeL = pts[LM.leftEyeOuter];
  const roll = toDeg(Math.atan2(eyeL.y - eyeR.y, eyeL.x - eyeR.x));

  if (matrix && matrix.length === 16) {
    // 얼굴이 바라보는 방향 벡터 = 회전 행렬의 세 번째 열
    const [fx, fy, fz] = [matrix[8], matrix[9], matrix[10]];
    return {
      roll,
      yaw: toDeg(Math.atan2(fx, fz)),
      pitch: toDeg(Math.atan2(fy, Math.hypot(fx, fz))),
    };
  }
  const faceR = pts[LM.faceRight];
  const faceL = pts[LM.faceLeft];
  const top = pts[LM.foreheadTop];
  const chin = pts[LM.chin];
  return {
    roll,
    yaw: toDeg(Math.atan2(faceL.z - faceR.z, faceL.x - faceR.x)),
    pitch: toDeg(Math.atan2(chin.z - top.z, chin.y - top.y)),
  };
}

// 두 눈이 수평이 되도록 모든 점을 회전 (기울어진 사진도 같은 기준으로 측정)
export function alignByEyes(pts: Point[]): Point[] {
  const eyeR = pts[LM.rightEyeOuter];
  const eyeL = pts[LM.leftEyeOuter];
  const angle = -Math.atan2(eyeL.y - eyeR.y, eyeL.x - eyeR.x);
  const cx = (eyeR.x + eyeL.x) / 2;
  const cy = (eyeR.y + eyeL.y) / 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return pts.map((p) => ({
    x: cx + (p.x - cx) * cos - (p.y - cy) * sin,
    y: cy + (p.x - cx) * sin + (p.y - cy) * cos,
    z: p.z,
  }));
}

export function boundingBox(pts: Point[]): Box {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

// 결과 화면에 보여줄 얼굴 중심 4:5 영역 (사진 밖으로 나가지 않게 조정)
export function portraitCrop(pts: Point[], imgW: number, imgH: number): Box {
  const face = boundingBox(pts);
  let w = face.w * 1.7;
  let h = w * 1.25;
  const fit = Math.min(1, imgW / w, imgH / h);
  w *= fit;
  h *= fit;
  const cx = face.x + face.w / 2;
  const cy = face.y + face.h * 0.46; // 이마·머리가 보이도록 살짝 위로
  const x = Math.min(Math.max(0, cx - w / 2), imgW - w);
  const y = Math.min(Math.max(0, cy - h / 2), imgH - h);
  return { x, y, w, h };
}
