// 관상 기능의 모든 숫자 기준을 한 곳에 모은 파일
// 기준을 바꾸면 RULE_VERSION도 올려서 "어떤 규칙으로 나온 결과인지" 추적할 수 있게 합니다.
import type { FortuneKey, MetricKey, Sex } from './types';

export const RULE_VERSION = 'face-v1.2';

// MediaPipe 버전 — package.json의 @mediapipe/tasks-vision 버전과 반드시 같게 유지
export const MEDIAPIPE_VERSION = '1.2.3';
export const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
export const MODEL_URL = `${import.meta.env.BASE_URL}models/face/face_landmarker.task`;
export const HAIR_MODEL_URL = `${import.meta.env.BASE_URL}models/face/hair_segmenter.tflite`;
export const DETECTOR_MODEL_URL = `${import.meta.env.BASE_URL}models/face/blaze_face_short_range.tflite`;

// 얼굴 수 다시 세기 (core/faceCount.ts) — 콜라주·포스터·2인 사진처럼 작은 얼굴이 섞인 사진을 거름
export const FACE_COUNT_RULES = {
  // 얼굴 검출 신뢰도: 손·레이스·로고가 얼굴로 잡히면 0.61~0.67, 실제 두 번째 얼굴은 대부분 0.72 이상
  minScore: 0.7,
  minRelativeWidth: 0.4, // 주 얼굴 너비의 이 비율 이상인 얼굴만 '다른 사람'으로 셈 (멀리 지나가는 사람은 무시)
  tiles: 2, // 사진을 2×2로 나눠서도 찾음 (작은 얼굴용)
};

// ── 1. 파일 검사 ─────────────────────────────────────────────
export const IMAGE_RULES = {
  acceptTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxBytes: 15 * 1024 * 1024,
  minShortSide: 320,
  // 분석 전 긴 변을 이 크기로 통일 → 사진 크기가 달라도 같은 조건으로 분석
  analysisLongSide: 1024,
};

// ── 2. 사진 품질 검사 ────────────────────────────────────────
export const QUALITY_RULES = {
  minDetectionConfidence: 0.7,
  minPresenceConfidence: 0.7,
  maxFacesToDetect: 3, // 여러 명인지 알기 위해 3명까지 찾음

  minFaceWidthRatio: 0.2, // 얼굴 너비 / 사진 짧은 변
  edgeMargin: 0.005, // 특징점이 사진 가장자리에 닿으면 얼굴이 잘린 것

  maxRollDeg: 12, // 고개 기울임
  maxYawDeg: 15, // 좌우 돌림
  maxPitchDeg: 18, // 위아래 숙임

  maxSmile: 0.6, // 표정 점수 (0~1)
  maxJawOpen: 0.3,
  maxEyeBlink: 0.6,

  minBrightness: 55, // 얼굴 평균 밝기 (0~255)
  maxBrightness: 225,
  minSharpness: 30, // 낮을수록 흐림
  minEyeToFaceBrightness: 0.45, // 눈 주변 밝기 / 얼굴 밝기 (선글라스 감지)
};

// 마스크 판별 (core/surface.ts의 maskScore = 코 아래 색 차이 - 2 × 입술 붉은 기)
// 실측: 실제 마스크 착용 25장 중 24장 감지 / 마스크 안 쓴 얼굴 1,092장 중 3장 오탐
//       (오탐 3장은 모두 다른 이유로도 탈락하는 사진이라 마스크 검사만으로 막히는 정상 사진은 0장)
export const SURFACE_RULES = {
  maxMaskScore: 0.95,
};

// 이마 위 머리카락 경계 찾기 (core/hairline.ts)
export const HAIRLINE_RULES = {
  threshold: 0.5, // 머리카락일 확률
  minRun: 3, // 이 픽셀 수만큼 연속으로 머리카락이어야 경계로 인정
  maxSearch: 0.6, // 얼굴 길이의 이 비율까지만 위로 찾음
  columns: [-0.12, -0.06, 0, 0.06, 0.12], // 이마 가운데 기준 좌우로 잴 위치 (얼굴 너비 비율)
  minColumns: 3, // 이만큼 이상 찾아야 인정
};

// ── 실시간 카메라 촬영 ──────────────────────────────────────
export const LIVE_RULES = {
  tickMs: 160, // 검사 간격
  frameWidth: 640, // 검사용 프레임 너비
  holdTicks: 6, // 이 횟수만큼 연속 통과하면 자동 촬영 (약 1초)
  minFaceWidthRatio: 0.32, // 가이드 안에 얼굴이 충분히 크게
  maxFaceWidthRatio: 0.8,
  maxCenterOffset: 0.16, // 얼굴 중심이 화면 중앙에서 벗어난 정도 (0~0.5)
  manualAfterMs: 6000, // 자동 촬영이 안 되면 이 시간 뒤에 "직접 찍기" 버튼을 보여줌
};

// ── 3. 측정값 → 분류 기준 ───────────────────────────────────
// low 미만이면 '낮음', high 초과면 '높음', 그 사이는 '보통'
// 한국인 얼굴 사진 측정값 분포의 아래 25% / 위 25% 지점
// 표본: 사진 검사를 통과한 정면·무표정 한국인 얼굴 265명 (여성 176, 남성 89)
//   - 위키미디어 공용의 한국인 인물 사진(CC 라이선스) 32명
//   - 팀이 수집한 한국 연예인 웹 이미지 233명 (서양인·합성·그림·콜라주는 눈으로 확인해 제외)
// 'any'(성별 선택 안 함)는 여성·남성 기준을 같은 비중으로 평균
type Range = { low: number; high: number };
export const RANGES: Record<Sex, Record<MetricKey, Range>> = {
  any: {
    faceAspect: { low: 1.147, high: 1.21 }, // 얼굴 길이 / 얼굴 너비
    eyeTilt: { low: 5.45, high: 8.58 }, // 눈꼬리 각도(도), +면 올라감
    eyeSpacing: { low: 1.271, high: 1.361 }, // 눈 사이 거리 / 눈 가로 길이
    noseWidth: { low: 0.272, high: 0.289 }, // 콧볼 너비 / 얼굴 너비
    mouthWidth: { low: 0.328, high: 0.364 }, // 입 너비 / 얼굴 너비
    jawWidth: { low: 0.762, high: 0.797 }, // 턱 너비 / 얼굴 너비
  },
  female: {
    faceAspect: { low: 1.157, high: 1.219 },
    eyeTilt: { low: 6.54, high: 9.6 },
    eyeSpacing: { low: 1.252, high: 1.342 },
    noseWidth: { low: 0.274, high: 0.29 },
    mouthWidth: { low: 0.33, high: 0.369 },
    jawWidth: { low: 0.755, high: 0.789 },
  },
  male: {
    faceAspect: { low: 1.137, high: 1.201 },
    eyeTilt: { low: 4.35, high: 7.55 },
    eyeSpacing: { low: 1.289, high: 1.38 },
    noseWidth: { low: 0.27, high: 0.289 },
    mouthWidth: { low: 0.325, high: 0.359 },
    jawWidth: { low: 0.769, high: 0.805 },
  },
};

// 삼정(상정·중정·하정) 평균 비율과 허용 오차 (위 표본의 평균)
//  - hairline: 머리카락 경계까지 실제로 잰 경우 (202명)
//  - mesh: 앞머리 등으로 경계를 못 찾아 특징점 맨 위까지 잰 경우 (63명, 상정이 짧게 잡혀 기준이 다름)
export const SAMJEONG = {
  baseline: {
    hairline: { upper: 0.297, middle: 0.367, lower: 0.337 },
    mesh: { upper: 0.184, middle: 0.422, lower: 0.394 },
  },
  tolerance: 0.015, // 평균보다 이만큼 이상 길어야 '발달'로 판정
};

// ── 4. 운세 지표 점수 규칙 ──────────────────────────────────
// 점수 = base + Σ(가중치 × 측정값 위치) + balance × 삼정 균형도
// 측정값 위치: 기준 범위의 가운데가 0, low가 -1, high가 +1
export const SCORE_RULES: Record<
  FortuneKey,
  { base: number; weights: Partial<Record<MetricKey, number>>; balance: number }
> = {
  // base는 위 표본(265명)에서 대표 유형 5개가 고르게(각 18~23%) 나오도록 조정한 값
  wealth: { base: 74.5, weights: { noseWidth: 7, mouthWidth: 3, jawWidth: 3 }, balance: 4 },
  love: { base: 75, weights: { eyeTilt: -6, mouthWidth: 4, faceAspect: -4 }, balance: 4 },
  social: { base: 75.5, weights: { eyeSpacing: 6, mouthWidth: 5, eyeTilt: -2 }, balance: 4 },
  career: { base: 69, weights: { eyeTilt: 6, faceAspect: 3, eyeSpacing: -3 }, balance: 4 },
  vitality: { base: 76, weights: { jawWidth: 8, noseWidth: 2 }, balance: 6 },
};
export const SCORE_LIMIT = { min: 52, max: 98 };
// 점수가 같을 때 대표 유형을 정하는 우선순위
export const FORTUNE_ORDER: FortuneKey[] = ['wealth', 'career', 'social', 'love', 'vitality'];
