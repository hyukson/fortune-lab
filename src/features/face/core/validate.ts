import type { FaceDetector, FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { countFaces } from './faceCount';
import { LIVE_RULES, QUALITY_RULES as R, SURFACE_RULES as S } from '../config';
import type { IssueCode, Point, Quality } from '../types';
import { boundingBox, dist, headPose, LM } from './geometry';
import { brightness, sharpness } from './image';
import { measureSurface } from './surface';

// 사진 품질 검사: 분석에 쓸 수 없는 사진을 걸러냄
// live=true 는 실시간 카메라용 (가이드 안에 얼굴이 들어왔는지도 함께 검사)
// issues는 안내 우선순위 순서로 담김 (첫 번째가 가장 먼저 고쳐야 할 것)
export function validateFace(
  result: FaceLandmarkerResult,
  pts: Point[] | null,
  canvas: HTMLCanvasElement,
  live = false,
  detector: FaceDetector | null = null,
): { issues: IssueCode[]; quality?: Quality } {
  // 얼굴이 없으면 (동물·풍경·물건 사진 등) 바로 종료
  if (result.faceLandmarks.length === 0 || !pts) return { issues: ['NO_FACE'] };

  const issues: IssueCode[] = [];
  const { width: W, height: H } = canvas;

  // 여러 명: 특징점 모델이 찾은 얼굴 수와, 검출 모델로 작은 얼굴까지 다시 센 수 중 큰 값
  // (실시간 카메라는 속도 때문에 다시 세지 않음)
  const mainWidth = dist(pts[LM.faceRight], pts[LM.faceLeft]);
  const faceCount = Math.max(result.faceLandmarks.length, live ? 1 : countFaces(detector, canvas, mainWidth));
  if (faceCount > 1) issues.push('MULTIPLE_FACES');

  // 얼굴 크기 · 위치 · 잘림
  const faceBox = boundingBox(pts);
  const faceWidthRatio = mainWidth / Math.min(W, H);
  const centerOffset = Math.hypot(
    (faceBox.x + faceBox.w / 2) / W - 0.5,
    (faceBox.y + faceBox.h / 2) / H - 0.5,
  );
  const m = R.edgeMargin;
  const cutOff = result.faceLandmarks[0].some((p) => p.x < m || p.x > 1 - m || p.y < m || p.y > 1 - m);
  if (cutOff) issues.push('FACE_CUT_OFF');
  if (faceWidthRatio < (live ? LIVE_RULES.minFaceWidthRatio : R.minFaceWidthRatio)) issues.push('FACE_TOO_SMALL');
  if (live && faceWidthRatio > LIVE_RULES.maxFaceWidthRatio) issues.push('FACE_TOO_CLOSE');
  if (live && centerOffset > LIVE_RULES.maxCenterOffset) issues.push('FACE_OFF_CENTER');

  // 마스크: 코 아래 색이 미간 피부색과 크게 다르고, 입술의 붉은 기가 보이지 않음
  // (애니·일러스트는 대부분 얼굴 검출 단계에서 NO_FACE로 걸러짐)
  const surface = measureSurface(canvas, pts);
  if (surface.maskScore > S.maxMaskScore) issues.push('MASK');

  // 고개 각도
  const pose = headPose(pts, result.facialTransformationMatrixes?.[0]?.data);
  if (Math.abs(pose.yaw) > R.maxYawDeg) issues.push('HEAD_TURNED');
  if (Math.abs(pose.pitch) > R.maxPitchDeg) issues.push('HEAD_PITCHED');
  if (Math.abs(pose.roll) > R.maxRollDeg) issues.push('HEAD_TILTED');

  // 표정
  const shapes = new Map(result.faceBlendshapes?.[0]?.categories.map((c) => [c.categoryName, c.score]) ?? []);
  const smile = Math.max(shapes.get('mouthSmileLeft') ?? 0, shapes.get('mouthSmileRight') ?? 0);
  const jawOpen = shapes.get('jawOpen') ?? 0;
  const eyeBlink = Math.max(shapes.get('eyeBlinkLeft') ?? 0, shapes.get('eyeBlinkRight') ?? 0);
  if (eyeBlink > R.maxEyeBlink) issues.push('EYES_CLOSED');
  if (jawOpen > R.maxJawOpen) issues.push('MOUTH_OPEN');
  if (smile > R.maxSmile) issues.push('SMILING');

  // 화질
  const faceBright = brightness(canvas, faceBox);
  const faceSharp = sharpness(canvas, faceBox);
  if (faceBright < R.minBrightness) issues.push('TOO_DARK');
  if (faceBright > R.maxBrightness) issues.push('TOO_BRIGHT');
  // 웹캠 영상은 원래 덜 선명해서 실시간 검사에서는 흐림을 보지 않음
  if (!live && faceSharp < R.minSharpness) issues.push('BLURRY');

  // 선글라스: 눈 주변이 얼굴 평균보다 지나치게 어두우면 가려진 것으로 판단 (간이 방식)
  const eyeBox = boundingBox([
    pts[LM.rightEyeOuter], pts[LM.rightEyeTop], pts[LM.rightEyeBottom],
    pts[LM.leftEyeOuter], pts[LM.leftEyeTop], pts[LM.leftEyeBottom],
  ]);
  const eyeToFaceBrightness = brightness(canvas, eyeBox) / Math.max(1, faceBright);
  if (eyeToFaceBrightness < R.minEyeToFaceBrightness) issues.push('EYES_COVERED');

  return {
    issues,
    quality: {
      faceCount,
      faceWidthRatio,
      centerOffset,
      rollDeg: pose.roll,
      yawDeg: pose.yaw,
      pitchDeg: pose.pitch,
      smile,
      jawOpen,
      eyeBlink,
      brightness: faceBright,
      sharpness: faceSharp,
      eyeToFaceBrightness,
      ...surface,
    },
  };
}
