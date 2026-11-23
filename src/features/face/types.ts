// 관상 기능에서 주고받는 데이터 모양

export type Point = { x: number; y: number; z: number }; // 픽셀 좌표
export type Box = { x: number; y: number; w: number; h: number };
export type Pair = [number, number]; // 특징점 번호 두 개를 잇는 선

// 성별: 얼굴 비율의 평균이 성별에 따라 달라서 기준 범위를 따로 둠 ('any'는 구분 없이)
export type Sex = 'female' | 'male' | 'any';

// 이마 위 머리카락 경계 찾기 결과
export type Hairline =
  | { kind: 'found'; point: Point }
  | { kind: 'covered' } // 앞머리가 이마를 덮음
  | { kind: 'notFound' } // 머리카락이 안 보임 (모자, 짧은 머리, 사진 위쪽 잘림 등)
  | { kind: 'unavailable' }; // 머리카락 모델을 못 불러옴

// ── 사진 검사 ──
export type IssueCode =
  | 'FILE_TYPE'
  | 'FILE_TOO_BIG'
  | 'FILE_BROKEN'
  | 'IMAGE_TOO_SMALL'
  | 'NO_FACE'
  | 'MULTIPLE_FACES'
  | 'FACE_TOO_SMALL'
  | 'FACE_TOO_CLOSE'
  | 'FACE_OFF_CENTER'
  | 'FACE_CUT_OFF'
  | 'HEAD_TILTED'
  | 'HEAD_TURNED'
  | 'HEAD_PITCHED'
  | 'SMILING'
  | 'MOUTH_OPEN'
  | 'EYES_CLOSED'
  | 'TOO_DARK'
  | 'TOO_BRIGHT'
  | 'BLURRY'
  | 'EYES_COVERED'
  | 'MASK'
  | 'MODEL_LOAD_FAILED';

export type Quality = {
  faceCount: number;
  faceWidthRatio: number;
  centerOffset: number;
  rollDeg: number;
  yawDeg: number;
  pitchDeg: number;
  smile: number;
  jawOpen: number;
  eyeBlink: number;
  brightness: number;
  sharpness: number;
  eyeToFaceBrightness: number;
  lowerFaceColorGap: number; // 미간과 코 아래 피부색 차이 (마스크 감지)
  lipContrast: number; // 입술이 주변 피부보다 붉은 정도 (마스크 감지)
  maskScore: number; // 위 두 값을 합친 마스크 점수
};

// ── 측정값 (모두 비율 또는 각도 → 사진 크기와 무관) ──
export type MetricKey = 'faceAspect' | 'eyeTilt' | 'eyeSpacing' | 'noseWidth' | 'mouthWidth' | 'jawWidth';
export type Metrics = Record<MetricKey, number> & {
  samjeong: { upper: number; middle: number; lower: number }; // 합이 1
  // hairline: 머리카락 경계까지 실제로 잼 / mesh: 찾지 못해 특징점 맨 위까지로 대신 잼
  samjeongMethod: 'hairline' | 'mesh';
};

// ── 풀이 ──
export type Level = 'low' | 'mid' | 'high';
export type FortuneKey = 'wealth' | 'love' | 'social' | 'career' | 'vitality';
export type SamjeongKey = 'upper' | 'middle' | 'lower' | 'balanced';

export type Trait = {
  key: MetricKey;
  part: string; // 부위 이름
  level: Level;
  position: number; // 게이지 위치 0~100
  scale: [string, string, string]; // 게이지 양끝·가운데 이름
  title: string;
  text: string;
  measured: string; // 근거가 된 측정값 설명
};

export type Reading = {
  ruleVersion: string;
  type: { key: FortuneKey; title: string; summary: string };
  scores: { key: FortuneKey; label: string; score: number }[];
  sex: Sex;
  samjeong: {
    key: SamjeongKey;
    ratios: Metrics['samjeong'];
    method: Metrics['samjeongMethod'];
    hairline: Hairline['kind'];
    title: string;
    text: string;
  };
  traits: Trait[];
};

// ── 분석 결과 ──
export type FaceLines = { mesh: Pair[]; contours: Pair[] };

export type Analysis =
  | {
      ok: true;
      image: HTMLCanvasElement;
      points: Point[];
      hairline: Hairline;
      lines: FaceLines;
      metrics: Metrics;
      quality: Quality;
      reading: Reading;
    }
  | { ok: false; issues: IssueCode[]; quality?: Quality; debug?: Metrics };
