import { useMemo, useRef } from 'react';
import type p5 from 'p5';
import P5Canvas from '../../../components/P5Canvas';
import { LM, portraitCrop } from '../core/geometry';
import type { FaceLines, Pair, Point } from '../types';

// 얼굴 사진 위에 특징점·윤곽선·측정선을 그리는 p5 스케치
//  - animate=true : 점 → 그물망 → 윤곽 → 측정선 순서로 나타나는 스캔 연출 (끝나면 onDone)
//  - animate=false: 완성된 모습을 한 번만 그림 (결과 화면)
type Props = {
  image: HTMLCanvasElement;
  points: Point[];
  hairline?: Point | null; // 이마 위 머리카락 경계 (찾았을 때만)
  lines: FaceLines;
  animate?: boolean;
  onDone?: () => void;
  showIndices?: boolean; // 개발용: 관상에 쓰는 점 번호 표시
};

const W = 480;
const H = 600;
export const SCAN_SECONDS = 5; // 연출 전체 길이

// p5 캔버스 안에서는 CSS 변수를 못 써서 같은 색을 직접 적음 (theme.css와 동일)
const GOLD: [number, number, number] = [235, 196, 123]; // --color-gold
const SUB: [number, number, number] = [201, 181, 211]; // --color-sub
const BG: [number, number, number] = [16, 12, 24]; // --color-bg

// 측정에 쓰는 선 (measure.ts에서 길이를 재는 구간과 같음)
const MEASURES: Pair[] = [
  [LM.faceRight, LM.faceLeft],
  [LM.foreheadTop, LM.chin],
  [LM.rightEyeOuter, LM.rightEyeInner],
  [LM.leftEyeInner, LM.leftEyeOuter],
  [LM.rightEyeInner, LM.leftEyeInner],
  [LM.noseRight, LM.noseLeft],
  [LM.mouthRight, LM.mouthLeft],
  [LM.jawRight, LM.jawLeft],
];
const USED = new Set<number>(Object.values(LM));

const ease = (t: number) => 1 - (1 - t) ** 3;
const progress = (t: number, start: number, end: number) => Math.min(1, Math.max(0, (t - start) / (end - start)));

export default function FaceCanvas({
  image,
  points,
  hairline = null,
  lines,
  animate = false,
  onDone,
  showIndices = false,
}: Props) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const sketch = useMemo(() => {
    const crop = portraitCrop(points, image.width, image.height);
    const scale = W / crop.w;
    // 사진 좌표 → 캔버스 좌표
    const pts = points.map((p) => ({ x: (p.x - crop.x) * scale, y: (p.y - crop.y) * scale }));
    const hair = hairline ? { x: (hairline.x - crop.x) * scale, y: (hairline.y - crop.y) * scale } : null;
    const ys = pts.map((p) => p.y);
    const top = Math.min(...ys);
    const height = Math.max(...ys) - top;
    const rise = (i: number) => (pts[i].y - top) / height; // 위에서부터의 위치 0~1

    return (p: p5) => {
      let done = false;

      p.setup = () => {
        p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
        p.createCanvas(W, H);
        if (!animate) p.noLoop();
      };

      p.draw = () => {
        const t = animate ? p.millis() / 1000 : SCAN_SECONDS;

        // 1) 사진 + 어두운 막 (금색 선이 잘 보이도록)
        p.drawingContext.drawImage(image, crop.x, crop.y, crop.w, crop.h, 0, 0, W, H);
        p.noStroke();
        p.fill(BG[0], BG[1], BG[2], 60 + 70 * progress(t, 0, 1));
        p.rect(0, 0, W, H);

        // 2) 위에서 아래로 훑는 스캔 범위
        const sweep = progress(t, 0.2, 2.2) * 1.15;

        // 3) 그물망: 스캔 중엔 또렷하게, 끝나면 은은하게
        const meshAlpha = 90 - 62 * progress(t, 2.4, 3.4);
        p.stroke(SUB[0], SUB[1], SUB[2], meshAlpha);
        p.strokeWeight(0.6);
        for (const [a, b] of lines.mesh) {
          if (rise(a) < sweep && rise(b) < sweep) p.line(pts[a].x, pts[a].y, pts[b].x, pts[b].y);
        }

        // 4) 특징점
        p.noStroke();
        for (let i = 0; i < pts.length; i++) {
          const appear = progress(sweep, rise(i), rise(i) + 0.08);
          if (appear <= 0) continue;
          // 스캔선이 막 지나간 점은 금색으로 반짝임
          const flash = 1 - progress(sweep, rise(i) + 0.02, rise(i) + 0.2);
          const c = flash > 0.05 ? GOLD : SUB;
          p.fill(c[0], c[1], c[2], 70 + 185 * flash);
          p.circle(pts[i].x, pts[i].y, 1.6 + 2.2 * flash);
        }

        // 5) 스캔선
        if (sweep > 0 && sweep < 1.1) {
          const y = top + height * sweep;
          for (let k = 0; k < 28; k++) {
            p.stroke(GOLD[0], GOLD[1], GOLD[2], 60 * (1 - k / 28));
            p.strokeWeight(1);
            p.line(0, y - k * 2, W, y - k * 2);
          }
          p.stroke(GOLD[0], GOLD[1], GOLD[2], 230);
          p.strokeWeight(1.5);
          p.line(0, y, W, y);
        }

        // 6) 윤곽선 (얼굴형 · 눈 · 눈썹 · 입)
        const contour = progress(t, 2.0, 3.2);
        p.stroke(GOLD[0], GOLD[1], GOLD[2], 200);
        p.strokeWeight(1.4);
        const shown = Math.floor(lines.contours.length * contour);
        for (let i = 0; i < shown; i++) {
          const [a, b] = lines.contours[i];
          p.line(pts[a].x, pts[a].y, pts[b].x, pts[b].y);
        }

        // 7) 삼정 경계선 (머리카락 경계 · 미간 · 코 밑)
        const guide = ease(progress(t, 3.0, 3.6));
        if (guide > 0) {
          const left = pts[LM.faceRight].x;
          const right = pts[LM.faceLeft].x;
          const mid = (left + right) / 2;
          const half = ((right - left) / 2) * 1.08 * guide;
          const ctx = p.drawingContext as CanvasRenderingContext2D;
          ctx.setLineDash([5, 6]);
          p.stroke(GOLD[0], GOLD[1], GOLD[2], 150);
          p.strokeWeight(1);
          const ys = [pts[LM.browCenter].y, pts[LM.noseBase].y];
          if (hair) ys.push(hair.y);
          for (const y of ys) p.line(mid - half, y, mid + half, y);
          ctx.setLineDash([]);
          if (hair) {
            p.noStroke();
            p.fill(GOLD[0], GOLD[1], GOLD[2], 255 * guide);
            p.circle(hair.x, hair.y, 6);
          }
        }

        // 8) 측정선: 하나씩 차례로 그어짐
        MEASURES.forEach(([a, b], i) => {
          const g = ease(progress(t, 3.1 + i * 0.16, 3.6 + i * 0.16));
          if (g <= 0) return;
          const ax = pts[a].x;
          const ay = pts[a].y;
          const bx = ax + (pts[b].x - ax) * g;
          const by = ay + (pts[b].y - ay) * g;
          p.stroke(GOLD[0], GOLD[1], GOLD[2], 255);
          p.strokeWeight(2);
          p.line(ax, ay, bx, by);
          p.noStroke();
          p.fill(GOLD[0], GOLD[1], GOLD[2]);
          p.circle(ax, ay, 6);
          p.circle(bx, by, 6);
        });

        // 개발용: 관상에 쓰는 점 번호
        if (showIndices) {
          p.textSize(11);
          p.stroke(BG[0], BG[1], BG[2]);
          p.strokeWeight(3);
          p.fill(255);
          for (const i of USED) p.text(String(i), pts[i].x + 5, pts[i].y - 5);
        }

        if (animate && !done && t >= SCAN_SECONDS) {
          done = true;
          p.noLoop();
          onDoneRef.current?.();
        }
      };
    };
  }, [image, points, hairline, lines, animate, showIndices]);

  return (
    <div className="face-canvas">
      <P5Canvas sketch={sketch} />
    </div>
  );
}
