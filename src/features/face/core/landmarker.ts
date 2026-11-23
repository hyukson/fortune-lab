import type { FaceDetector, FaceLandmarker, ImageSegmenter } from '@mediapipe/tasks-vision';
import { DETECTOR_MODEL_URL, HAIR_MODEL_URL, MODEL_URL, QUALITY_RULES, WASM_URL } from '../config';
import type { FaceLines, Pair } from '../types';

// MediaPipe 모델을 한 번만 만들어서 재사용 (처음 불러올 때 1~3초 걸림)
//  - landmarker: 얼굴 특징점 478개 + 표정 점수 + 고개 각도
//  - hair: 머리카락 영역 분할 (이마 위 머리카락 경계를 찾아 상정 길이를 잼)
//  - detector: 가벼운 얼굴 검출 (사진 속 얼굴 수를 다시 세서 콜라주·여러 명 사진을 거름)
type Loaded = { landmarker: FaceLandmarker; hair: ImageSegmenter | null; detector: FaceDetector | null; lines: FaceLines };
let loading: Promise<Loaded> | null = null;

export function loadLandmarker(): Promise<Loaded> {
  if (!loading) {
    loading = (async () => {
      // 라이브러리도 이때 불러옴 → 관상 페이지 밖에서는 다운로드되지 않음
      const { FaceDetector, FaceLandmarker, FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision');
      const fileset = await FilesetResolver.forVisionTasks(WASM_URL);

      const [landmarker, hair, detector] = await Promise.all([
        FaceLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            // GPU는 기기마다 소수점 결과가 조금씩 달라질 수 있어 CPU로 고정 → 같은 사진 = 같은 결과
            delegate: 'CPU',
          },
          runningMode: 'IMAGE',
          numFaces: QUALITY_RULES.maxFacesToDetect,
          minFaceDetectionConfidence: QUALITY_RULES.minDetectionConfidence,
          minFacePresenceConfidence: QUALITY_RULES.minPresenceConfidence,
          outputFaceBlendshapes: true, // 표정 검사용
          outputFacialTransformationMatrixes: true, // 고개 각도 계산용
        }),
        // 머리카락 모델은 없어도 분석은 되므로, 실패하면 null (상정은 추정값으로 대체)
        ImageSegmenter.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: HAIR_MODEL_URL, delegate: 'CPU' },
          runningMode: 'IMAGE',
          outputConfidenceMasks: true,
          outputCategoryMask: false,
        }).catch((e) => {
          console.warn('머리카락 모델을 불러오지 못했어요', e);
          return null;
        }),
        FaceDetector.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: DETECTOR_MODEL_URL, delegate: 'CPU' },
          runningMode: 'IMAGE',
          minDetectionConfidence: 0.5,
        }).catch((e) => {
          console.warn('얼굴 검출 모델을 불러오지 못했어요', e);
          return null;
        }),
      ]);

      const pairs = (list: { start: number; end: number }[]): Pair[] => list.map((c) => [c.start, c.end]);
      const lines: FaceLines = {
        mesh: pairs(FaceLandmarker.FACE_LANDMARKS_TESSELATION),
        contours: [
          ...pairs(FaceLandmarker.FACE_LANDMARKS_FACE_OVAL),
          ...pairs(FaceLandmarker.FACE_LANDMARKS_LEFT_EYE),
          ...pairs(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE),
          ...pairs(FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW),
          ...pairs(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW),
          ...pairs(FaceLandmarker.FACE_LANDMARKS_LIPS),
        ],
      };
      return { landmarker, hair, detector, lines };
    })();
    loading.catch(() => {
      loading = null; // 실패하면 다음에 다시 시도
    });
  }
  return loading;
}
