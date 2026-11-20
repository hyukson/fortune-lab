// 결과 화면 p5.js 스케치: 사진 위에 검출된 손금을 한 획씩 그려 주는 애니메이션
import type p5 from 'p5';
import { LINE_INFO, type LineKey } from './config';
import type { Pt } from './lineMetrics';

export type SketchLine = { key: LineKey; paths: Pt[][] };

export type SketchData = {
  image: HTMLCanvasElement;
  width: number;  // 캔버스 가로 (px)
  lines: SketchLine[];
  palmA: Pt;      // 손바닥 너비 기준점 (검지 뿌리)
  palmB: Pt;      // 손바닥 너비 기준점 (새끼 뿌리)
};

// 팀 공식 색 (theme.css와 같은 값)
const BG: [number, number, number] = [16, 12, 24];   // --color-bg
const TEXT: [number, number, number] = [247, 238, 223]; // --color-text
const FONT = "Pretendard, 'Noto Sans KR', system-ui, sans-serif";
const DRAW_FRAMES = 90; // 선이 다 그려지는 데 걸리는 프레임 수 (약 1.5초)

export function createResultSketch(data: SketchData) {
  return (p: p5) => {
    const s = data.width / data.image.width;
    const height = Math.round(data.image.height * s);
    let progress = 0;

    p.setup = () => {
      p.createCanvas(data.width, height);
      p.textFont(FONT);
    };

    p.draw = () => {
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      p.background(...BG);
      ctx.drawImage(data.image, 0, 0, data.width, height);

      // 선이 잘 보이도록 사진을 살짝 어둡게
      p.noStroke();
      p.fill(BG[0], BG[1], BG[2], 90);
      p.rect(0, 0, p.width, p.height);

      // 손바닥 너비 (길이 비교 기준) — 가는 점선 + 양 끝 점
      ctx.save();
      ctx.setLineDash([4, 6]);
      p.stroke(TEXT[0], TEXT[1], TEXT[2], 130);
      p.strokeWeight(1.2);
      p.line(data.palmA.x * s, data.palmA.y * s, data.palmB.x * s, data.palmB.y * s);
      ctx.restore();
      p.noStroke();
      p.fill(TEXT[0], TEXT[1], TEXT[2], 200);
      p.circle(data.palmA.x * s, data.palmA.y * s, 6);
      p.circle(data.palmB.x * s, data.palmB.y * s, 6);

      progress = Math.min(1, progress + 1 / DRAW_FRAMES);
      for (const line of data.lines) drawLine(line, progress);

      if (progress >= 1) {
        placed.length = 0;
        for (const line of data.lines) drawLabel(line);
        // 손바닥 너비 이름표는 새끼손가락 쪽 끝 근처에
        drawLabelAt('손바닥 너비(기준)', data.palmB.x, data.palmB.y + 18 / s, TEXT);
        p.noLoop(); // 다 그리면 멈춤 (불필요한 계산 방지)
      }
    };

    // 이미 그린 이름표 위치 (겹치지 않게 비켜 놓기 위함)
    const placed: { x: number; y: number; w: number; h: number }[] = [];

    // 진행도(0~1)만큼만 선 그리기
    function drawLine(line: SketchLine, t: number) {
      const total = line.paths.reduce((n, path) => n + path.length, 0);
      let budget = Math.floor(total * t);
      const rgb = LINE_INFO[line.key].rgb;
      p.noFill();
      for (const path of line.paths) {
        if (budget <= 1) break;
        const count = Math.min(path.length, budget);
        budget -= count;
        // 어두운 테두리 → 색 선 순서로 그려서 밝은 피부 위에서도 잘 보이게
        for (const [weight, color] of [
          [7, [BG[0], BG[1], BG[2], 200]],
          [3.5, [rgb[0], rgb[1], rgb[2], 255]],
        ] as const) {
          p.stroke(color[0], color[1], color[2], color[3]);
          p.strokeWeight(weight);
          p.beginShape();
          for (let i = 0; i < count; i++) p.vertex(path[i].x * s, path[i].y * s);
          p.endShape();
        }
      }
    }

    // 가장 긴 조각의 가운데에 이름표
    function drawLabel(line: SketchLine) {
      const longest = line.paths.reduce((a, b) => (b.length > a.length ? b : a), [] as Pt[]);
      if (longest.length === 0) return;
      const mid = longest[Math.floor(longest.length / 2)];
      drawLabelAt(LINE_INFO[line.key].name, mid.x, mid.y - 16 / s, LINE_INFO[line.key].rgb);
    }

    function drawLabelAt(label: string, x: number, y: number, rgb: readonly [number, number, number]) {
      p.textSize(13);
      p.textStyle(p.BOLD);
      const w = p.textWidth(label) + 16;
      const h = 22;
      const cx = p.constrain(x * s, w / 2 + 4, p.width - w / 2 - 4);
      let cy = p.constrain(y * s, 16, p.height - 16);
      // 다른 이름표와 겹치면 위·아래로 조금씩 옮겨 보기
      const overlaps = (yy: number) =>
        placed.some((r) => Math.abs(r.x - cx) < (r.w + w) / 2 + 4 && Math.abs(r.y - yy) < (r.h + h) / 2 + 2);
      for (const dy of [0, -26, 26, -52, 52, -78, 78]) {
        const yy = p.constrain(y * s + dy, 16, p.height - 16);
        if (!overlaps(yy)) {
          cy = yy;
          break;
        }
      }
      placed.push({ x: cx, y: cy, w, h });
      p.noStroke();
      p.fill(BG[0], BG[1], BG[2], 220);
      p.rect(cx - w / 2, cy - 11, w, 22, 11);
      p.fill(rgb[0], rgb[1], rgb[2]);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(label, cx, cy);
    }
  };
}
