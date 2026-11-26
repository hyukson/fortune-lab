// 담당: 장진영
// "밤하늘 천체 원판" 분위기를 p5.js로 직접 그리는 함수 모음
//   - 성운 배경(펄린 노이즈), 반짝이는 별, 행성 구슬, 달의 위상, 빛나는 초승달, 회전하는 천체 원판
// 참고 이미지의 분위기만 참고했고, 모든 그림은 코드로 새로 그립니다 (이미지 파일 사용 X).
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 함수 단위로 작성했습니다. (AI 사용 비율: 약 100%)

import type p5 from 'p5';
import { PALETTE, mix, type RGB } from './palette';

const TAU = Math.PI * 2;

/**
 * 성운(보랏빛 구름) 배경 이미지를 한 번 만들어 두는 함수.
 * - 작은 이미지(240×150)의 픽셀마다 펄린 노이즈 값을 구해 "구름 진하기"로 사용
 * - 진할수록 배경색 → 카드 보라 → 연보라 순으로 섞음 (팀 색상만 사용)
 * - 화면 가운데는 옅게(글자·카드가 잘 보이게), 가장자리는 진하게
 * 작게 만든 뒤 화면 크기로 늘려 그리면 자연스럽게 흐려져서 구름처럼 보입니다.
 * [AI 도움: Claude] 노이즈 기반 픽셀 생성 작성
 */
export function createNebula(p: p5): p5.Image {
  const W = 240;
  const H = 150;
  const img = p.createImage(W, H);
  p.noiseSeed(Math.floor(p.random(100000)));
  p.noiseDetail(5, 0.5);
  img.loadPixels();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = p.noise(x * 0.012, y * 0.019); // 큰 구름 덩어리
      const wisp = p.noise(x * 0.04 + 50, y * 0.04 + 50); // 잔결
      // 가운데에서 멀수록 1에 가까운 값 (비네트)
      const dx = (x / W - 0.5) * 2;
      const dy = (y / H - 0.5) * 2;
      const edge = Math.min(1, Math.sqrt(dx * dx + dy * dy) / 1.2);
      let v = Math.min(1, Math.max(0, (n - 0.4) * 2.6)) * (0.55 + 0.45 * wisp);
      v *= 0.3 + 0.7 * edge;

      let c = mix(PALETTE.bg, PALETTE.card, Math.min(1, v * 1.4));
      c = mix(c, PALETTE.sub, Math.max(0, v - 0.45) * 0.6);
      const i = (y * W + x) * 4;
      img.pixels[i] = c[0];
      img.pixels[i + 1] = c[1];
      img.pixels[i + 2] = c[2];
      img.pixels[i + 3] = 255;
    }
  }
  img.updatePixels();
  p.noiseDetail(4, 0.5); // p5 기본값으로 되돌림
  return img;
}

/**
 * 십자 모양으로 빛나는 금색 별 ✦ (가운데 번짐 + 가는 빛줄기 4개 + 하얀 중심)
 * [AI 도움: Claude]
 */
export function drawSparkle(p: p5, x: number, y: number, s: number, alpha = 255): void {
  p.noStroke();
  p.fill(...PALETTE.gold, alpha * 0.1);
  p.circle(x, y, s * 2.4);
  p.fill(...PALETTE.gold, alpha * 0.22);
  p.circle(x, y, s * 1.1);
  p.fill(...PALETTE.goldHover, alpha);
  p.quad(x - s * 1.6, y, x, y - s * 0.12, x + s * 1.6, y, x, y + s * 0.12); // 가로 빛줄기
  p.quad(x, y - s * 1.6, x + s * 0.12, y, x, y + s * 1.6, x - s * 0.12, y); // 세로 빛줄기
  p.fill(...PALETTE.text, alpha);
  p.circle(x, y, s * 0.35);
}

/**
 * 입체감 있는 행성 구슬: 어두운 원 위에 점점 밝고 작은 원을 왼쪽 위로 비켜 겹쳐 그림
 * [AI 도움: Claude]
 */
export function drawPlanet(p: p5, x: number, y: number, r: number, base: RGB): void {
  const dark = mix(base, PALETTE.bg, 0.65);
  const light = mix(base, PALETTE.text, 0.6);
  p.noStroke();
  p.fill(...base, 40);
  p.circle(x, y, r * 2.8); // 은은한 빛
  const steps = 5;
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    const c = t < 0.6 ? mix(dark, base, t / 0.6) : mix(base, light, (t - 0.6) / 0.4);
    p.fill(...c);
    const off = r * 0.3 * t;
    p.circle(x - off, y - off, r * 2 * (1 - t * 0.7));
  }
}

/**
 * 달의 위상 아이콘 (phase: 0=삭, 2=상현, 4=보름, 6=하현, 그 사이는 초승·그믐·볼록달)
 * 원리: 밝은 반원을 그린 뒤, 가운데에 폭이 바뀌는 타원을 밝은색/어두운색으로 덮어서 모양을 만듦
 * [AI 도움: Claude]
 */
export function drawMoonPhase(p: p5, x: number, y: number, r: number, phase: number): void {
  const f = (phase % 8) / 8;
  p.push();
  p.translate(x, y);
  p.noStroke();
  p.fill(...PALETTE.card);
  p.circle(0, 0, r * 2);
  if (phase % 8 === 4) {
    p.fill(...PALETTE.gold);
    p.circle(0, 0, r * 2);
  } else if (phase % 8 !== 0) {
    const waxing = f < 0.5; // 차오르는 달이면 오른쪽이 밝음
    p.fill(...PALETTE.gold);
    p.arc(0, 0, r * 2, r * 2, waxing ? -p.HALF_PI : p.HALF_PI, waxing ? p.HALF_PI : p.HALF_PI * 3, p.PIE);
    const gibbous = f > 0.25 && f < 0.75; // 반달보다 더 찬 달
    p.fill(...(gibbous ? PALETTE.gold : PALETTE.card));
    p.ellipse(0, 0, r * 2 * Math.abs(Math.cos(TAU * f)), r * 2);
  }
  p.noFill();
  p.stroke(...PALETTE.gold, 140);
  p.strokeWeight(Math.max(0.6, r * 0.08));
  p.circle(0, 0, r * 2);
  p.pop();
}

/**
 * 초승달: 큰 원에서 살짝 비켜 놓은 원을 "빼서" 만듦.
 * 캔버스 2D API의 evenodd 채우기 규칙 사용 (겹친 부분은 비워짐) + 큰 원 밖은 잘라냄(clip)
 * glow가 true면 주변에 은은한 빛 번짐을 추가
 * [AI 도움: Claude]
 */
export function drawCrescent(p: p5, x: number, y: number, r: number, glow: boolean): void {
  if (glow) {
    p.noStroke();
    for (let k = 3; k >= 1; k--) {
      p.fill(...PALETTE.gold, 16);
      p.circle(x, y, r * 2 * (1 + k * 0.45));
    }
  }
  const ctx = p.drawingContext as CanvasRenderingContext2D;
  const ox = x + r * 0.42;
  const oy = y - r * 0.2;
  const or = r * 0.86;
  p.push(); // p5 push = 캔버스 save + p5 스타일 저장
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.clip();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.moveTo(ox + or, oy);
  ctx.arc(ox, oy, or, 0, TAU);
  ctx.fillStyle = `rgb(${PALETTE.goldHover.join(',')})`;
  ctx.fill('evenodd');
  p.pop(); // 잘라내기(clip)·색 설정 원상복구
}

/**
 * 회전하는 천체 원판 (섞기 화면 가운데, 과거·현재·미래 자리 뒤 배경에 사용)
 * 구성(바깥 → 안쪽):
 *   ① 바깥 궤도 + 도는 행성 4개 + 상하좌우의 반짝이는 별
 *   ② 금색 이중 고리 + 눈금 72개 (천천히 시계 방향)
 *   ③ 달의 위상 8칸 고리 (반시계 방향)
 *   ④ 안쪽 원판: 방사선 + 팔각 별자리 선 + 작은 행성 (시계 방향)
 *   ⑤ 가운데 빛나는 초승달
 * t: 시간(ms). 0으로 주면 멈춘 그림이 됩니다.
 * [AI 도움: Claude]
 */
export function drawCelestialWheel(p: p5, cx: number, cy: number, R: number, t: number): void {
  const gold = PALETTE.gold;
  const tones: RGB[] = [PALETTE.gold, PALETTE.sub, PALETTE.text, mix(PALETTE.gold, PALETTE.card, 0.35)];
  p.push();
  p.translate(cx, cy);

  // ① 바깥 궤도 + 행성 + 반짝이는 별
  p.noFill();
  p.stroke(...gold, 70);
  p.strokeWeight(1);
  p.circle(0, 0, R * 2.24);
  for (let k = 0; k < 4; k++) {
    const a = t * 0.00012 + k * p.HALF_PI + 0.5;
    drawPlanet(p, Math.cos(a) * R * 1.12, Math.sin(a) * R * 1.12, R * 0.04, tones[k]);
  }
  for (let k = 0; k < 4; k++) {
    const a = k * p.HALF_PI - p.HALF_PI;
    drawSparkle(p, Math.cos(a) * R, Math.sin(a) * R, R * 0.05, 230);
  }

  // ② 이중 고리 + 눈금
  p.noFill();
  p.stroke(...gold, 210);
  p.strokeWeight(Math.max(1, R * 0.012));
  p.circle(0, 0, R * 2);
  p.stroke(...gold, 120);
  p.strokeWeight(1);
  p.circle(0, 0, R * 1.9);
  p.push();
  p.rotate(t * 0.00004);
  for (let i = 0; i < 72; i++) {
    const a = (i * TAU) / 72;
    const len = i % 6 === 0 ? R * 0.06 : R * 0.025;
    p.stroke(...gold, i % 6 === 0 ? 200 : 110);
    p.line(Math.cos(a) * (R * 0.95 - len), Math.sin(a) * (R * 0.95 - len), Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95);
  }
  p.pop();

  // ③ 달의 위상 8칸 고리
  p.push();
  p.rotate(-t * 0.00007);
  p.noFill();
  p.stroke(...gold, 150);
  p.circle(0, 0, R * 1.76);
  p.circle(0, 0, R * 1.24);
  for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8 - p.HALF_PI;
    const d = a + TAU / 16; // 칸 사이 구분선
    p.stroke(...gold, 110);
    p.line(Math.cos(d) * R * 0.62, Math.sin(d) * R * 0.62, Math.cos(d) * R * 0.88, Math.sin(d) * R * 0.88);
    const mx = Math.cos(a) * R * 0.75;
    const my = Math.sin(a) * R * 0.75;
    p.noFill();
    p.stroke(...PALETTE.sub, 90);
    p.circle(mx, my, R * 0.2);
    drawMoonPhase(p, mx, my, R * 0.065, i);
  }
  p.pop();

  // ④ 안쪽 원판
  p.noStroke();
  p.fill(...PALETTE.bg, 130);
  p.circle(0, 0, R * 1.2);
  p.noFill();
  p.stroke(...gold, 170);
  p.circle(0, 0, R * 1.2);
  p.stroke(...gold, 80);
  p.circle(0, 0, R * 1.13);
  p.push();
  p.rotate(t * 0.0001);
  p.stroke(...PALETTE.sub, 60);
  for (let i = 0; i < 16; i++) {
    const a = (i * TAU) / 16;
    p.line(Math.cos(a) * R * 0.2, Math.sin(a) * R * 0.2, Math.cos(a) * R * 0.55, Math.sin(a) * R * 0.55);
  }
  // 팔각 별자리 선: 8개 점을 3칸씩 건너뛰며 연결
  p.stroke(...gold, 70);
  const pt = (i: number) => {
    const a = (i * TAU) / 8;
    return [Math.cos(a) * R * 0.48, Math.sin(a) * R * 0.48] as const;
  };
  for (let i = 0; i < 8; i++) {
    const [x1, y1] = pt(i);
    const [x2, y2] = pt(i + 3);
    p.line(x1, y1, x2, y2);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8 + TAU / 16;
    const rr = i % 2 === 0 ? R * 0.42 : R * 0.3;
    drawPlanet(p, Math.cos(a) * rr, Math.sin(a) * rr, R * 0.026, tones[i % 4]);
  }
  p.pop();

  // ⑤ 가운데 초승달
  p.noFill();
  p.stroke(...gold, 130);
  p.circle(0, 0, R * 0.38);
  drawCrescent(p, 0, 0, R * 0.14, true);
  p.pop();
}
