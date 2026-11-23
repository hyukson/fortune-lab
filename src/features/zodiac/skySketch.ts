// 담당: 김예진
// "밤하늘에 내 별자리가 빛나는" p5.js 스케치
//   ① 배경 별들이 반짝임 → ② 내 별자리의 별이 하나씩 나타남 → ③ 별 사이 선이 이어지며 그려짐
//   → ④ 금빛으로 은은하게 숨 쉬듯 빛남 + 가끔 별똥별
//
// p5 캔버스 안에서는 CSS 변수를 못 쓰므로 팀 공식 색과 같은 값을 숫자로 사용 (AGENTS.md 3번)
//   배경 #100C18 = (16, 12, 24) / 카드 #24182E = (36, 24, 46)
//   금색 #EBC47B = (235, 196, 123) / 본문 #F7EEDF = (247, 238, 223) / 보조 #C9B5D3 = (201, 181, 211)
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 작성했습니다. (AI 사용 비율: 약 100%)

import type p5 from 'p5';
import { CONSTELLATIONS } from './constellations';
import { randomFrom } from './seed';

const HEIGHT = 340; // 캔버스 높이 (가로는 화면 폭에 맞춤)
const STAR_IN_TIME = 1.4; // 별이 모두 나타나는 데 걸리는 시간(초)
const LINE_TIME = 2.2; // 선이 모두 그려지는 데 걸리는 시간(초)

type BgStar = { x: number; y: number; size: number; phase: number; speed: number };
type Meteor = { x: number; y: number; vx: number; vy: number; life: number };

/** 0~1 사이로 자르기 */
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function createNightSkySketch(signId: string, reducedMotion: boolean) {
  const data = CONSTELLATIONS[signId];

  return (p: p5) => {
    let bgStars: BgStar[] = [];
    let meteor: Meteor | null = null;
    let nextMeteorAt = 4; // 첫 별똥별이 나올 시간(초)
    let startTime = 0;

    /** 캔버스를 감싸는 div의 폭에 맞춤 */
    function fitWidth(): number {
      const parent = (p as unknown as { canvas: HTMLCanvasElement }).canvas.parentElement;
      return Math.max(280, parent?.clientWidth ?? 600);
    }

    /** 배경 별 만들기 (별자리마다 항상 같은 배치가 나오도록 시드 사용) */
    function makeBgStars() {
      const random = randomFrom(`sky|${signId}`);
      const count = Math.round((p.width * p.height) / 1800);
      bgStars = Array.from({ length: count }, () => ({
        x: random() * p.width,
        y: random() * p.height,
        size: random() < 0.9 ? 1 + random() : 2 + random() * 1.2,
        phase: random() * Math.PI * 2,
        speed: 0.8 + random() * 2,
      }));
    }

    /** 별자리 좌표(0~1)를 캔버스 가운데 영역의 픽셀 좌표로 변환 */
    function toCanvas(x: number, y: number): [number, number] {
      const box = Math.min(p.width * 0.7, p.height * 0.78);
      const left = (p.width - box) / 2;
      const top = (p.height - box) / 2;
      return [left + x * box, top + y * box];
    }

    /** 캔버스 2D 컨텍스트 (빛 번짐 효과용) */
    const ctx = () => (p as unknown as { drawingContext: CanvasRenderingContext2D }).drawingContext;

    function drawBackground(t: number) {
      p.background(16, 12, 24);

      // 별자리 뒤의 은은한 보라빛 성운
      const g = ctx().createRadialGradient(p.width / 2, p.height / 2, 0, p.width / 2, p.height / 2, p.height * 0.75);
      g.addColorStop(0, 'rgba(36, 24, 46, 0.95)');
      g.addColorStop(0.6, 'rgba(36, 24, 46, 0.35)');
      g.addColorStop(1, 'rgba(16, 12, 24, 0)');
      ctx().fillStyle = g;
      ctx().fillRect(0, 0, p.width, p.height);

      // 반짝이는 배경 별
      p.noStroke();
      for (const s of bgStars) {
        const twinkle = reducedMotion ? 0.7 : 0.45 + 0.55 * Math.abs(Math.sin(t * s.speed + s.phase));
        p.fill(247, 238, 223, 200 * twinkle);
        p.circle(s.x, s.y, s.size);
      }
    }

    function drawConstellation(t: number) {
      const starCount = data.stars.length;
      // 선: 별이 다 나타난 뒤부터 하나씩 이어짐
      const lineProgress = reducedMotion ? data.lines.length : clamp01((t - STAR_IN_TIME) / LINE_TIME) * data.lines.length;

      ctx().shadowColor = 'rgba(235, 196, 123, 0.8)';
      ctx().shadowBlur = 10;
      p.strokeWeight(1.6);
      data.lines.forEach(([a, b], i) => {
        const amount = clamp01(lineProgress - i); // 이 선이 얼마나 그려졌는지 (0~1)
        if (amount <= 0) return;
        const [x1, y1] = toCanvas(data.stars[a][0], data.stars[a][1]);
        const [x2, y2] = toCanvas(data.stars[b][0], data.stars[b][1]);
        p.stroke(235, 196, 123, 150);
        p.line(x1, y1, x1 + (x2 - x1) * amount, y1 + (y2 - y1) * amount);
      });

      // 별: 하나씩 나타난 뒤 숨 쉬듯 빛남
      p.noStroke();
      data.stars.forEach(([x, y, bright], i) => {
        const appear = reducedMotion ? 1 : clamp01((t - (i / starCount) * STAR_IN_TIME) / 0.4);
        if (appear <= 0) return;
        const [cx, cy] = toCanvas(x, y);
        const pulse = reducedMotion ? 1 : 0.8 + 0.2 * Math.sin(t * 2 + i);
        const core = (2.5 + bright * 1.8) * appear;

        // 바깥 빛무리
        ctx().shadowBlur = 25 * pulse;
        p.fill(235, 196, 123, 60 * appear * pulse);
        p.circle(cx, cy, core * 4.5);
        // 별 중심
        ctx().shadowBlur = 18 * pulse;
        p.fill(247, 238, 223, 255 * appear);
        p.circle(cx, cy, core);
      });
      ctx().shadowBlur = 0;
    }

    function drawMeteor(t: number, dt: number) {
      if (!meteor && t > nextMeteorAt) {
        meteor = {
          x: p.random(p.width * 0.3, p.width),
          y: p.random(-20, p.height * 0.3),
          vx: -p.random(350, 500),
          vy: p.random(120, 200),
          life: 1,
        };
        nextMeteorAt = t + p.random(5, 9);
      }
      if (!meteor) return;
      meteor.x += meteor.vx * dt;
      meteor.y += meteor.vy * dt;
      meteor.life -= dt * 0.9;
      const tail = 0.18; // 꼬리 길이 (초 단위 이동 거리)
      p.strokeWeight(1.5);
      p.stroke(247, 238, 223, 220 * meteor.life);
      p.line(meteor.x, meteor.y, meteor.x - meteor.vx * tail, meteor.y - meteor.vy * tail);
      if (meteor.life <= 0 || meteor.x < -100 || meteor.y > p.height + 100) meteor = null;
    }

    p.setup = () => {
      p.createCanvas(600, HEIGHT);
      p.resizeCanvas(fitWidth(), HEIGHT);
      p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
      makeBgStars();
      startTime = p.millis();
      if (reducedMotion) p.noLoop(); // 동작 줄이기: 완성된 그림 한 장만
    };

    p.draw = () => {
      const t = (p.millis() - startTime) / 1000;
      const dt = Math.min(0.05, p.deltaTime / 1000);
      drawBackground(t);
      if (data) drawConstellation(t);
      if (!reducedMotion) drawMeteor(t, dt);
    };

    p.windowResized = () => {
      const w = fitWidth();
      if (w === p.width) return;
      p.resizeCanvas(w, HEIGHT);
      makeBgStars();
      if (reducedMotion) p.redraw();
    };
  };
}
