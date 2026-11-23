// MediaPipe Hand Landmarker로 손 특징점 21개를 찾고, 손바닥 너비(길이 비교 기준)를 계산합니다.
// 사진 분석(IMAGE)과 카메라 실시간 검사(VIDEO)가 모델 하나를 같이 씁니다.
import type { HandLandmarker } from '@mediapipe/tasks-vision';
import { HAND_MODEL_URL, MEDIAPIPE_WASM_PATH } from './config';

export type Point = { x: number; y: number };

export type HandInfo = {
  points: Point[];   // 21개 특징점 (사진 픽셀 좌표)
  palmWidth: number; // 손바닥 너비: 검지 뿌리(5번) ~ 새끼 뿌리(17번) 거리
  handedness: string;
};

type Mode = 'IMAGE' | 'VIDEO';

let landmarkerPromise: Promise<HandLandmarker> | null = null;
let currentMode: Mode = 'IMAGE';

// 모델은 처음 한 번만 불러오고 재사용 (라이브러리도 이때 내려받음)
export function loadHandLandmarker(): Promise<HandLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH);
      currentMode = 'IMAGE';
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

async function useMode(mode: Mode): Promise<HandLandmarker> {
  const landmarker = await loadHandLandmarker();
  if (currentMode !== mode) {
    await landmarker.setOptions({ runningMode: mode });
    currentMode = mode;
  }
  return landmarker;
}

/** 사진 한 장에서 손 찾기 */
export async function detectHand(image: HTMLCanvasElement): Promise<HandInfo | null> {
  const landmarker = await useMode('IMAGE');
  const result = landmarker.detect(image);
  if (result.landmarks.length === 0) return null;

  const points = result.landmarks[0].map((p) => ({ x: p.x * image.width, y: p.y * image.height }));
  const palmWidth = Math.hypot(points[5].x - points[17].x, points[5].y - points[17].y);
  const handedness = result.handedness?.[0]?.[0]?.categoryName ?? '';
  return { points, palmWidth, handedness };
}

/**
 * 카메라용: 영상 한 장면에서 손 특징점을 바로(동기) 찾는 함수를 돌려줌.
 * 결과 좌표는 영상 픽셀 좌표. 손이 없으면 null.
 */
export async function prepareVideoDetector(): Promise<(video: HTMLVideoElement) => Point[] | null> {
  const landmarker = await useMode('VIDEO');
  let last = 0;
  return (video) => {
    if (currentMode !== 'VIDEO' || !video.videoWidth) return null;
    const ts = Math.max(performance.now(), last + 1); // 시간은 항상 커져야 함
    last = ts;
    const result = landmarker.detectForVideo(video, ts);
    const lm = result.landmarks[0];
    if (!lm) return null;
    return lm.map((p) => ({ x: p.x * video.videoWidth, y: p.y * video.videoHeight }));
  };
}
