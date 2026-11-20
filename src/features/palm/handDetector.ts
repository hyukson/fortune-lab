// MediaPipe Hand Landmarker로 손 특징점 21개를 찾고, 손바닥 너비(길이 비교 기준)를 계산합니다.
import type { HandLandmarker } from '@mediapipe/tasks-vision';
import { HAND_MODEL_URL, MEDIAPIPE_WASM_PATH } from './config';

export type Point = { x: number; y: number };

export type HandInfo = {
  points: Point[];   // 21개 특징점 (사진 픽셀 좌표)
  palmWidth: number; // 손바닥 너비: 검지 뿌리(5번) ~ 새끼 뿌리(17번) 거리
  handedness: string;
};

let landmarkerPromise: Promise<HandLandmarker> | null = null;

// 모델은 처음 한 번만 불러오고 재사용 (라이브러리도 이때 내려받음)
function getLandmarker(): Promise<HandLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH);
      return HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: HAND_MODEL_URL },
        runningMode: 'IMAGE',
        numHands: 1,
      });
    })();
    // 실패하면 다음에 다시 시도할 수 있게 초기화
    landmarkerPromise.catch(() => {
      landmarkerPromise = null;
    });
  }
  return landmarkerPromise;
}

export async function detectHand(image: HTMLCanvasElement): Promise<HandInfo | null> {
  const landmarker = await getLandmarker();
  const result = landmarker.detect(image);
  if (result.landmarks.length === 0) return null;

  const points = result.landmarks[0].map((p) => ({ x: p.x * image.width, y: p.y * image.height }));
  const palmWidth = Math.hypot(points[5].x - points[17].x, points[5].y - points[17].y);
  const handedness = result.handedness?.[0]?.[0]?.categoryName ?? '';
  return { points, palmWidth, handedness };
}
