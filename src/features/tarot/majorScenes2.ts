// 담당: 장진영
// 메이저 아르카나 11~21번 카드의 상징 장면 (정의 ~ 세계)
// 사람은 단순한 실루엣, 나머지는 금색 선 그림(라인 아트) 스타일. 공통 부품은 artParts.ts에 있습니다.
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 함수 단위로 작성했습니다. (AI 사용 비율: 약 100%)
// 좌표 규칙은 artParts.ts 맨 위 설명 참고. 각 함수 안의 X(0.2) = 너비의 20%, Y(-0.1) = 높이의 -10%

import type p5 from 'p5';
import {
  FIG, G, TAU, TONE, drawClouds, drawDrop, drawFigure, drawFlame, drawGround, drawHalo, drawJug,
  drawMountains, drawPillar, drawRose, drawScales, drawStarShape, drawTinyFigure, drawTree, drawWings,
  goldLine, goldShape, lineW, withGlow, type Pt,
} from './artParts';
import { drawCrescent } from './celestial';
import { PALETTE, mix } from './palette';
import { drawCrown, drawStar, drawSuitSymbol } from './symbols';

/** 비율 → px 변환 도우미 (X: 너비 기준, Y: 높이 기준) */
const scaler = (w: number, h: number) => [(f: number) => f * w, (f: number) => f * h] as const;

/**
 * XI. 정의: 두 기둥 사이 왕좌에 앉아 오른손에 검을 세우고 왼손에 저울을 든 인물 (공정함, 균형)
 * [AI 도움: Claude]
 */
export function drawJustice(p: p5, w: number, h: number) {
  const [X, Y] = scaler(w, h);
  p.rectMode(p.CORNER);
  goldShape(p, w, TONE.leaf, 200);
  p.rect(X(-0.22), Y(-0.24), X(0.44), Y(0.38)); // 뒤 휘장
  drawPillar(p, w, X(-0.27), Y(-0.24), Y(0.27), X(0.08), TONE.stone);
  drawPillar(p, w, X(0.27), Y(-0.24), Y(0.27), X(0.08), TONE.stone);

  const swordHand: Pt = [X(0.13), Y(-0.08)];
  const scaleHand: Pt = [X(-0.13), Y(-0.02)];
  drawFigure(p, w, h, 0, Y(-0.14), 1, [scaleHand, swordHand], { cloak: TONE.warm, band: false });
  drawCrown(p, 0, Y(-0.19), X(0.07), 3);
  // 세운 검 (손잡이가 손에 오도록 위치 계산)
  const s = X(0.2);
  withGlow(p, PALETTE.goldHover, w * 0.04, () => drawSuitSymbol(p, 'swords', swordHand[0], swordHand[1] - s * 0.35, s));
  drawScales(p, w, scaleHand[0], scaleHand[1] + Y(0.01), X(0.16));
}

/**
 * XII. 매달린 사람: 살아 있는 나무 기둥에 한 발로 거꾸로 매달린 사람, 머리 주위의 후광, 꼰 다리 (멈춤, 새로운 관점)
 * [AI 도움: Claude]
 */
export function drawHangedMan(p: p5, w: number, h: number) {
  const [X, Y] = scaler(w, h);
  drawGround(p, w, h, Y(0.24));
  // 나무 기둥 2개 + 가로대 + 새싹 잎
  p.rectMode(p.CORNER);
  goldShape(p, w, TONE.dark);
  p.rect(X(-0.22), Y(-0.3), X(0.05), Y(0.55));
  p.rect(X(0.17), Y(-0.3), X(0.05), Y(0.55));
  p.rect(X(-0.25), Y(-0.32), X(0.5), Y(0.04));
  p.noStroke();
  p.fill(...TONE.leaf);
  for (const [lx, ly] of [
    [-0.24, -0.15],
    [-0.15, 0.05],
    [0.24, -0.2],
    [0.15, 0.0],
    [-0.1, -0.31],
    [0.1, -0.31],
  ]) {
    p.ellipse(X(lx), Y(ly), X(0.04), X(0.02));
  }
  // 밧줄
  p.stroke(...G);
  p.strokeWeight(lineW(w));
  p.line(0, Y(-0.28), 0, Y(-0.18));

  // 머리 주위 후광 (거꾸로 매달려서 머리는 아래쪽)
  const headY = Y(0.15);
  drawHalo(p, 0, headY, X(0.09));
  withGlow(p, PALETTE.goldHover, w * 0.08, () => {
    p.noFill();
    p.stroke(...PALETTE.goldHover);
    p.strokeWeight(lineW(w) * 1.5);
    p.circle(0, headY, X(0.13));
  });
  // 인물을 180° 돌려서 그림 (돌린 좌표에서 머리는 -headY 위치)
  p.push();
  p.rotate(Math.PI);
  drawFigure(p, w, h, 0, -headY, 1, [[X(-0.07), Y(-0.02)], [X(0.07), Y(-0.02)]], { tunic: TONE.light, band: false });
  p.pop();
}

/**
 * XIII. 죽음: 흰 장미 깃발을 든 두건 쓴 해골, 떨어진 왕관, 두 탑 사이로 떠오르는 해 (끝과 새로운 시작)
 * [AI 도움: Claude]
 */
export function drawDeath(p: p5, w: number, h: number) {
  const [X, Y] = scaler(w, h);
  // 두 탑 사이 떠오르는 해 (지평선 오른쪽)
  withGlow(p, PALETTE.goldHover, w * 0.1, () => {
    p.noStroke();
    p.fill(...G);
    p.arc(X(0.25), Y(0.1), X(0.12), X(0.12), Math.PI, TAU, p.CHORD);
  });
  p.stroke(...G, 140);
  p.strokeWeight(1);
  for (let i = 1; i < 8; i++) {
    const a = Math.PI + (i * Math.PI) / 8;
    p.line(X(0.25) + Math.cos(a) * X(0.08), Y(0.1) + Math.sin(a) * X(0.08), X(0.25) + Math.cos(a) * X(0.12), Y(0.1) + Math.sin(a) * X(0.12));
  }
  p.rectMode(p.CORNER);
  goldShape(p, w, TONE.stone);
  p.rect(X(0.16), Y(0.0), X(0.04), Y(0.1));
  p.rect(X(0.3), Y(0.0), X(0.04), Y(0.1));
  drawGround(p, w, h, Y(0.1));

  // 깃대 + 검은 깃발과 흰 장미
  const poleX = X(-0.21);
  goldLine(p, w, 1.5);
  p.line(poleX, Y(0.12), poleX, Y(-0.3));
  goldShape(p, w, PALETTE.bg);
  p.rect(poleX, Y(-0.3), X(0.17), Y(0.11));
  drawRose(p, poleX + X(0.085), Y(-0.245), X(0.025));

  drawFigure(p, w, h, X(-0.04), Y(-0.12), 1, [[poleX + X(0.01), Y(-0.04)], [X(0.08), Y(0.03)]], {
    hood: true, skull: true, cloak: TONE.dark, tunic: mix(PALETTE.card, PALETTE.bg, 0.2),
  });
  // 땅에 떨어진 왕관
  p.push();
  p.translate(X(0.18), Y(0.21));
  p.rotate(0.6);
  drawCrown(p, 0, 0, X(0.07), 3);
  p.pop();
}

/**
 * XIV. 절제: 날개 달린 천사가 두 잔 사이로 물을 옮겨 붓는 모습, 한 발은 물에, 멀리 빛나는 산길 (조화, 균형)
 * [AI 도움: Claude]
 */
export function drawTemperance(p: p5, w: number, h: number) {
  const [X, Y] = scaler(w, h);
  // 멀리 산과 그 위의 빛 + 산으로 이어진 길
  goldShape(p, w, TONE.stone);
  p.triangle(X(0.14), Y(0.08), X(0.27), Y(-0.04), X(0.42), Y(0.08));
  withGlow(p, PALETTE.goldHover, w * 0.08, () => {
    p.noStroke();
    p.fill(...G);
    p.circle(X(0.27), Y(-0.07), X(0.05));
  });
  drawGround(p, w, h, Y(0.08));
  p.noFill();
  p.stroke(...G, 170);
  p.strokeWeight(lineW(w));
  p.bezier(X(-0.15), Y(0.27), X(0.0), Y(0.18), X(0.2), Y(0.14), X(0.26), Y(0.09));
  // 물웅덩이 + 꽃
  goldShape(p, w, PALETTE.sub, 60);
  p.ellipse(X(-0.2), Y(0.23), X(0.3), Y(0.05));
  drawRose(p, X(-0.31), Y(0.17), w * 0.02);
  drawRose(p, X(-0.26), Y(0.14), w * 0.018);

  drawWings(p, w, 0, Y(-0.12), X(0.42));
  const highHand: Pt = [X(-0.13), Y(-0.05)];
  const lowHand: Pt = [X(0.13), Y(0.03)];
  drawFigure(p, w, h, 0, Y(-0.17), 1, [highHand, lowHand], { tunic: TONE.light, band: false });
  // 가슴의 네모 안 삼각형 + 이마의 해
  goldLine(p, w);
  p.rectMode(p.CENTER);
  p.rect(0, Y(-0.085), X(0.04), X(0.04));
  p.triangle(X(-0.015), Y(-0.075), X(0.015), Y(-0.075), 0, Y(-0.098));
  p.noStroke();
  p.fill(...G);
  p.circle(0, Y(-0.195), X(0.018));
  // 두 잔 사이로 흐르는 물 (곡선 + 물방울)
  p.push();
  p.translate(highHand[0], highHand[1] - Y(0.02));
  p.rotate(0.6);
  drawSuitSymbol(p, 'cups', 0, 0, X(0.08));
  p.pop();
  drawSuitSymbol(p, 'cups', lowHand[0], lowHand[1] - Y(0.02), X(0.08));
  p.noFill();
  p.stroke(...PALETTE.sub, 200);
  p.strokeWeight(lineW(w) * 1.5);
  p.bezier(highHand[0] + X(0.03), highHand[1] - Y(0.02), X(-0.02), Y(-0.08), X(0.07), Y(-0.05), lowHand[0], lowHand[1] - Y(0.035));
}

/**
 * XV. 악마: 박쥐 날개와 뿔을 단 존재가 받침대 위에 서서 거꾸로 된 별을 이고 횃불을 아래로 듦,
 * 받침대에 사슬로 묶인 작은 두 사람 (집착, 속박)
 * [AI 도움: Claude]
 */
export function drawDevil(p: p5, w: number, h: number) {
  const [X, Y] = scaler(w, h);
  drawGround(p, w, h, Y(0.23));
  drawWings(p, w, 0, Y(-0.12), X(0.5), TONE.dark);
  // 받침대
  p.rectMode(p.CORNER);
  goldShape(p, w, TONE.dark);
  p.rect(X(-0.09), Y(0.07), X(0.18), Y(0.1));

  const raisedHand: Pt = [X(-0.12), Y(-0.17)];
  const torchHand: Pt = [X(0.12), Y(-0.02)];
  drawFigure(p, w, h, 0, Y(-0.15), 0.8, [raisedHand, torchHand], { cloak: TONE.dark, tunic: TONE.stone, band: false });
  // 뿔
  goldShape(p, w, G);
  p.triangle(X(-0.035), Y(-0.17), X(-0.015), Y(-0.17), X(-0.05), Y(-0.21));
  p.triangle(X(0.035), Y(-0.17), X(0.015), Y(-0.17), X(0.05), Y(-0.21));
  // 거꾸로 된 별 (선만)
  goldLine(p, w, 1.2);
  drawStarShape(p, 0, Y(-0.26), X(0.045), X(0.018), 5, Math.PI);
  // 아래로 향한 횃불
  p.stroke(...G);
  p.strokeWeight(lineW(w) * 1.6);
  p.line(torchHand[0], torchHand[1], X(0.2), Y(0.06));
  drawFlame(p, X(0.205), Y(0.075), X(0.03));

  // 사슬로 묶인 두 사람 + 작은 뿔
  for (const sx of [-0.2, 0.2]) {
    drawFigure(p, w, h, X(sx), Y(0.1), 0.42, [[X(sx - 0.04), Y(0.18)], [X(sx + 0.04), Y(0.18)]], { band: false });
    goldShape(p, w, G);
    p.triangle(X(sx - 0.015), Y(0.09), X(sx - 0.005), Y(0.09), X(sx - 0.02), Y(0.07));
    p.triangle(X(sx + 0.015), Y(0.09), X(sx + 0.005), Y(0.09), X(sx + 0.02), Y(0.07));
    // 목에서 받침대 고리까지 사슬 (작은 고리를 줄지어 그림)
    p.noFill();
    p.stroke(...G, 200);
    p.strokeWeight(lineW(w) * 0.7);
    for (let t = 0; t <= 1; t += 0.2) {
      p.ellipse(p.lerp(X(sx), X(sx > 0 ? 0.07 : -0.07), t), p.lerp(Y(0.125), Y(0.1), t), X(0.018), X(0.012));
    }
  }
}

/**
 * XVII. 별: 하늘의 큰 팔각별과 작은 별 일곱, 무릎 꿇고 두 물병으로 물과 땅에 물을 붓는 인물, 나무 위의 새 (희망, 치유)
 * [AI 도움: Claude]
 */
export function drawStarCard(p: p5, w: number, h: number) {
  const [X, Y] = scaler(w, h);
  withGlow(p, PALETTE.goldHover, w * 0.12, () => {
    p.noStroke();
    p.fill(...PALETTE.goldHover);
    drawStar(p, 0, Y(-0.25), X(0.09), X(0.035), 8);
  });
  p.noStroke();
  p.fill(...G, 220);
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + 0.25 + (i * (Math.PI - 0.5)) / 6;
    drawStar(p, Math.cos(a) * X(0.25), Y(-0.15) + Math.sin(a) * Y(0.13), X(0.022), X(0.008), 8);
  }
  drawGround(p, w, h, Y(0.12));
  drawTree(p, w, X(0.29), Y(0.13), X(0.18));
  // 나무 위의 새
  goldShape(p, w, PALETTE.text);
  p.ellipse(X(0.29), Y(-0.03), X(0.05), X(0.03));
  p.triangle(X(0.31), Y(-0.035), X(0.31), Y(-0.025), X(0.34), Y(-0.03));
  // 오른쪽 물웅덩이
  goldShape(p, w, PALETTE.sub, 70);
  p.ellipse(X(0.12), Y(0.21), X(0.38), Y(0.07));

  const leftHand: Pt = [X(-0.19), Y(0.06)];
  const rightHand: Pt = [X(0.11), Y(0.07)];
  drawFigure(p, w, h, X(-0.05), Y(-0.07), 0.85, [leftHand, rightHand], { tunic: TONE.light, band: false });
  drawJug(p, w, leftHand[0] - X(0.01), leftHand[1] + Y(0.01), X(0.07), -0.9);
  drawJug(p, w, rightHand[0] + X(0.01), rightHand[1] + Y(0.01), X(0.07), 0.9);
  // 쏟아지는 물줄기
  p.noFill();
  p.stroke(...PALETTE.sub, 220);
  p.strokeWeight(lineW(w) * 1.4);
  p.bezier(leftHand[0] - X(0.04), leftHand[1] + Y(0.02), X(-0.27), Y(0.1), X(-0.27), Y(0.14), X(-0.25), Y(0.17));
  p.bezier(rightHand[0] + X(0.04), rightHand[1] + Y(0.02), X(0.18), Y(0.12), X(0.17), Y(0.16), X(0.15), Y(0.2));
}

/**
 * XX. 심판: 구름 속 날개 단 천사가 깃발 달린 나팔을 불고, 아래 관에서 사람들이 두 팔을 들고 일어남 (부활, 깨달음)
 * [AI 도움: Claude]
 */
export function drawJudgement(p: p5, w: number, h: number) {
  const [X, Y] = scaler(w, h);
  drawMountains(p, w, h, Y(0.12));
  // 천사 + 날개 + 구름
  drawWings(p, w, 0, Y(-0.27), X(0.38));
  drawFigure(p, w, h, 0, Y(-0.31), 0.5, [[X(-0.08), Y(-0.26)], [X(0.05), Y(-0.25)]], { tunic: TONE.light });
  drawClouds(p, w, h, [
    [-0.25, -0.17, 0.07],
    [-0.13, -0.18, 0.08],
    [0.0, -0.19, 0.09],
    [0.13, -0.18, 0.08],
    [0.25, -0.17, 0.07],
  ]);
  // 나팔 + 십자 깃발
  goldShape(p, w, G);
  p.quad(X(0.04), Y(-0.255), X(0.2), Y(-0.15), X(0.215), Y(-0.17), X(0.05), Y(-0.265));
  withGlow(p, PALETTE.goldHover, w * 0.08, () => {
    goldShape(p, w, PALETTE.goldHover);
    p.circle(X(0.215), Y(-0.15), X(0.05));
  });
  p.rectMode(p.CORNER);
  goldShape(p, w, PALETTE.text);
  p.rect(X(0.1), Y(-0.205), X(0.06), X(0.05));
  p.stroke(...G);
  p.line(X(0.13), Y(-0.205), X(0.13), Y(-0.205) + X(0.05));
  p.line(X(0.1), Y(-0.205) + X(0.025), X(0.16), Y(-0.205) + X(0.025));

  // 관에서 일어나는 세 사람 (사람 → 관 순서로 그려서 하반신이 관에 가려짐)
  for (const sx of [-0.22, 0, 0.22]) {
    drawFigure(p, w, h, X(sx), Y(0.06), 0.45, [[X(sx - 0.06), Y(0.02)], [X(sx + 0.06), Y(0.02)]], { tunic: TONE.light, band: false });
    p.rectMode(p.CENTER);
    goldShape(p, w, TONE.dark);
    p.rect(X(sx), Y(0.17), X(0.15), Y(0.06), X(0.01));
  }
  // 바다 물결
  p.noFill();
  p.stroke(...PALETTE.sub, 150);
  p.strokeWeight(lineW(w) * 0.8);
  for (const wy of [0.23, 0.255]) {
    p.beginShape();
    for (let x = -0.36; x <= 0.36; x += 0.02) p.vertex(X(x), Y(wy) + Math.sin(x * 50) * Y(0.004));
    p.endShape();
  }
}

/**
 * XXI. 세계: 월계수 화환 안에서 두 지팡이를 들고 춤추는 인물, 네 모서리의 구름과 네 생물 상징 (완성, 성취)
 * [AI 도움: Claude]
 */
export function drawWorld(p: p5, w: number, h: number) {
  const [X, Y] = scaler(w, h);
  const cy = Y(-0.05);
  const rx = X(0.2);
  const ry = Y(0.2);
  // 네 모서리 구름 + 상징(천사·독수리·사자·황소를 단순한 아이콘으로)
  const corners: [number, number][] = [
    [-0.26, -0.26],
    [0.26, -0.26],
    [-0.27, 0.19],
    [0.27, 0.19],
  ];
  corners.forEach(([cx, cyy], i) => {
    drawClouds(p, w, h, [
      [cx - 0.035, cyy + 0.01, 0.045],
      [cx + 0.03, cyy, 0.05],
    ]);
    const x = X(cx);
    const y = Y(cyy) - X(0.01);
    goldShape(p, w, i === 0 ? FIG.skin : G);
    if (i === 0) {
      p.circle(x, y, X(0.045)); // 천사 얼굴
    } else if (i === 1) {
      p.triangle(x - X(0.035), y, x + X(0.035), y, x, y + X(0.03)); // 독수리 날개
    } else if (i === 2) {
      drawStarShape(p, x, y, X(0.03), X(0.02), 10); // 사자 갈기
    } else {
      p.circle(x, y, X(0.04)); // 황소 머리 + 뿔
      p.noFill();
      p.arc(x, y - X(0.02), X(0.07), X(0.04), Math.PI, TAU);
    }
  });
  // 월계수 화환: 타원을 따라 잎을 접선 방향으로 배치
  p.noFill();
  p.stroke(...G);
  p.strokeWeight(lineW(w));
  p.ellipse(0, cy, rx * 2, ry * 2);
  p.noStroke();
  p.fill(...mix(PALETTE.gold, PALETTE.card, 0.25));
  for (let i = 0; i < 40; i++) {
    const t = (i * TAU) / 40;
    const x = Math.cos(t) * rx;
    const y = cy + Math.sin(t) * ry;
    p.push();
    p.translate(x, y);
    p.rotate(Math.atan2(Math.cos(t) * ry, -Math.sin(t) * rx) + (i % 2 ? 0.5 : -0.5));
    p.ellipse(0, 0, X(0.035), X(0.014));
    p.pop();
  }
  // 위아래 리본 (X자)
  goldLine(p, w, 2);
  for (const ry2 of [-1, 1]) {
    const y = cy + ry2 * ry;
    p.line(X(-0.03), y - Y(0.015), X(0.03), y + Y(0.015));
    p.line(X(-0.03), y + Y(0.015), X(0.03), y - Y(0.015));
  }
  // 춤추는 인물 + 양손의 지팡이 + 휘감은 스카프
  const lh: Pt = [X(-0.11), Y(-0.08)];
  const rh: Pt = [X(0.11), Y(-0.01)];
  drawFigure(p, w, h, 0, Y(-0.17), 0.85, [lh, rh], { tunic: TONE.light, band: false });
  goldLine(p, w, 1.4);
  p.line(lh[0], lh[1] - Y(0.04), lh[0], lh[1] + Y(0.03));
  p.line(rh[0], rh[1] - Y(0.04), rh[0], rh[1] + Y(0.03));
  p.stroke(...PALETTE.sub, 200);
  p.strokeWeight(lineW(w) * 2.2);
  p.bezier(X(-0.06), Y(-0.12), X(0.12), Y(-0.08), X(-0.12), Y(0.0), X(0.06), Y(0.05));
}

/**
 * XVI. 탑: 먹구름 속 번개가 탑 꼭대기를 치고, 왕관이 떨어지고, 사람들이 떨어짐 (갑작스러운 변화)
 * [AI 도움: Claude]
 */
export function drawTower(p: p5, w: number, h: number) {
  // 먹구름: 원을 겹쳐 채운 뒤, 각 원의 "윗부분"에만 금색 곡선을 그려 장식적인 구름으로
  drawClouds(p, w, h, [
    [-0.26, -0.3, 0.09],
    [-0.14, -0.34, 0.11],
    [0.0, -0.37, 0.12],
    [0.15, -0.33, 0.1],
    [0.27, -0.29, 0.08],
    [-0.06, -0.29, 0.09],
    [0.08, -0.28, 0.08],
  ]);
  p.noFill();
  p.stroke(...G, 150);
  p.strokeWeight(lineW(w) * 0.9);
  // 구름 아래 소용돌이 몇 개
  for (const [cx, cy] of [
    [-0.2, -0.27],
    [0.2, -0.27],
  ]) {
    p.arc(cx * w, cy * h, 0.06 * w, 0.06 * w, 0, Math.PI * 1.5);
  }

  // 바위 언덕
  goldShape(p, w);
  p.beginShape();
  p.vertex(-0.4 * w, 0.28 * h);
  p.bezierVertex(-0.3 * w, 0.2 * h, -0.2 * w, 0.17 * h, -0.13 * w, 0.17 * h);
  p.vertex(0.13 * w, 0.17 * h);
  p.bezierVertex(0.2 * w, 0.17 * h, 0.3 * w, 0.2 * h, 0.4 * w, 0.28 * h);
  p.endShape(p.CLOSE);

  // 탑 몸통 (아래가 넓은 사다리꼴) + 벽돌 줄
  const topY = -0.16 * h;
  const botY = 0.18 * h;
  goldShape(p, w);
  p.quad(-0.08 * w, topY, 0.08 * w, topY, 0.11 * w, botY, -0.11 * w, botY);
  p.stroke(...G, 90);
  for (let y = topY + 0.04 * h; y < botY; y += 0.04 * h) {
    const half = 0.08 * w + ((y - topY) / (botY - topY)) * 0.03 * w;
    p.line(-half, y, half, y);
  }
  // 창문 3개 + 창에서 나오는 불꽃
  p.rectMode(p.CENTER);
  for (const [wx, wy] of [
    [-0.035, -0.08],
    [0.035, 0.0],
    [-0.03, 0.08],
  ]) {
    goldShape(p, w, PALETTE.bg);
    p.rect(wx * w, wy * h, 0.035 * w, 0.045 * h, w * 0.015, w * 0.015, 0, 0);
    drawFlame(p, wx * w, (wy - 0.005) * h, 0.022 * w);
  }
  // 꼭대기 불꽃
  drawFlame(p, -0.05 * w, topY - 0.01 * h, 0.04 * w);
  drawFlame(p, 0.04 * w, topY - 0.015 * h, 0.05 * w);

  // 날아가는 왕관 (기울어진 지그재그 모양)
  p.push();
  p.translate(0.1 * w, -0.23 * h);
  p.rotate(0.6);
  p.fill(...G);
  p.noStroke();
  const c = 0.05 * w;
  p.beginShape();
  p.vertex(-c, c * 0.5);
  p.vertex(-c, -c * 0.3);
  p.vertex(-c * 0.5, c * 0.05);
  p.vertex(0, -c * 0.6);
  p.vertex(c * 0.5, c * 0.05);
  p.vertex(c, -c * 0.3);
  p.vertex(c, c * 0.5);
  p.endShape(p.CLOSE);
  p.pop();

  // 번개: 굵고 옅은 선(빛 번짐) 위에 가는 밝은 선을 겹침
  const bolt: [number, number][] = [
    [0.36, -0.4],
    [0.22, -0.3],
    [0.27, -0.28],
    [0.12, -0.2],
    [0.17, -0.19],
    [0.05, -0.17],
  ];
  p.noFill();
  withGlow(p, PALETTE.goldHover, w * 0.1, () => {
    for (const [weight, alpha] of [
      [lineW(w) * 5, 60],
      [lineW(w) * 1.8, 255],
    ]) {
      p.stroke(...PALETTE.goldHover, alpha);
      p.strokeWeight(weight);
      p.beginShape();
      for (const [bx, by] of bolt) p.vertex(bx * w, by * h);
      p.endShape();
    }
  });

  // 떨어지는 사람들 + 흩날리는 빛방울
  drawTinyFigure(p, -0.22 * w, -0.04 * h, 0.08 * w, -2.4);
  drawTinyFigure(p, 0.23 * w, 0.06 * h, 0.08 * w, 2.1);
  for (const [dx, dy] of [
    [-0.28, -0.2],
    [-0.15, -0.12],
    [0.2, -0.08],
    [0.3, -0.15],
    [-0.3, 0.1],
    [0.3, 0.14],
  ]) {
    drawDrop(p, dx * w, dy * h, 0.025 * w);
  }
}

/**
 * XVIII. 달: 하늘의 달과 떨어지는 빛방울, 양쪽의 두 탑, 물가에서 지평선까지 이어진 구불구불한 길
 * (불확실함, 직관, 보이지 않는 길)
 * [AI 도움: Claude]
 */
export function drawMoon(p: p5, w: number, h: number) {
  const my = -0.23 * h;
  const R = 0.12 * w;
  // 달 주변 빛줄기
  p.stroke(...G, 120);
  p.strokeWeight(1);
  for (let i = 0; i < 32; i++) {
    const a = (i * TAU) / 32;
    const len = i % 2 === 0 ? 1.55 : 1.3;
    p.line(Math.cos(a) * R * 1.12, my + Math.sin(a) * R * 1.12, Math.cos(a) * R * len, my + Math.sin(a) * R * len);
  }
  goldShape(p, w, PALETTE.sub, 50);
  p.circle(0, my, R * 2);
  withGlow(p, PALETTE.goldHover, w * 0.08, () => drawCrescent(p, 0, my, R * 0.8, true));

  // 떨어지는 빛방울
  for (const [dx, dy] of [
    [-0.12, -0.07],
    [-0.04, -0.04],
    [0.05, -0.06],
    [0.13, -0.03],
  ]) {
    drawDrop(p, dx * w, dy * h, 0.022 * w);
  }

  // 지평선 언덕
  p.stroke(...G, 160);
  p.strokeWeight(lineW(w));
  p.noFill();
  p.bezier(-0.4 * w, 0.1 * h, -0.2 * w, 0.07 * h, 0.2 * w, 0.07 * h, 0.4 * w, 0.1 * h);

  // 양쪽 두 탑 (톱니 모양 꼭대기 + 아치 창문)
  p.rectMode(p.CORNER);
  for (const side of [-1, 1]) {
    const tx = side * 0.27 * w;
    const tw = 0.1 * w;
    const top = -0.05 * h;
    const bottom = 0.12 * h;
    goldShape(p, w);
    p.rect(tx - tw / 2, top, tw, bottom - top);
    for (let k = 0; k < 3; k++) {
      p.rect(tx - tw / 2 + k * tw * 0.4, top - 0.02 * h, tw * 0.2, 0.02 * h);
    }
    goldShape(p, w, PALETTE.bg);
    p.arc(tx, top + 0.05 * h, tw * 0.35, tw * 0.5, Math.PI, TAU);
    p.rect(tx - tw * 0.175, top + 0.05 * h, tw * 0.35, 0.025 * h);
  }

  // 물웅덩이 + 물결
  p.rectMode(p.CENTER);
  goldShape(p, w, PALETTE.sub, 45);
  p.ellipse(0, 0.25 * h, 0.72 * w, 0.075 * h);
  p.stroke(...PALETTE.sub, 160);
  p.noFill();
  for (const wy of [0.235, 0.255]) {
    p.beginShape();
    for (let x = -0.28; x <= 0.28; x += 0.02) p.vertex(x * w, wy * h + Math.sin(x * 60) * 0.004 * h);
    p.endShape();
  }

  // 물가에서 지평선으로 이어지는 길 (양쪽 가장자리 곡선 2개)
  p.stroke(...G, 200);
  p.bezier(-0.06 * w, 0.22 * h, 0.04 * w, 0.18 * h, -0.05 * w, 0.13 * h, -0.005 * w, 0.085 * h);
  p.bezier(0.06 * w, 0.22 * h, 0.1 * w, 0.18 * h, 0.0, 0.13 * h, 0.005 * w, 0.085 * h);
}

/**
 * XIX. 태양: 얼굴이 있는 큰 태양, 담장 위 해바라기, 두 팔을 벌린 아이와 깃발 (기쁨, 성공)
 * [AI 도움: Claude]
 */
export function drawSun(p: p5, w: number, h: number) {
  const sy = -0.2 * h;
  const R = 0.12 * w;
  // 빛줄기: 짝수는 뾰족한 삼각형, 홀수는 가는 선
  for (let i = 0; i < 24; i++) {
    const a = (i * TAU) / 24;
    if (i % 2 === 0) {
      p.noStroke();
      p.fill(...G, 210);
      const a1 = a - 0.08;
      const a2 = a + 0.08;
      p.triangle(
        Math.cos(a1) * R * 1.05, sy + Math.sin(a1) * R * 1.05,
        Math.cos(a2) * R * 1.05, sy + Math.sin(a2) * R * 1.05,
        Math.cos(a) * R * 1.75, sy + Math.sin(a) * R * 1.75,
      );
    } else {
      p.stroke(...G, 150);
      p.strokeWeight(1);
      p.line(Math.cos(a) * R * 1.1, sy + Math.sin(a) * R * 1.1, Math.cos(a) * R * 1.5, sy + Math.sin(a) * R * 1.5);
    }
  }
  // 태양 원반 (빛 번짐) + 얼굴
  withGlow(p, PALETTE.goldHover, w * 0.12, () => {
    p.fill(...G);
    p.stroke(...PALETTE.goldHover);
    p.strokeWeight(lineW(w));
    p.circle(0, sy, R * 2);
  });
  p.noFill();
  p.stroke(...PALETTE.card);
  p.strokeWeight(lineW(w) * 1.2);
  p.arc(-R * 0.35, sy - R * 0.1, R * 0.35, R * 0.22, Math.PI, TAU); // 눈썹 모양 눈
  p.arc(R * 0.35, sy - R * 0.1, R * 0.35, R * 0.22, Math.PI, TAU);
  p.arc(0, sy + R * 0.25, R * 0.6, R * 0.35, 0, Math.PI); // 미소

  // 해바라기 (줄기 → 꽃잎 → 가운데)
  const wallTop = 0.05 * h;
  for (const fx of [-0.27, -0.09, 0.09, 0.27]) {
    const x = fx * w;
    const y = 0.0 * h - Math.abs(fx) * 0.05 * h;
    const r = 0.035 * w;
    p.stroke(...mix(G, PALETTE.card, 0.4));
    p.strokeWeight(lineW(w));
    p.line(x, y, x, wallTop);
    p.noStroke();
    p.fill(...G, 230);
    for (let k = 0; k < 10; k++) {
      const a = (k * TAU) / 10;
      p.ellipse(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, r * 0.7, r * 0.7);
    }
    p.fill(...PALETTE.card);
    p.circle(x, y, r);
  }

  // 벽돌 담장
  p.rectMode(p.CORNER);
  goldShape(p, w);
  p.rect(-0.38 * w, wallTop, 0.76 * w, 0.24 * h);
  p.stroke(...G, 80);
  const rowH = 0.035 * h;
  for (let r = 1; wallTop + r * rowH < 0.28 * h; r++) {
    const y = wallTop + r * rowH;
    p.line(-0.38 * w, y, 0.38 * w, y);
    for (let x = -0.38 + (r % 2) * 0.05; x < 0.38; x += 0.1) {
      p.line(x * w, y - rowH, x * w, y);
    }
  }

  // 두 팔을 번쩍 든 아이 (작은 인물) + 오른손의 깃대와 흔들리는 깃발
  const handL: Pt = [-0.11 * w, 0.075 * h];
  const handR: Pt = [0.11 * w, 0.075 * h];
  const poleTop: Pt = [0.125 * w, -0.04 * h];
  p.stroke(...G);
  p.strokeWeight(lineW(w) * 1.5);
  p.line(handR[0], handR[1] + 0.02 * h, poleTop[0], poleTop[1]); // 깃대
  p.noStroke();
  p.fill(...G, 235);
  p.beginShape();
  p.vertex(poleTop[0], poleTop[1]);
  p.bezierVertex(poleTop[0] + 0.06 * w, poleTop[1] - 0.025 * h, poleTop[0] + 0.09 * w, poleTop[1] + 0.02 * h, poleTop[0] + 0.15 * w, poleTop[1] - 0.005 * h);
  p.vertex(poleTop[0] + 0.13 * w, poleTop[1] + 0.04 * h);
  p.bezierVertex(poleTop[0] + 0.08 * w, poleTop[1] + 0.06 * h, poleTop[0] + 0.05 * w, poleTop[1] + 0.02 * h, poleTop[0], poleTop[1] + 0.04 * h);
  p.endShape(p.CLOSE);
  drawFigure(p, w, h, 0, 0.11 * h, 0.55, [handL, handR]);
}

/** 그림이 있는 11~21번 카드: 번호 → 그리는 함수 */
export const SCENES_11_TO_21: Record<number, (p: p5, w: number, h: number) => void> = {
  11: drawJustice,
  12: drawHangedMan,
  13: drawDeath,
  14: drawTemperance,
  15: drawDevil,
  16: drawTower,
  17: drawStarCard,
  18: drawMoon,
  19: drawSun,
  20: drawJudgement,
  21: drawWorld,
};
