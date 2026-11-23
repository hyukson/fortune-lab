// 담당: 장진영
// p5.js로 카드 앞면/뒷면을 "직접" 그리는 함수 모음 (저작권 있는 덱 이미지를 쓰지 않기 위해 코드로 그림)
// 앞면: 아르누보 풍 장식 프레임(아치 그림 창 + 모서리 덩굴 + 번호 메달 + 이름 리본) + 카드별 그림
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 함수 단위로 작성했습니다. (AI 사용 비율: 약 100%)
//
// 모든 그리기 함수는 "카드 중심이 (0, 0)"이라고 가정합니다.
// → 호출하는 쪽에서 p.translate(x, y)로 위치를 옮긴 뒤 부르면 되고,
//   뒤집기(scale)·역방향(rotate)도 중심 기준으로 쉽게 적용됩니다.

import type p5 from 'p5';
import { drawCrescent, drawSparkle } from './celestial';
import type { TarotCard } from './deck';
import { drawMajorArt, hasMajorArt } from './majorArt';
import { drawMinorArt } from './minorArt';
import { CANVAS_FONT, CANVAS_SERIF, PALETTE, mix, rgba } from './palette';
import { drawStar } from './symbols';

/** 마이너 카드 번호 메달에 표시할 짧은 표기 (1~14) */
const RANK_SHORT = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'P', 'Kn', 'Q', 'K'];

/**
 * 그림 창(아치) 크기. 카드 너비 w, 높이 h에 대한 비율
 * - 가로 반폭 0.36w, 위 끝 -0.40h, 아래 끝 0.27h (위쪽은 반원 아치)
 */
const ARCH = { halfW: 0.36, top: -0.4, bottom: 0.27 };

/**
 * 숫자를 로마 숫자로 바꾸는 함수 (메이저 아르카나 번호 표기용). 0은 '0'으로 표시.
 * [AI 도움: Claude] 함수 작성
 */
export function toRoman(n: number): string {
  if (n === 0) return '0';
  const table: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let out = '';
  for (const [value, sym] of table) {
    while (n >= value) {
      out += sym;
      n -= value;
    }
  }
  return out;
}

/**
 * 글자가 maxW보다 넓으면 글자 크기를 줄여서 한 줄에 맞춰 쓰는 함수
 * [AI 도움: Claude] 함수 작성
 */
export function fitText(p: p5, str: string, x: number, y: number, maxW: number, size: number): void {
  p.textSize(size);
  const tw = p.textWidth(str);
  if (tw > maxW) p.textSize((size * maxW) / tw);
  p.text(str, x, y);
}

/**
 * 카드 공통 테두리: 둥근 사각형 + 금색 바깥선 + 연보라 안쪽선
 * [AI 도움: Claude] 함수 작성
 */
function drawFrame(p: p5, w: number, h: number): void {
  p.rectMode(p.CENTER);
  p.fill(...PALETTE.card);
  p.stroke(...PALETTE.gold);
  p.strokeWeight(Math.max(1, w * 0.025));
  p.rect(0, 0, w, h, w * 0.07);

  p.noFill();
  p.stroke(...PALETTE.sub, 110);
  p.strokeWeight(1);
  p.rect(0, 0, w * 0.86, h * 0.9, w * 0.04);
}

/**
 * 카드 뒷면: 천체 원판의 "축소판"
 *   어두운 안쪽 판 + 금색 삼중 원 + 눈금 12개 + 안쪽 방사선 8개 + 고리 위 작은 행성 4개
 *   + 가운데 초승달 + 위아래 반짝이는 별 + 네 모서리 작은 별
 * 카드 수십 장을 매 프레임 그리기 때문에, 원판보다 선 개수를 크게 줄인 가벼운 버전입니다.
 * [AI 도움: Claude] 함수 작성
 */
export function drawCardBack(p: p5, w: number, h: number): void {
  p.push();
  drawFrame(p, w, h);

  // 안쪽 어두운 판
  p.noStroke();
  p.fill(...PALETTE.bg, 120);
  p.rect(0, 0, w * 0.86, h * 0.9, w * 0.04);

  // 삼중 원
  const R = w * 0.34;
  p.noFill();
  p.stroke(...PALETTE.gold, 210);
  p.strokeWeight(Math.max(0.8, w * 0.012));
  p.circle(0, 0, R * 2);
  p.stroke(...PALETTE.gold, 110);
  p.strokeWeight(Math.max(0.6, w * 0.007));
  p.circle(0, 0, R * 1.62);
  p.circle(0, 0, R * 0.9);

  // 눈금 12개 (바깥 두 원 사이) + 방사선 8개 (안쪽)
  for (let i = 0; i < 12; i++) {
    const a = (i * p.TWO_PI) / 12;
    p.line(Math.cos(a) * R * 0.81, Math.sin(a) * R * 0.81, Math.cos(a) * R, Math.sin(a) * R);
  }
  p.stroke(...PALETTE.sub, 90);
  for (let i = 0; i < 8; i++) {
    const a = (i * p.TWO_PI) / 8 + p.PI / 8;
    p.line(Math.cos(a) * R * 0.45, Math.sin(a) * R * 0.45, Math.cos(a) * R * 0.81, Math.sin(a) * R * 0.81);
  }

  // 고리 위 작은 행성 4개 (대각선 방향)
  p.noStroke();
  const dots = [PALETTE.gold, PALETTE.sub, PALETTE.text, PALETTE.gold];
  dots.forEach((c, i) => {
    const a = p.PI / 4 + (i * p.TWO_PI) / 4;
    p.fill(...c);
    p.circle(Math.cos(a) * R, Math.sin(a) * R, w * 0.05);
  });

  // 가운데 초승달
  drawCrescent(p, 0, 0, R * 0.32, false);

  // 위아래 반짝이는 별 + 네 모서리 작은 별
  drawSparkle(p, 0, -h * 0.36, w * 0.045, 230);
  drawSparkle(p, 0, h * 0.36, w * 0.045, 230);
  p.fill(...PALETTE.gold, 170);
  const sx = w * 0.3;
  const sy = h * 0.37;
  const sr = w * 0.035;
  drawStar(p, -sx, -sy, sr, sr * 0.4, 4);
  drawStar(p, sx, -sy, sr, sr * 0.4, 4);
  drawStar(p, -sx, sy, sr, sr * 0.4, 4);
  drawStar(p, sx, sy, sr, sr * 0.4, 4);
  p.pop();
}

// ── 앞면 장식 프레임 부품 ──────────────────────────

/**
 * 아치(위가 반원인 창) 모양의 경로를 캔버스에 "그려 두기만" 하는 함수.
 * 이 경로로 ① 배경 채우기 ② 그림 잘라내기(clip) ③ 테두리 선 긋기를 모두 합니다.
 * inset: 안쪽으로 얼마나 들여서 그릴지 (이중 테두리용)
 * [AI 도움: Claude]
 */
function archPath(ctx: CanvasRenderingContext2D, w: number, h: number, inset = 0) {
  const hw = ARCH.halfW * w - inset;
  const top = ARCH.top * h + inset;
  const bottom = ARCH.bottom * h - inset;
  ctx.beginPath();
  ctx.moveTo(-hw, bottom);
  ctx.lineTo(-hw, top + hw);
  ctx.arc(0, top + hw, hw, Math.PI, 0); // 위쪽 반원
  ctx.lineTo(hw, bottom);
  ctx.closePath();
}

/**
 * 모서리 덩굴 장식 (아르누보 풍 곡선). sx, sy = ±1 로 좌우·상하 방향을 뒤집어 네 모서리에 사용
 * [AI 도움: Claude]
 */
function drawFlourish(p: p5, x: number, y: number, s: number, sx: number, sy: number) {
  p.push();
  p.translate(x, y);
  p.scale(sx, sy);
  p.noFill();
  p.stroke(...PALETTE.gold, 220);
  p.strokeWeight(Math.max(0.7, s * 0.06));
  p.bezier(0, s, 0, s * 0.25, s * 0.25, 0, s, 0); // 모서리를 감싸는 큰 곡선
  p.bezier(s * 0.18, s * 0.18, s * 0.6, s * 0.12, s * 0.55, s * 0.55, s * 0.3, s * 0.45); // 안쪽 소용돌이
  p.noStroke();
  p.fill(...PALETTE.gold);
  p.circle(s * 0.3, s * 0.45, s * 0.1);
  p.fill(...mix(PALETTE.gold, PALETTE.card, 0.3));
  p.ellipse(s * 0.75, s * 0.12, s * 0.28, s * 0.12); // 잎
  p.ellipse(s * 0.12, s * 0.75, s * 0.12, s * 0.28);
  p.pop();
}

/**
 * 그림 창 양옆의 가는 기둥 장식 (세로선 + 작은 마름모)
 * [AI 도움: Claude]
 */
function drawPillars(p: p5, w: number, h: number) {
  const x = 0.395 * w;
  const y1 = ARCH.top * h + ARCH.halfW * w;
  const y2 = ARCH.bottom * h;
  p.stroke(...PALETTE.gold, 150);
  p.strokeWeight(Math.max(0.6, w * 0.006));
  for (const sx of [-1, 1]) {
    p.line(sx * x, y1, sx * x, y2);
    p.noStroke();
    p.fill(...PALETTE.gold);
    for (let k = 0; k <= 3; k++) {
      const y = y1 + ((y2 - y1) * k) / 3;
      const d = w * 0.018;
      p.quad(sx * x, y - d, sx * x + d, y, sx * x, y + d, sx * x - d, y);
    }
    p.stroke(...PALETTE.gold, 150);
  }
}

/**
 * 그림 창 배경: 위는 보라, 아래는 짙은 남색으로 자연스럽게 바뀌는 그라데이션 + 작은 별
 * (별 위치는 카드마다 같은 공식을 써서 매 프레임 흔들리지 않게 고정)
 * [AI 도움: Claude]
 */
function drawArchBackground(p: p5, ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, ARCH.top * h, 0, ARCH.bottom * h);
  g.addColorStop(0, rgba(mix(PALETTE.card, PALETTE.sub, 0.18), 1));
  g.addColorStop(1, rgba(PALETTE.bg, 1));
  p.push(); // 캔버스에 색을 직접 지정할 때는 p5가 색을 다시 기억하도록 push/pop으로 감쌈
  ctx.fillStyle = g;
  archPath(ctx, w, h);
  ctx.fill();
  p.pop();
  p.noStroke();
  p.fill(...PALETTE.text, 150);
  for (let i = 0; i < 12; i++) {
    const x = (((i * 37) % 17) / 17 - 0.5) * 0.62 * w;
    const y = ARCH.top * h + 0.05 * h + (((i * 53) % 13) / 13) * 0.3 * h;
    p.circle(x, y, Math.max(1, w * 0.008));
  }
}

/**
 * 위쪽 번호 메달: 아치 꼭대기에 걸친 동그란 메달 안에 번호
 * [AI 도움: Claude]
 */
function drawMedallion(p: p5, w: number, h: number, label: string) {
  const y = ARCH.top * h;
  const r = 0.085 * w;
  p.fill(...PALETTE.card);
  p.stroke(...PALETTE.gold);
  p.strokeWeight(Math.max(0.8, w * 0.012));
  p.circle(0, y, r * 2);
  p.stroke(...PALETTE.gold, 120);
  p.circle(0, y, r * 1.6);
  p.noStroke();
  p.fill(...PALETTE.gold);
  p.textAlign(p.CENTER, p.CENTER);
  p.textFont(CANVAS_SERIF);
  p.textStyle(p.BOLD);
  fitText(p, label, 0, y + r * 0.05, r * 1.35, w * 0.075);
  p.textStyle(p.NORMAL);
  p.textFont(CANVAS_FONT);
}

/**
 * 아래쪽 이름 리본: 가운데 띠 + 양끝이 V자로 파인 접힌 꼬리
 * [AI 도움: Claude]
 */
function drawBanner(p: p5, w: number, h: number, title: string, subtitle: string) {
  const y = 0.335 * h;
  const bh = 0.07 * h;
  const bw = 0.34 * w;
  const drop = 0.015 * h;
  // 꼬리 (띠보다 조금 아래, 조금 어둡게)
  p.fill(...mix(PALETTE.card, PALETTE.bg, 0.5));
  p.stroke(...PALETTE.gold, 200);
  p.strokeWeight(Math.max(0.7, w * 0.008));
  for (const s of [-1, 1]) {
    p.beginShape();
    p.vertex(s * bw * 0.85, y - bh / 2 + drop);
    p.vertex(s * 0.43 * w, y - bh / 2 + drop);
    p.vertex(s * 0.385 * w, y + drop);
    p.vertex(s * 0.43 * w, y + bh / 2 + drop);
    p.vertex(s * bw * 0.85, y + bh / 2 + drop);
    p.endShape(p.CLOSE);
  }
  // 가운데 띠
  p.fill(...PALETTE.card);
  p.stroke(...PALETTE.gold);
  p.strokeWeight(Math.max(0.8, w * 0.012));
  p.rectMode(p.CENTER);
  p.rect(0, y, bw * 2, bh, w * 0.01);
  p.noStroke();
  p.fill(...PALETTE.gold);
  p.textAlign(p.CENTER, p.CENTER);
  p.textStyle(p.BOLD);
  fitText(p, title, 0, y + bh * 0.04, bw * 1.8, bh * 0.55);
  p.textStyle(p.NORMAL);
  // 리본 아래 영어 이름 (세리프체, 글자 사이를 띄워서 고전적인 느낌)
  p.fill(...PALETTE.sub, 230);
  p.textFont(CANVAS_SERIF);
  fitText(p, subtitle.toUpperCase().split('').join(' '), 0, 0.408 * h, 0.76 * w, 0.032 * h);
  p.textFont(CANVAS_FONT);
}


// ── 그림 창 안의 기본 그림 ─────────────────────────

/**
 * (예비용) 전용 그림이 없는 메이저 카드의 기본 문양: 눈금 달린 이중 원 + 번호마다 뾰족한 개수가 다른 별
 * 지금은 22장 모두 전용 그림이 있어서 쓰이지 않지만, 그림 함수가 빠졌을 때 빈 카드가 되지 않도록 남겨 둠
 * [AI 도움: Claude] 함수 작성
 */
function drawMajorSymbol(p: p5, number: number, size: number): void {
  p.noFill();
  p.stroke(...PALETTE.gold);
  p.strokeWeight(Math.max(1, size * 0.03));
  p.circle(0, 0, size * 1.6);
  p.stroke(...PALETTE.sub, 140);
  p.circle(0, 0, size * 1.25);
  p.stroke(...PALETTE.gold, 160);
  for (let i = 0; i < 12; i++) {
    const a = (i * p.TWO_PI) / 12;
    p.line(Math.cos(a) * size * 0.63, Math.sin(a) * size * 0.63, Math.cos(a) * size * 0.8, Math.sin(a) * size * 0.8);
  }
  p.noStroke();
  p.fill(...PALETTE.gold);
  drawStar(p, 0, 0, size * 0.55, size * 0.22, 4 + (number % 6));
}

/**
 * 그림 창 안 내용: 메이저(majorArt.ts의 전용 장면) / 마이너(minorArt.ts의 규칙 생성 그림)
 * [AI 도움: Claude]
 */
function drawCardArt(p: p5, card: TarotCard, w: number, h: number) {
  if (card.arcana === 'major') {
    if (hasMajorArt(card.number)) {
      drawMajorArt(p, card.number, w, h);
    } else {
      p.push();
      p.translate(0, -0.07 * h);
      drawMajorSymbol(p, card.number, w * 0.34);
      p.pop();
    }
    return;
  }
  drawMinorArt(p, card, w, h);
}

/**
 * 카드 앞면을 그리는 함수.
 * 순서: 테두리 → 그림 창 배경 → 그림(창 모양으로 잘라냄) → 창 테두리 → 기둥·덩굴 장식 → 메달 → 이름 리본
 * reversed(역방향)가 true면 카드 전체를 180° 돌려서 그립니다 (실제 타로처럼 거꾸로 보임).
 * [AI 도움: Claude] 함수 작성
 */
export function drawCardFront(p: p5, card: TarotCard, w: number, h: number, reversed: boolean): void {
  const ctx = p.drawingContext as CanvasRenderingContext2D;
  p.push();
  if (reversed) p.rotate(p.PI);
  drawFrame(p, w, h);

  // 그림 창: 배경 + 그림 (창 밖으로 삐져나온 부분은 잘라냄)
  p.push(); // p5 push = 캔버스 save + p5 스타일 저장
  archPath(ctx, w, h);
  ctx.clip();
  drawArchBackground(p, ctx, w, h);
  drawCardArt(p, card, w, h);
  p.pop(); // 잘라내기(clip)·색 설정 원상복구

  // 창 테두리 (금색 이중선)
  p.push();
  ctx.strokeStyle = rgba(PALETTE.gold, 1);
  ctx.lineWidth = Math.max(1, w * 0.014);
  archPath(ctx, w, h);
  ctx.stroke();
  ctx.strokeStyle = rgba(PALETTE.gold, 0.45);
  ctx.lineWidth = Math.max(0.6, w * 0.006);
  archPath(ctx, w, h, w * 0.022);
  ctx.stroke();
  p.pop();

  // 장식
  drawPillars(p, w, h);
  const fx = 0.41 * w;
  const fy = 0.43 * h; // 아래쪽 모서리는 이름 리본 꼬리와 겹쳐서 덩굴 장식 생략
  drawFlourish(p, -fx, -fy, w * 0.15, 1, 1); // 왼쪽 위
  drawFlourish(p, fx, -fy, w * 0.15, -1, 1); // 오른쪽 위 (좌우 뒤집기)

  const label = card.arcana === 'major' ? toRoman(card.number) : RANK_SHORT[card.number - 1];
  drawMedallion(p, w, h, label);
  drawBanner(p, w, h, card.nameKo, card.nameEn);
  p.pop();
}
