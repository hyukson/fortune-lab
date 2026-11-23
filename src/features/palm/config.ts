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
export const CONF_THRESHOLD = 0.2;   // 이 점수 이상인 검출만 사용
export const IOU_THRESHOLD = 0.5;    // 겹치는 검출 정리 기준
export const MASK_THRESHOLD = 0.5;   // 마스크 픽셀을 '선'으로 볼 기준
export const MAX_IMAGE_SIDE = 1280;  // 큰 사진은 이 크기로 줄여서 처리

// 손바닥만 잘라서 모델에 넣기 (palmCrop.ts)
export const CROP_SIZE_FACTOR = 2.1; // 잘라낼 정사각형 한 변 = 손바닥 길이 × 이 값 (손목 ~ 손가락 대부분이 들어옴)
export const CROP_SHIFT = 0;         // 손바닥 중심에서 손가락 쪽으로 손바닥 길이 × 이 값만큼 옮겨서 자름 (0 = 손바닥이 가운데)

// 모델의 클래스 이름 (palm-lines.json이 없을 때 사용하는 기본값)
// Roboflow 데이터셋 순서: Head-Line, Heart-Line, Life-Line
export const DEFAULT_CLASS_NAMES = ['Head-Line', 'Heart-Line', 'Life-Line'];

// ---------------------------------------------------------------------
// 3. 손금 판정 기준 (팀 문서 AGENTS.md 5번 + 손금 담당 기준)
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
// 4. 손 모양 · 손가락 판정 기준 (MediaPipe 손 특징점 21개로 계산)
//    ⚠️ 처음 정한 값이라 실제 손 사진 여러 장으로 확인하며 조정하세요.
//       개발 모드에서 콘솔에 __palmDev.analyzeFile(파일) 을 실행하면 측정값을 볼 수 있어요.
// ---------------------------------------------------------------------
// 손바닥 모양 = 손바닥 길이(손목 0번 ~ 중지 뿌리 9번) ÷ 손바닥 너비(검지 뿌리 5번 ~ 새끼 뿌리 17번)
export const PALM_LONG_RATIO = 1.55;   // 이 값 이상 → 긴 손바닥, 미만 → 네모난 손바닥
// 손가락 길이 = 중지 길이(뿌리~끝 마디 합) ÷ 손바닥 길이
export const FINGER_LONG_RATIO = 1.05; // 이 값 이상 → 긴 손가락, 미만 → 짧은 손가락
// 검지 ÷ 약지 길이
export const INDEX_RING_LOW = 0.95;    // 미만 → 약지가 긴 손
export const INDEX_RING_HIGH = 0.99;   // 초과 → 검지가 긴 손 (사이는 균형)
// 엄지 길이(뿌리 관절 2번 ~ 끝) ÷ 검지 길이
export const THUMB_SHORT = 0.66;       // 미만 → 짧은 엄지
export const THUMB_LONG = 0.78;        // 초과 → 긴 엄지
// 손가락을 접은 사진 거르기: 중지 길이 ÷ 손바닥 길이가 이보다 작으면 다시 찍기 안내
export const MIN_FINGER_RATIO = 0.6;

// ---------------------------------------------------------------------
// 5. 카메라 자동 촬영 기준 (화면 짧은 변 대비 비율)
// ---------------------------------------------------------------------
export const CAMERA_MIN_PALM = 0.22;  // 손바닥 길이가 이보다 작으면 "더 가까이"
export const CAMERA_MAX_PALM = 0.55;  // 이보다 크면 "조금 멀리"
export const CAMERA_MAX_OFFSET = 0.2; // 손바닥 중심이 화면 가운데에서 이만큼 넘게 벗어나면 "가운데로"
export const CAMERA_MAX_MOVE = 0.015; // 한 번 검사할 때 이만큼 넘게 움직이면 "움직이지 말기"
export const CAMERA_HOLD_CHECKS = 12; // 조건을 연속으로 이만큼 만족하면 손금 확인 시작 (약 0.8초)
export const CAMERA_CHECK_MS = 66;    // 손 검사 간격 (초당 약 15번 → 특징점 표시가 부드럽게)
export const CAMERA_MIN_LINES = 2;    // 찍기 전 손금 확인: 3대 선 중 이만큼 찾으면 자동 촬영
export const CAMERA_RETRY_MS = 1500;  // 손금을 못 찾았을 때 다시 확인하기까지 기다리는 시간

// ---------------------------------------------------------------------
// 6. 손금 3대 선 정보
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
