import type { Hairline, Metrics, Point } from '../types';
import { alignByEyes, dist, LM } from './geometry';

// 관상 측정값 계산
// 모든 값이 비율·각도라서 사진 크기나 촬영 거리와 무관하게 같은 얼굴이면 같은 값이 나옴
export function measureFace(rawPts: Point[], hairline: Hairline = { kind: 'unavailable' }): Metrics {
  // 머리카락 경계 점도 함께 회전시키기 위해 맨 끝에 붙여서 정렬
  const withHair = hairline.kind === 'found' ? [...rawPts, hairline.point] : rawPts;
  const p = alignByEyes(withHair); // 두 눈을 수평으로 맞춘 뒤 측정
  const hairPoint = hairline.kind === 'found' ? p[p.length - 1] : null;

  const faceWidth = dist(p[LM.faceRight], p[LM.faceLeft]);
  const faceLength = dist(p[LM.foreheadTop], p[LM.chin]);

  const rightEyeW = dist(p[LM.rightEyeOuter], p[LM.rightEyeInner]);
  const leftEyeW = dist(p[LM.leftEyeOuter], p[LM.leftEyeInner]);
  const eyeW = (rightEyeW + leftEyeW) / 2;

  // 눈꼬리 각도: 바깥 꼬리가 안쪽 꼬리보다 위에 있으면 + (화면 y는 아래로 갈수록 커짐)
  const tilt = (inner: Point, outer: Point) =>
    (Math.atan2(inner.y - outer.y, Math.abs(inner.x - outer.x)) * 180) / Math.PI;
  const eyeTilt =
    (tilt(p[LM.rightEyeInner], p[LM.rightEyeOuter]) + tilt(p[LM.leftEyeInner], p[LM.leftEyeOuter])) / 2;

  // 삼정: 이마 위(머리카락 경계) ~ 미간 ~ 코 밑 ~ 턱 끝의 세로 길이 비율
  const topY = hairPoint ? hairPoint.y : p[LM.foreheadTop].y;
  const upper = p[LM.browCenter].y - topY;
  const middle = p[LM.noseBase].y - p[LM.browCenter].y;
  const lower = p[LM.chin].y - p[LM.noseBase].y;
  const total = upper + middle + lower;

  return {
    faceAspect: faceLength / faceWidth,
    eyeTilt,
    eyeSpacing: dist(p[LM.rightEyeInner], p[LM.leftEyeInner]) / eyeW,
    noseWidth: dist(p[LM.noseRight], p[LM.noseLeft]) / faceWidth,
    mouthWidth: dist(p[LM.mouthRight], p[LM.mouthLeft]) / faceWidth,
    jawWidth: dist(p[LM.jawRight], p[LM.jawLeft]) / faceWidth,
    samjeong: { upper: upper / total, middle: middle / total, lower: lower / total },
    samjeongMethod: hairPoint ? 'hairline' : 'mesh',
  };
}
