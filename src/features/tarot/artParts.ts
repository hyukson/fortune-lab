// 담당: 장진영
// 메이저 카드 그림에 공통으로 쓰는 "부품" 모음 (인물, 후광, 불꽃, 날개, 산, 나무 등)
// 카드별 장면은 majorScenes1.ts(0~10번), majorScenes2.ts(11~21번)에 있습니다.
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 함수 단위로 작성했습니다. (AI 사용 비율: 약 100%)
//
// 좌표 규칙: 카드 중심이 (0, 0). 가로 위치는 카드 너비 w의 비율, 세로 위치는 카드 높이 h의 비율로 적습니다.
//   예) (0.2 * w, -0.1 * h) = 가운데에서 오른쪽으로 너비의 20%, 위로 높이의 10%
//   그림 창(아치)은 대략 가로 -0.36w ~ 0.36w, 세로 -0.40h ~ 0.27h 범위입니다.

import type p5 from 'p5';
import { CANVAS_FONT, CANVAS_SERIF, PALETTE, mix, rgba, type RGB } from './palette';

export const G = PALETTE.gold;
export const TAU = Math.PI * 2;

/** 선 굵기: 카드 크기에 비례하되 너무 얇아지지 않게 */
export const lineW = (w: number) => Math.max(0.8, w * 0.012);

/** 금색 선으로만 그리기 설정 */
export function goldLine(p: p5, w: number, scale = 1) {
  p.noFill();
  p.stroke(...G);
  p.strokeWeight(lineW(w) * scale);
}

/** 금색 선 + 은은한 채우기 설정 (채우기 색 c, 투명도 a) */
export function goldShape(p: p5, w: number, c = PALETTE.card, a = 255) {
  p.fill(...c, a);
  p.stroke(...G);
  p.strokeWeight(lineW(w));
}

// ── 작은 부품 ────────────────────────────────────

/**
 * 빛 번짐 효과: draw 안에서 그린 도형 주변에 색 c의 빛이 번지게 함 (캔버스 그림자 기능 이용)
 * 무거운 효과라서 카드 앞면의 "빛나는 물체"에만 사용합니다.
 * [AI 도움: Claude]
 */
export function withGlow(p: p5, c: RGB, blur: number, draw: () => void) {
  const ctx = p.drawingContext as CanvasRenderingContext2D;
  p.push(); // push/pop 사이에서만 그림자가 켜짐
  ctx.shadowColor = rgba(c, 0.9);
  ctx.shadowBlur = blur;
  draw();
  p.pop();
}

/**
 * 인물 뒤 후광: 겹친 반투명 원 + 가는 빛줄기
 * [AI 도움: Claude]
 */
export function drawHalo(p: p5, x: number, y: number, r: number) {
  p.noStroke();
  p.fill(...G, 22);
  p.circle(x, y, r * 2.6);
  p.fill(...G, 35);
  p.circle(x, y, r * 1.6);
  p.stroke(...G, 70);
  p.strokeWeight(1);
  for (let i = 0; i < 24; i++) {
    const a = (i * TAU) / 24;
    p.line(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9, x + Math.cos(a) * r * 1.4, y + Math.sin(a) * r * 1.4);
  }
}

/**
 * 무한대 기호 ∞ : 수학 곡선 '베르누이 렘니스케이트'를 점으로 이어 그림
 * [AI 도움: Claude]
 */
export function drawInfinity(p: p5, x: number, y: number, a: number) {
  p.beginShape();
  for (let i = 0; i <= 60; i++) {
    const t = (i / 60) * TAU;
    const d = 1 + Math.sin(t) ** 2;
    p.vertex(x + (a * Math.cos(t)) / d, y + (a * Math.sin(t) * Math.cos(t)) / d);
  }
  p.endShape();
}

/**
 * 장미 한 송이: 꽃잎 5장 + 가운데 + 잎 2장
 * [AI 도움: Claude]
 */
export function drawRose(p: p5, x: number, y: number, r: number) {
  p.noStroke();
  p.fill(...mix(G, PALETTE.card, 0.4));
  p.ellipse(x - r * 1.3, y + r * 0.6, r * 1.4, r * 0.6);
  p.ellipse(x + r * 1.3, y + r * 0.6, r * 1.4, r * 0.6);
  p.fill(...G, 210);
  for (let i = 0; i < 5; i++) {
    const a = (i * TAU) / 5 - Math.PI / 2;
    p.circle(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.9);
  }
  p.fill(...PALETTE.card);
  p.circle(x, y, r * 0.5);
}

/**
 * 불꽃: 아래는 둥글고 위는 뾰족한 물방울을 뒤집은 모양 (베지어 곡선 2개)
 * [AI 도움: Claude]
 */
export function drawFlame(p: p5, x: number, y: number, s: number) {
  p.noStroke();
  p.fill(...PALETTE.goldHover, 230);
  p.beginShape();
  p.vertex(x, y - s);
  p.bezierVertex(x + s * 0.5, y - s * 0.4, x + s * 0.5, y + s * 0.3, x, y + s * 0.3);
  p.bezierVertex(x - s * 0.5, y + s * 0.3, x - s * 0.5, y - s * 0.4, x, y - s);
  p.endShape(p.CLOSE);
  p.fill(...PALETTE.text, 220);
  p.ellipse(x, y + s * 0.05, s * 0.3, s * 0.4);
}

/**
 * 하늘에서 떨어지는 빛방울(요드) — 달·탑 카드에 쓰이는 전통 상징
 * [AI 도움: Claude]
 */
export function drawDrop(p: p5, x: number, y: number, s: number) {
  p.noStroke();
  p.fill(...G, 200);
  p.triangle(x - s * 0.35, y, x + s * 0.35, y, x, y - s);
  p.circle(x, y, s * 0.7);
}

/**
 * 작은 사람 실루엣 (머리 + 몸통 + 팔다리를 선으로). angle만큼 돌려서 그림 (탑에서 떨어지는 사람)
 * [AI 도움: Claude]
 */
export function drawTinyFigure(p: p5, x: number, y: number, s: number, angle: number) {
  p.push();
  p.translate(x, y);
  p.rotate(angle);
  p.stroke(...PALETTE.sub);
  p.strokeWeight(Math.max(1, s * 0.12));
  p.line(0, -s * 0.3, 0, s * 0.25); // 몸통
  p.line(0, -s * 0.15, -s * 0.4, -s * 0.45); // 팔
  p.line(0, -s * 0.15, s * 0.4, -s * 0.35);
  p.line(0, s * 0.25, -s * 0.25, s * 0.65); // 다리
  p.line(0, s * 0.25, s * 0.3, s * 0.6);
  p.noStroke();
  p.fill(...PALETTE.sub);
  p.circle(0, -s * 0.48, s * 0.32); // 머리
  p.pop();
}

export type Pt = [number, number];

/** 인물에 쓰는 색 (팀 색상을 섞어서 만듦) */
export const FIG = {
  cloak: mix(PALETTE.card, PALETTE.sub, 0.25), // 겉옷(망토)
  tunic: mix(PALETTE.card, PALETTE.sub, 0.6), // 안쪽 옷
  skin: mix(PALETTE.text, PALETTE.gold, 0.3), // 얼굴·손
  hair: mix(PALETTE.card, PALETTE.bg, 0.4), // 머리카락
};

/**
 * 소매(팔): 어깨에서 손목으로 갈수록 가늘어지는 사다리꼴 + 끝의 손
 * 방향에 수직인 벡터를 구해서 양옆으로 폭을 줌
 * [AI 도움: Claude]
 */
export function drawArm(p: p5, w: number, from: Pt, to: Pt, u: number, sleeve: RGB = FIG.cloak) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len; // 수직 방향
  const ny = dx / len;
  const w1 = 0.03 * u; // 어깨 쪽 반폭
  const w2 = 0.018 * u; // 손목 쪽 반폭
  goldShape(p, w, sleeve);
  p.quad(
    from[0] + nx * w1, from[1] + ny * w1,
    to[0] + nx * w2, to[1] + ny * w2,
    to[0] - nx * w2, to[1] - ny * w2,
    from[0] - nx * w1, from[1] - ny * w1,
  );
  // 소맷부리 금색 띠
  p.stroke(...G);
  p.line(to[0] + nx * w2, to[1] + ny * w2, to[0] - nx * w2, to[1] - ny * w2);
  p.noStroke();
  p.fill(...FIG.skin);
  p.circle(to[0] + (dx / len) * 0.012 * u, to[1] + (dy / len) * 0.012 * u, 0.034 * u);
}

/**
 * 인물 꾸미기 옵션
 * - cloak / tunic: 겉옷·안쪽 옷 색 (안 주면 기본 보라)
 * - hood: 머리카락 대신 두건을 씀 (은둔자, 죽음)
 * - skull: 얼굴 대신 해골 (죽음)
 * - band: 금색 머리띠 표시 여부 (기본 true, 두건이면 자동으로 없음)
 */
export type FigureStyle = { cloak?: RGB; tunic?: RGB; hood?: boolean; skull?: boolean; band?: boolean };

/**
 * 로브를 입은 인물 (마법사 등)
 * 순서: 넓은 겉옷(망토) → 안쪽 옷 + 주름 → 허리띠 → 두 팔 → 목깃 → 머리(머리카락 또는 두건) → 얼굴 → 머리띠
 * x, headY: 머리 위치 / scale: 크기 배율 / hands: 두 손의 위치 [왼손, 오른손] / style: 꾸미기 옵션
 * [AI 도움: Claude]
 */
export function drawFigure(
  p: p5, w: number, h: number, x: number, headY: number, scale: number, hands: [Pt, Pt], style: FigureStyle = {},
) {
  const cloak = style.cloak ?? FIG.cloak;
  const tunic = style.tunic ?? FIG.tunic;
  const u = w * scale; // 가로 단위
  const v = h * scale; // 세로 단위
  const neckY = headY + 0.035 * v;
  const hem = headY + 0.29 * v;
  const sh = 0.065 * u; // 어깨 반폭
  const bw = 0.145 * u; // 밑단 반폭

  // 겉옷(망토): 어깨에서 밑단으로 퍼지는 곡선 + 둥근 밑단
  goldShape(p, w, cloak);
  p.beginShape();
  p.vertex(x - sh, neckY + 0.01 * v);
  p.bezierVertex(x - sh * 0.3, neckY - 0.005 * v, x + sh * 0.3, neckY - 0.005 * v, x + sh, neckY + 0.01 * v);
  p.bezierVertex(x + sh * 1.7, neckY + 0.12 * v, x + bw * 0.95, hem - 0.06 * v, x + bw, hem);
  p.bezierVertex(x + bw * 0.4, hem + 0.02 * v, x - bw * 0.4, hem + 0.02 * v, x - bw, hem);
  p.bezierVertex(x - bw * 0.95, hem - 0.06 * v, x - sh * 1.7, neckY + 0.12 * v, x - sh, neckY + 0.01 * v);
  p.endShape(p.CLOSE);

  // 안쪽 옷: 가운데로 좁게 보이는 밝은 천
  const iw1 = sh * 0.45;
  const iw2 = bw * 0.5;
  goldShape(p, w, tunic, 200);
  p.beginShape();
  p.vertex(x - iw1, neckY + 0.015 * v);
  p.vertex(x + iw1, neckY + 0.015 * v);
  p.bezierVertex(x + iw1 * 1.4, neckY + 0.12 * v, x + iw2 * 0.9, hem - 0.05 * v, x + iw2, hem + 0.008 * v);
  p.vertex(x - iw2, hem + 0.008 * v);
  p.bezierVertex(x - iw2 * 0.9, hem - 0.05 * v, x - iw1 * 1.4, neckY + 0.12 * v, x - iw1, neckY + 0.015 * v);
  p.endShape(p.CLOSE);
  // 옷 주름 (가는 곡선 3개)
  p.noFill();
  p.stroke(...G, 90);
  p.strokeWeight(lineW(w) * 0.7);
  const beltY = neckY + 0.1 * v;
  for (const k of [-0.5, 0, 0.5]) {
    p.bezier(x + k * iw1, beltY, x + k * iw2 * 0.6, beltY + 0.05 * v, x + k * iw2 * 1.1, hem - 0.05 * v, x + k * iw2 * 0.9, hem);
  }

  // 허리띠 + 버클
  p.noStroke();
  p.fill(...G);
  p.rectMode(p.CENTER);
  p.rect(x, beltY, iw1 * 2.8, 0.012 * v, 0.004 * u);
  p.fill(...PALETTE.card);
  p.stroke(...G);
  p.strokeWeight(lineW(w) * 0.8);
  p.circle(x, beltY, 0.022 * u);

  // 두 팔 (어깨 → 손)
  drawArm(p, w, [x - sh * 0.85, neckY + 0.02 * v], hands[0], u, cloak);
  drawArm(p, w, [x + sh * 0.85, neckY + 0.02 * v], hands[1], u, cloak);

  // 목깃 (V자)
  p.stroke(...G);
  p.strokeWeight(lineW(w));
  p.line(x - iw1, neckY + 0.012 * v, x, neckY + 0.04 * v);
  p.line(x + iw1, neckY + 0.012 * v, x, neckY + 0.04 * v);

  // 머리
  const hr = 0.052 * u; // 머리 반지름
  if (style.hood) {
    // 두건: 겉옷 색의 큰 타원이 머리를 감쌈 (금색 테두리)
    goldShape(p, w, cloak);
    p.ellipse(x, headY + hr * 0.3, hr * 2.7, hr * 3.0);
  } else {
    p.noStroke();
    p.fill(...FIG.hair);
    p.ellipse(x, headY + hr * 0.15, hr * 2.25, hr * 2.5);
  }
  p.noStroke();
  p.fill(...(style.skull ? PALETTE.text : FIG.skin));
  p.ellipse(x, headY + hr * 0.15, hr * 1.6, hr * 1.95);
  if (style.skull) {
    // 해골: 눈구멍 2개 + 코 + 이빨 선
    p.fill(...PALETTE.bg);
    p.circle(x - hr * 0.35, headY + hr * 0.05, hr * 0.5);
    p.circle(x + hr * 0.35, headY + hr * 0.05, hr * 0.5);
    p.triangle(x, headY + hr * 0.35, x - hr * 0.1, headY + hr * 0.55, x + hr * 0.1, headY + hr * 0.55);
    p.stroke(...PALETTE.bg);
    p.strokeWeight(Math.max(0.6, hr * 0.08));
    p.line(x - hr * 0.35, headY + hr * 0.78, x + hr * 0.35, headY + hr * 0.78);
  } else if (!style.hood) {
    p.fill(...FIG.hair);
    p.arc(x, headY - hr * 0.2, hr * 1.75, hr * 1.4, Math.PI, Math.PI * 2, p.CHORD); // 앞머리
  }
  if (style.band ?? !style.hood) {
    p.noFill();
    p.stroke(...G);
    p.strokeWeight(lineW(w) * 1.1);
    p.arc(x, headY - hr * 0.15, hr * 1.8, hr * 1.1, Math.PI * 1.05, Math.PI * 1.95);
  }
}

// ── 배경·소품 부품 (메이저 카드 22장에서 같이 사용) ─────────────

/** 보조 색: 금색 선 그림 사이를 채우는 어두운 보라 계열 */
export const TONE = {
  dark: mix(PALETTE.card, PALETTE.bg, 0.4), // 어두운 돌·나무
  stone: mix(PALETTE.card, PALETTE.sub, 0.3), // 기둥·바위
  leaf: mix(PALETTE.card, PALETTE.sub, 0.35), // 나뭇잎·구름
  light: mix(PALETTE.text, PALETTE.sub, 0.35), // 흰 옷
  warm: mix(PALETTE.card, PALETTE.gold, 0.3), // 붉은 옷 대신 쓰는 따뜻한 색
};

/**
 * 장식 구름: 원 여러 개를 겹쳐 채운 뒤, 각 원의 윗부분에만 금색 곡선을 그림
 * list: [가로 비율, 세로 비율, 반지름(너비 비율)] 목록
 * [AI 도움: Claude]
 */
export function drawClouds(p: p5, w: number, h: number, list: [number, number, number][]) {
  p.noStroke();
  p.fill(...TONE.leaf);
  for (const [cx, cy, r] of list) p.circle(cx * w, cy * h, r * w * 2);
  p.noFill();
  p.stroke(...G, 150);
  p.strokeWeight(lineW(w) * 0.9);
  for (const [cx, cy, r] of list) p.arc(cx * w, cy * h, r * w * 2, r * w * 2, Math.PI * 1.1, Math.PI * 1.9);
}

/**
 * 먼 산맥: 봉우리 점들을 이은 다각형 + 봉우리 끝의 눈(밝은 선)
 * baseY: 산 밑자락 높이(px)
 * [AI 도움: Claude]
 */
export function drawMountains(p: p5, w: number, h: number, baseY: number) {
  const peaks: Pt[] = [
    [-0.4, 0.0], [-0.3, -0.07], [-0.2, -0.02], [-0.08, -0.1], [0.04, -0.03],
    [0.16, -0.09], [0.28, -0.02], [0.4, -0.06],
  ];
  goldShape(p, w, TONE.stone, 200);
  p.beginShape();
  p.vertex(-0.4 * w, baseY + 0.05 * h);
  for (const [px, py] of peaks) p.vertex(px * w, baseY + py * h);
  p.vertex(0.4 * w, baseY + 0.05 * h);
  p.endShape(p.CLOSE);
  // 봉우리 눈: 꼭대기 양옆으로 짧은 밝은 선
  p.stroke(...PALETTE.text, 160);
  for (const [px, py] of peaks) {
    if (py > -0.05) continue;
    p.line(px * w - 0.025 * w, baseY + (py + 0.02) * h, px * w, baseY + py * h);
    p.line(px * w, baseY + py * h, px * w + 0.025 * w, baseY + (py + 0.02) * h);
  }
}

/**
 * 땅(언덕): y 높이에서 시작해 그림 창 아래까지 채움
 * [AI 도움: Claude]
 */
export function drawGround(p: p5, w: number, h: number, y: number) {
  goldShape(p, w, PALETTE.card);
  p.beginShape();
  p.vertex(-0.42 * w, 0.3 * h);
  p.vertex(-0.42 * w, y + 0.01 * h);
  p.bezierVertex(-0.2 * w, y - 0.015 * h, 0.15 * w, y + 0.015 * h, 0.42 * w, y - 0.005 * h);
  p.vertex(0.42 * w, 0.3 * h);
  p.endShape(p.CLOSE);
}

/**
 * 기둥: 몸통 + 위아래 받침 + 세로 홈 2줄 + (선택) 기둥에 새긴 글자
 * [AI 도움: Claude]
 */
export function drawPillar(p: p5, w: number, x: number, top: number, bottom: number, pw: number, fill: RGB, letter = '') {
  p.rectMode(p.CORNER);
  goldShape(p, w, fill);
  p.rect(x - pw / 2, top, pw, bottom - top);
  p.rect(x - pw * 0.65, top - pw * 0.25, pw * 1.3, pw * 0.25); // 위 받침
  p.rect(x - pw * 0.65, bottom - pw * 0.2, pw * 1.3, pw * 0.2); // 아래 받침
  p.stroke(...G, 90);
  p.line(x - pw * 0.2, top + pw * 0.15, x - pw * 0.2, bottom - pw * 0.3);
  p.line(x + pw * 0.2, top + pw * 0.15, x + pw * 0.2, bottom - pw * 0.3);
  if (letter) {
    p.noStroke();
    p.fill(...G);
    p.textAlign(p.CENTER, p.CENTER);
    p.textFont(CANVAS_SERIF);
    p.textSize(pw * 0.6);
    p.text(letter, x, top + pw * 0.7);
    p.textFont(CANVAS_FONT);
  }
}

/**
 * 날개 한 쌍: 어깨에서 위·바깥으로 뻗은 뒤, 물결 모양 아래쪽 가장자리를 따라 돌아오는 모양 + 깃털 선
 * span: 날개 크기 / fill: 날개 색
 * [AI 도움: Claude]
 */
export function drawWings(p: p5, w: number, x: number, y: number, span: number, fill: RGB = TONE.light) {
  const edge: Pt[] = [[0.5, -0.2], [0.42, 0.0], [0.32, 0.15], [0.18, 0.28], [0.05, 0.2]];
  for (const s of [-1, 1]) {
    goldShape(p, w, fill, 220);
    p.beginShape();
    p.vertex(x, y);
    p.bezierVertex(x + s * span * 0.15, y - span * 0.35, x + s * span * 0.4, y - span * 0.45, x + s * span * 0.55, y - span * 0.4);
    let prev: Pt = [0.55, -0.4];
    for (const [px, py] of edge) {
      p.bezierVertex(
        x + s * span * (prev[0] + 0.02), y + span * (prev[1] + 0.12),
        x + s * span * (px + 0.06), y + span * (py + 0.05),
        x + s * span * px, y + span * py,
      );
      prev = [px, py];
    }
    p.endShape(p.CLOSE);
    p.stroke(...G, 110);
    for (const [px, py] of edge) {
      p.line(x + s * span * 0.08, y - span * 0.02, x + s * span * px * 0.9, y + span * py * 0.9);
    }
  }
}

/**
 * 나무: 줄기 + 동그란 잎 덩어리 3개(윗부분 금색 곡선) + (선택) 금색 열매
 * s: 나무 크기(px)
 * [AI 도움: Claude]
 */
export function drawTree(p: p5, w: number, x: number, baseY: number, s: number, fruit = false) {
  p.rectMode(p.CORNER);
  goldShape(p, w, TONE.dark);
  p.rect(x - s * 0.06, baseY - s * 0.55, s * 0.12, s * 0.55);
  const blobs: [number, number, number][] = [
    [0, -0.75, 0.3],
    [-0.22, -0.55, 0.22],
    [0.22, -0.55, 0.22],
  ];
  p.noStroke();
  p.fill(...TONE.leaf);
  for (const [bx, by, br] of blobs) p.circle(x + bx * s, baseY + by * s, br * s * 2);
  p.noFill();
  p.stroke(...G, 160);
  p.strokeWeight(lineW(w) * 0.9);
  for (const [bx, by, br] of blobs) p.arc(x + bx * s, baseY + by * s, br * s * 2, br * s * 2, Math.PI * 1.05, Math.PI * 1.95);
  if (fruit) {
    p.noStroke();
    p.fill(...G);
    for (const [fx, fy] of [[-0.15, -0.6], [0.1, -0.8], [0.25, -0.5], [-0.05, -0.65]]) p.circle(x + fx * s, baseY + fy * s, s * 0.08);
  }
}

/**
 * 밀 이삭: 줄기 + 위쪽에 낟알 타원 5쌍
 * [AI 도움: Claude]
 */
export function drawWheat(p: p5, w: number, x: number, baseY: number, s: number) {
  p.stroke(...G, 170);
  p.strokeWeight(lineW(w) * 0.8);
  p.line(x, baseY, x, baseY - s);
  p.noStroke();
  p.fill(...G, 220);
  for (let k = 0; k < 5; k++) {
    const y = baseY - s + k * s * 0.09;
    p.ellipse(x - s * 0.05, y + s * 0.03, s * 0.07, s * 0.12);
    p.ellipse(x + s * 0.05, y + s * 0.03, s * 0.07, s * 0.12);
  }
  p.ellipse(x, baseY - s, s * 0.06, s * 0.12);
}

/**
 * 소용돌이(나선): 숫양 뿔·장식용. dir = 1(시계) / -1(반시계)
 * [AI 도움: Claude]
 */
export function drawSpiral(p: p5, x: number, y: number, r: number, dir: number) {
  p.beginShape();
  for (let t = 0; t <= Math.PI * 4; t += 0.2) {
    const rr = (r * t) / (Math.PI * 4);
    p.vertex(x + dir * Math.cos(t) * rr, y + Math.sin(t) * rr);
  }
  p.endShape();
}

/**
 * 열쇠: 손잡이 고리 + 몸통 + 이빨 2개. angle만큼 기울임
 * [AI 도움: Claude]
 */
export function drawKey(p: p5, w: number, x: number, y: number, s: number, angle: number) {
  p.push();
  p.translate(x, y);
  p.rotate(angle);
  p.noFill();
  p.stroke(...G);
  p.strokeWeight(lineW(w) * 1.4);
  p.circle(0, -s * 0.38, s * 0.24);
  p.line(0, -s * 0.26, 0, s * 0.45);
  p.line(0, s * 0.35, s * 0.12, s * 0.35);
  p.line(0, s * 0.45, s * 0.12, s * 0.45);
  p.pop();
}

/**
 * 물병(항아리): 둥근 몸통 + 목 + 손잡이. angle만큼 기울여서 물을 붓는 모습
 * [AI 도움: Claude]
 */
export function drawJug(p: p5, w: number, x: number, y: number, s: number, angle: number) {
  p.push();
  p.translate(x, y);
  p.rotate(angle);
  goldShape(p, w, TONE.warm);
  p.ellipse(0, 0, s * 0.6, s * 0.7);
  p.rectMode(p.CENTER);
  p.rect(0, -s * 0.4, s * 0.22, s * 0.18);
  p.noFill();
  p.arc(s * 0.28, -s * 0.05, s * 0.25, s * 0.35, -Math.PI / 2, Math.PI / 2);
  p.pop();
}

/**
 * 저울: 손잡이 → 가로대 → 양쪽 끈 → 접시 (정의 카드)
 * topY: 손으로 잡는 위치 / s: 가로대 길이
 * [AI 도움: Claude]
 */
export function drawScales(p: p5, w: number, x: number, topY: number, s: number) {
  const beamY = topY + s * 0.15;
  const panY = topY + s * 0.55;
  p.noFill();
  p.stroke(...G);
  p.strokeWeight(lineW(w) * 1.2);
  p.line(x, topY, x, beamY);
  p.line(x - s / 2, beamY, x + s / 2, beamY);
  p.strokeWeight(lineW(w) * 0.7);
  for (const side of [-1, 1]) {
    const px = x + (side * s) / 2;
    p.line(px, beamY, px - s * 0.12, panY);
    p.line(px, beamY, px + s * 0.12, panY);
  }
  p.fill(...G, 200);
  p.noStroke();
  for (const side of [-1, 1]) p.arc(x + (side * s) / 2, panY, s * 0.32, s * 0.16, 0, Math.PI, p.CHORD);
}

/**
 * 사자 (오른쪽을 보고 엎드린 모습): 꼬리 → 몸통·다리 → 갈기(뾰족한 별 모양) → 얼굴
 * [AI 도움: Claude]
 */
export function drawLion(p: p5, w: number, x: number, y: number, s: number) {
  const body = mix(PALETTE.gold, PALETTE.card, 0.35);
  p.push();
  p.translate(x, y);
  p.noFill();
  p.stroke(...G);
  p.strokeWeight(lineW(w) * 1.2);
  p.bezier(-s * 0.42, 0, -s * 0.6, -s * 0.05, -s * 0.55, -s * 0.3, -s * 0.45, -s * 0.28); // 꼬리
  goldShape(p, w, body);
  p.rectMode(p.CENTER);
  p.rect(-s * 0.28, s * 0.17, s * 0.1, s * 0.16, s * 0.03); // 뒷다리
  p.rect(s * 0.2, s * 0.17, s * 0.1, s * 0.16, s * 0.03); // 앞다리
  p.ellipse(0, 0, s * 0.9, s * 0.36); // 몸통
  p.fill(...G);
  drawStarShape(p, s * 0.42, -s * 0.1, s * 0.22, s * 0.15, 14); // 갈기
  p.fill(...mix(PALETTE.gold, PALETTE.text, 0.35));
  p.circle(s * 0.44, -s * 0.09, s * 0.22); // 얼굴
  p.noStroke();
  p.fill(...PALETTE.card);
  p.circle(s * 0.41, -s * 0.12, s * 0.035);
  p.circle(s * 0.48, -s * 0.12, s * 0.035);
  p.triangle(s * 0.43, -s * 0.06, s * 0.47, -s * 0.06, s * 0.45, -s * 0.03);
  p.pop();
}

/**
 * 작은 개 (오른쪽으로 뛰어오르는 모습) — 바보 카드
 * [AI 도움: Claude]
 */
export function drawDog(p: p5, w: number, x: number, y: number, s: number) {
  p.push();
  p.translate(x, y);
  p.stroke(...G);
  p.strokeWeight(lineW(w) * 1.3);
  p.line(s * 0.3, s * 0.1, s * 0.5, s * 0.35); // 앞다리
  p.line(-s * 0.3, s * 0.1, -s * 0.5, s * 0.35); // 뒷다리
  p.line(-s * 0.42, -s * 0.05, -s * 0.6, -s * 0.3); // 꼬리
  goldShape(p, w, TONE.light);
  p.ellipse(0, 0, s, s * 0.42);
  p.circle(s * 0.5, -s * 0.25, s * 0.36);
  p.ellipse(s * 0.7, -s * 0.2, s * 0.24, s * 0.14);
  p.noStroke();
  p.fill(...PALETTE.card);
  p.circle(s * 0.55, -s * 0.3, s * 0.05);
  p.fill(...TONE.stone);
  p.ellipse(s * 0.4, -s * 0.33, s * 0.12, s * 0.22); // 귀
  p.pop();
}

/** 별 모양(채우기/선은 호출 전에 설정). symbols.ts의 drawStar에 회전(rot) 기능을 더한 버전 — 거꾸로 된 별 등에 사용 */
export function drawStarShape(p: p5, x: number, y: number, r1: number, r2: number, n: number, rot = 0) {
  p.beginShape();
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? r1 : r2;
    const a = -Math.PI / 2 + rot + (i * Math.PI) / n;
    p.vertex(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  p.endShape(p.CLOSE);
}
