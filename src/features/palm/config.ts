// =====================================================================
// 손금 기능 설정값 — 숫자만 바꾸면 판정 기준이 바뀝니다.
// 담당: 오예은
// =====================================================================

// ---------------------------------------------------------------------
// 1. 파일 경로
// ---------------------------------------------------------------------
// 손금 분할 모델(코랩에서 학습 → ONNX로 내보낸 파일)
// public/models/palm/ 폴더에 넣으면 됩니다. (GitHub Pages 하위 경로 때문에 BASE_URL 사용)
export const MODEL_URL = import.meta.env.BASE_URL + 'models/palm/palm-lines.onnx';
export const MODEL_INFO_URL = import.meta.env.BASE_URL + 'models/palm/palm-lines.json';

// MediaPipe 손 특징점 모델 (구글 공식 배포 주소)
export const MEDIAPIPE_WASM_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm';
export const HAND_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

// ---------------------------------------------------------------------
// 2. 손금 검출(YOLO 분할 모델) 설정
// ---------------------------------------------------------------------
export const INPUT_SIZE = 640;       // 코랩 학습 때 imgsz와 같아야 함
export const CONF_THRESHOLD = 0.25;  // 이 점수 이상인 검출만 사용
export const IOU_THRESHOLD = 0.5;    // 겹치는 검출 정리 기준
export const MASK_THRESHOLD = 0.5;   // 마스크 픽셀을 '선'으로 볼 기준
export const MAX_IMAGE_SIDE = 1280;  // 큰 사진은 이 크기로 줄여서 처리

// 모델의 클래스 이름 (palm-lines.json이 없을 때 사용하는 기본값)
// Roboflow 데이터셋 순서: Head-Line, Heart-Line, Life-Line
export const DEFAULT_CLASS_NAMES = ['Head-Line', 'Heart-Line', 'Life-Line'];

// ---------------------------------------------------------------------
// 3. 판정 기준 (팀 문서 AGENTS.md 5번 + 손금 담당 기준)
// ---------------------------------------------------------------------
// 길이 = 손금 길이 ÷ 손바닥 너비(검지 뿌리~새끼 뿌리)
export const LENGTH_SHORT = 0.8; // 0.8 미만 → 짧음
export const LENGTH_LONG = 1.3;  // 1.3 초과 → 김 (그 사이는 보통)

// 곡률 = 직선도(양 끝 직선거리 ÷ 선을 따라 잰 길이). 1이면 일직선
export const STRAIGHT_LINE = 0.95; // 0.95 이상 → 직선형
export const GENTLE_CURVE = 0.85;  // 0.85 이상 → 완만한 곡선, 미만 → 깊은 곡선

// 연속성 = 선이 몇 조각으로 나뉘었는지. 너무 작은 조각(잡음)은 빼고 셈
export const MIN_PIECE_PIXELS = 40; // 640×640 기준 픽셀 수

// ---------------------------------------------------------------------
// 4. 손금 3대 선 정보
//    색은 팀 공식 색(theme.css)과 같은 값 — p5 캔버스 안에서는 CSS 변수를 못 써서 숫자로 적음
// ---------------------------------------------------------------------
export type LineKey = 'life' | 'head' | 'heart';
export const LINE_KEYS: LineKey[] = ['life', 'head', 'heart'];

export const LINE_INFO: Record<LineKey, { name: string; rgb: [number, number, number] }> = {
  life: { name: '생명선', rgb: [235, 196, 123] },  // --color-gold
  head: { name: '두뇌선', rgb: [201, 181, 211] },  // --color-sub
  heart: { name: '감정선', rgb: [247, 238, 223] }, // --color-text
};

// 모델 클래스 이름 → 선 종류 (대소문자·기호가 달라도 찾을 수 있게)
export function lineKeyFromClassName(name: string): LineKey | null {
  const n = name.toLowerCase().replace(/[^a-z]/g, '');
  if (n.includes('life')) return 'life';
  if (n.includes('heart')) return 'heart';
  if (n.includes('head')) return 'head';
  return null;
}
