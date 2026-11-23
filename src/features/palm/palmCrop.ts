// 손금 모델에 넣기 전에 손바닥 부분만 잘라서 똑바로 세우기 (인식률 개선)
//
// 사진 전체를 640×640으로 줄이면 손이 작게 찍힌 사진은 손금이 몇 픽셀밖에 안 남아서 놓치기 쉬워요.
// 학습 데이터는 손바닥을 가까이서, 손가락이 위로 가게 찍은 사진이 대부분이라
// MediaPipe 특징점으로 손바닥을 찾아 '크게 · 똑바로' 잘라서 넣습니다.
import { CROP_SIZE_FACTOR, CROP_SHIFT, INPUT_SIZE } from './config';

type P = { x: number; y: number };

export type PalmCrop = {
  canvas: HTMLCanvasElement;   // INPUT_SIZE × INPUT_SIZE 로 잘라낸 손바닥
  scale: number;               // 원본 사진 1px → 잘라낸 그림에서 몇 px
  toImage: (p: P) => P;        // 잘라낸 그림 좌표 → 원본 사진 좌표
};

export function makePalmCrop(image: HTMLCanvasElement, pts: P[]): PalmCrop {
  const size = INPUT_SIZE;
  const wrist = pts[0];
  const middle = pts[9];
  const palmLength = Math.hypot(middle.x - wrist.x, middle.y - wrist.y);

  // 손목 → 중지 뿌리 방향이 위(-y)를 향하도록 돌리는 각도
  const angle = Math.atan2(middle.y - wrist.y, middle.x - wrist.x);
  const rot = -Math.PI / 2 - angle;

  // 손바닥 중심(손목 + 네 손가락 뿌리 평균)에서 손가락 쪽으로 조금 이동한 곳을 가운데로
  const ids = [0, 5, 9, 13, 17];
  const pc = {
    x: ids.reduce((s, i) => s + pts[i].x, 0) / ids.length,
    y: ids.reduce((s, i) => s + pts[i].y, 0) / ids.length,
  };
  const ux = (middle.x - wrist.x) / palmLength;
  const uy = (middle.y - wrist.y) / palmLength;
  const c = { x: pc.x + ux * palmLength * CROP_SHIFT, y: pc.y + uy * palmLength * CROP_SHIFT };

  const side = palmLength * CROP_SIZE_FACTOR; // 잘라낼 정사각형 한 변 (원본 px)
  const scale = size / side;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = 'rgb(114, 114, 114)'; // 사진 밖은 회색 (YOLO 학습 때와 같은 채움색)
  ctx.fillRect(0, 0, size, size);
  ctx.translate(size / 2, size / 2);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.translate(-c.x, -c.y);
  ctx.drawImage(image, 0, 0);

  const cos = Math.cos(-rot);
  const sin = Math.sin(-rot);
  const toImage = (p: P): P => {
    const dx = (p.x - size / 2) / scale;
    const dy = (p.y - size / 2) / scale;
    return { x: c.x + dx * cos - dy * sin, y: c.y + dx * sin + dy * cos };
  };

  return { canvas, scale, toImage };
}
