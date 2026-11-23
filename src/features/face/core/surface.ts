import type { Point } from '../types';
import { dist, LM } from './geometry';

// 마스크 착용 감지에 쓰는 피부색 측정
//  - lowerFaceColorGap: 미간(가려지지 않는 곳)과 코 아래 볼·턱의 색 차이. 마스크를 쓰면 커짐
//  - lipContrast: 입술이 볼보다 붉은 정도. 마스크로 입이 가려지면 0 근처
// 실제 마스크 착용 사진 26장과 한국인 얼굴 사진으로 기준을 정했습니다 (config.ts의 SURFACE_RULES)

type RGB = [number, number, number];

function meanColor(ctx: CanvasRenderingContext2D, c: Point, r: number): RGB {
  const x = Math.max(0, Math.round(c.x - r));
  const y = Math.max(0, Math.round(c.y - r));
  const w = Math.min(Math.max(2, Math.round(r * 2)), ctx.canvas.width - x);
  const h = Math.min(Math.max(2, Math.round(r * 2)), ctx.canvas.height - y);
  if (w < 2 || h < 2) return [0, 0, 0];
  const { data } = ctx.getImageData(x, y, w, h);
  let R = 0;
  let G = 0;
  let B = 0;
  const n = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    R += data[i];
    G += data[i + 1];
    B += data[i + 2];
  }
  return [R / n, G / n, B / n];
}

const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: 0 });
const lum = ([r, g, b]: RGB) => 0.299 * r + 0.587 * g + 0.114 * b + 1;
const chroma = ([r, g, b]: RGB) => {
  const s = r + g + b + 1;
  return [r / s, g / s];
};
const redness = ([r, g, b]: RGB) => r / ((g + b) / 2 + 1);
const average = (colors: RGB[]): RGB =>
  [0, 1, 2].map((k) => colors.reduce((s, c) => s + c[k], 0) / colors.length) as RGB;

export function measureSurface(canvas: HTMLCanvasElement, pts: Point[]) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const r = Math.max(3, dist(pts[LM.faceRight], pts[LM.faceLeft]) * 0.035);

  // 기준 피부: 미간과 두 눈 사이 (앞머리·마스크에 잘 가려지지 않는 곳)
  const ref = average([meanColor(ctx, pts[LM.browCenter], r), meanColor(ctx, pts[LM.noseBridge], r)]);
  // 코 아래: 양쪽 볼(코 옆)과 턱
  const cheeks = average([meanColor(ctx, pts[LM.cheekRightLow], r), meanColor(ctx, pts[LM.cheekLeftLow], r)]);
  const lower = average([cheeks, cheeks, meanColor(ctx, pts[LM.chinFront], r)]);

  // 색 차이 = 색조 차이(×10) + 밝기 차이(로그 비율)
  const [rr, rg] = chroma(ref);
  const [lr, lg] = chroma(lower);
  const lowerFaceColorGap = Math.hypot(rr - lr, rg - lg) * 10 + Math.abs(Math.log(lum(lower) / lum(ref)));

  // 입술: 윗입술·아랫입술 가운데
  const lips = average([
    meanColor(ctx, mid(pts[LM.upperLipTop], pts[LM.upperLipInner]), r * 0.6),
    meanColor(ctx, mid(pts[LM.lowerLipInner], pts[LM.lowerLipBottom]), r * 0.6),
  ]);
  const lipContrast = redness(lips) - redness(cheeks);

  // 마스크 점수: 색 차이가 크고 입술 붉은 기가 없을수록 높음
  // 볼 블러셔 화장으로 볼이 입술보다 붉은 경우(lipContrast < 0)가 마스크로 오인되지 않도록 -0.1에서 자름
  const maskScore = lowerFaceColorGap - 2 * Math.max(lipContrast, -0.1);

  return { lowerFaceColorGap, lipContrast, maskScore };
}
