// 담당: 장진영
// 메이저 아르카나 0~10번 카드의 상징 장면 (바보 ~ 운명의 수레바퀴)
// 사람은 단순한 실루엣, 나머지는 금색 선 그림(라인 아트) 스타일. 공통 부품은 artParts.ts에 있습니다.
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 함수 단위로 작성했습니다. (AI 사용 비율: 약 100%)
// 좌표 규칙은 artParts.ts 맨 위 설명 참고. 각 함수 안의 X(0.2) = 너비의 20%, Y(-0.1) = 높이의 -10%

import type p5 from 'p5';
import {
  FIG, G, TAU, TONE, drawClouds, drawDog, drawFigure, drawFlame, drawGround, drawHalo, drawInfinity, drawLion,
  drawMountains, drawPillar, drawRose, drawSpiral, drawStarShape, drawTree, drawWheat, drawWings,
  drawKey, goldLine, goldShape, lineW, withGlow, type Pt,
} from './artParts';
import { drawCrescent, drawPlanet, drawSparkle } from './celestial';
import { CANVAS_FONT, CANVAS_SERIF, PALETTE, mix } from './palette';
import { drawCrown, drawStar, drawSuitSymbol } from './symbols';

/** 비율 → px 변환 도우미 (X: 너비 기준, Y: 높이 기준) */
const scaler = (w: number, h: number) => [(f: number) => f * w, (f: number) => f * h] as const;

/**
 * 0. 바보: 절벽 끝을 향해 하늘을 보며 걷는 젊은이, 어깨에 멘 보따리, 손에 든 장미, 뛰어오르는 개, 밝은 해
 * (새로운 시작, 모험, 순수함)
 * [AI 도움: Claude]
 */
export function drawFool(p: p5, w: number, h: number) {
  const [X, Y] = scaler(w, h);
  // 왼쪽 위의 해 (오른쪽 위는 보따리 자리)
  const sunX = X(-0.19);
  const sunY = Y(-0.26);
  p.stroke(...G, 140);
  p.strokeWeight(1);
  for (let i = 0; i < 16; i++) {
    const a = (i * TAU) / 16;
    p.line(sunX + Math.cos(a) * X(0.07), sunY + Math.sin(a) * X(0.07), sunX + Math.cos(a) * X(0.11), sunY + Math.sin(a) * X(0.11));
  }
  withGlow(p, PALETTE.goldHover, w * 0.1, () => {
    p.noStroke();
    p.fill(...G);
    p.circle(sunX, sunY, X(0.11));
  });

  drawMountains(p, w, h, Y(0.06));
  // 절벽: 왼쪽은 땅, 오른쪽 끝에서 뚝 떨어짐
  goldShape(p, w, PALETTE.card);
  p.beginShape();
  p.vertex(X(-0.42), Y(0.3));
  p.vertex(X(-0.42), Y(0.13));
  p.bezierVertex(X(-0.2), Y(0.11), X(0.05), Y(0.12), X(0.2), Y(0.14));
  p.vertex(X(0.17), Y(0.2));
  p.vertex(X(0.22), Y(0.3));
  p.endShape(p.CLOSE);

  // 어깨에 멘 막대 + 보따리 (인물 뒤)
  p.stroke(...G);
  p.strokeWeight(lineW(w) * 1.5);
  p.line(X(-0.02), Y(-0.02), X(0.2), Y(-0.2));
  goldShape(p, w, TONE.warm);
  p.circle(X(0.21), Y(-0.21), X(0.07));

  // 인물: 왼손에 장미, 오른손으로 막대를 잡음
  const handRose: Pt = [X(-0.17), Y(-0.03)];
  const handStick: Pt = [X(0.06), Y(-0.08)];
  drawFigure(p, w, h, X(-0.05), Y(-0.14), 0.9, [handRose, handStick], { tunic: TONE.light });
  drawRose(p, X(-0.19), Y(-0.06), w * 0.022);

  drawDog(p, w, X(0.08), Y(0.08), w * 0.1);
}

/**
 * II. 여사제: 검은 기둥(B)과 흰 기둥(J) 사이, 석류 무늬 휘장 앞에 앉아 두루마리를 든 여사제.
 * 머리에 달의 관, 발밑에 초승달 (직관, 숨은 지식)
 * [AI 도움: Claude]
 */
export function drawHighPriestess(p: p5, w: number, h: number) {
  const [X, Y] = scaler(w, h);
  // 석류 무늬 휘장
  p.rectMode(p.CORNER);
  goldShape(p, w, TONE.leaf, 200);
  p.rect(X(-0.22), Y(-0.26), X(0.44), Y(0.4));
  p.noStroke();
  p.fill(...G, 120);
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 4; c++) {
      const x = X(-0.165 + c * 0.11 + (r % 2) * 0.055);
      const y = Y(-0.23 + r * 0.075);
      if (x < X(0.21)) p.circle(x, y, X(0.035));
    }
  }
  drawPillar(p, w, X(-0.27), Y(-0.25), Y(0.27), X(0.09), TONE.dark, 'B');
  drawPillar(p, w, X(0.27), Y(-0.25), Y(0.27), X(0.09), TONE.light, 'J');

  // 인물 (두 손으로 두루마리를 듦)
  drawFigure(p, w, h, 0, Y(-0.13), 1, [[X(-0.07), Y(0.02)], [X(0.07), Y(0.02)]], { tunic: TONE.light, band: false });
  // 두루마리
  p.rectMode(p.CENTER);
  goldShape(p, w, PALETTE.text);
  p.rect(0, Y(0.03), X(0.14), Y(0.03), X(0.01));
  p.stroke(...PALETTE.card);
  p.line(X(-0.04), Y(0.03), X(0.04), Y(0.03));
  // 가슴의 십자
  p.stroke(...G);
  p.strokeWeight(lineW(w));
  p.line(0, Y(-0.075), 0, Y(-0.045));
  p.line(X(-0.015), Y(-0.06), X(0.015), Y(-0.06));
  // 달의 관: 보름달 + 양옆 초승 뿔
  p.noStroke();
  p.fill(...G);
  p.circle(0, Y(-0.185), X(0.035));
  p.noFill();
  p.stroke(...G);
  p.strokeWeight(lineW(w) * 1.3);
  p.arc(X(-0.03), Y(-0.185), X(0.035), X(0.045), Math.PI * 0.6, Math.PI * 1.4);
  p.arc(X(0.03), Y(-0.185), X(0.035), X(0.045), -Math.PI * 0.4, Math.PI * 0.4);
  // 발밑 초승달
  withGlow(p, PALETTE.goldHover, w * 0.06, () => drawCrescent(p, 0, Y(0.2), X(0.055), false));
}

/**
 * III. 여황제: 열두 별의 관을 쓰고 홀을 든 여황제, 뒤의 숲, 금성(♀) 문양의 하트 방패, 앞의 밀밭 (풍요, 돌봄)
 * [AI 도움: Claude]
 */
export function drawEmpress(p: p5, w: number, h: number) {
  const [X, Y] = scaler(w, h);
  drawTree(p, w, X(-0.27), Y(0.06), X(0.25));
  drawTree(p, w, X(0.28), Y(0.04), X(0.22));
  // 등받이 쿠션
  p.rectMode(p.CORNER);
  goldShape(p, w, TONE.warm);
  p.rect(X(-0.15), Y(-0.2), X(0.3), Y(0.3), X(0.06), X(0.06), 0, 0);

  const scepterHand: Pt = [X(0.12), Y(-0.04)];
  drawFigure(p, w, h, 0, Y(-0.13), 1, [[X(-0.1), Y(0.03)], scepterHand], { tunic: mix(PALETTE.sub, PALETTE.gold, 0.25), band: false });
  // 홀(왕홀): 막대 + 위의 구슬
  p.stroke(...G);
  p.strokeWeight(lineW(w) * 1.5);
  p.line(scepterHand[0], scepterHand[1] + Y(0.02), scepterHand[0] + X(0.02), Y(-0.19));
  drawPlanet(p, scepterHand[0] + X(0.02), Y(-0.2), X(0.02), G);
  // 열두 별의 관
  p.noStroke();
  p.fill(...G);
  for (let i = 0; i < 12; i++) {
    const a = Math.PI + (i * Math.PI) / 11;
    drawStar(p, Math.cos(a) * X(0.075), Y(-0.14) + Math.sin(a) * X(0.075), X(0.012), X(0.005), 5);
  }
  // 하트 방패 + 금성 기호 ♀
  const sx = X(0.2);
  const sy = Y(0.07);
  const s = X(0.07);
  goldShape(p, w, TONE.stone);
  p.beginShape();
  p.vertex(sx, sy + s * 0.6);
  p.bezierVertex(sx - s * 0.9, sy, sx - s * 0.5, sy - s * 0.7, sx, sy - s * 0.3);
  p.bezierVertex(sx + s * 0.5, sy - s * 0.7, sx + s * 0.9, sy, sx, sy + s * 0.6);
  p.endShape(p.CLOSE);
  goldLine(p, w);
  p.circle(sx, sy - s * 0.12, s * 0.35);
  p.line(sx, sy + s * 0.05, sx, sy + s * 0.35);
  p.line(sx - s * 0.12, sy + s * 0.22, sx + s * 0.12, sy + s * 0.22);
  // 밀밭
  for (let x = -0.33; x <= 0.34; x += 0.06) drawWheat(p, w, X(x), Y(0.28), Y(0.1));
}

/**
 * IV. 황제: 숫양 머리(나선 뿔) 장식 왕좌에 앉아 앙크 홀과 구슬을 든 황제, 뒤의 험한 산 (권위, 질서)
 * [AI 도움: Claude]
 */
export function drawEmperor(p: p5, w: number, h: number) {
  const [X, Y] = scaler(w, h);
  drawMountains(p, w, h, Y(0.02));
  // 왕좌
  p.rectMode(p.CORNER);
  goldShape(p, w, TONE.stone);
  p.rect(X(-0.2), Y(-0.24), X(0.4), Y(0.48));
  p.stroke(...G);
  p.strokeWeight(lineW(w) * 1.3);
  p.noFill();
  for (const [sx, sy, dir] of [
    [-0.16, -0.2, 1],
    [0.16, -0.2, -1],
    [-0.2, 0.04, 1],
    [0.2, 0.04, -1],
  ]) {
    drawSpiral(p, X(sx), Y(sy), X(0.045), dir); // 숫양 뿔
  }

  const ankhHand: Pt = [X(0.13), Y(-0.04)];
  const orbHand: Pt = [X(-0.13), Y(-0.01)];
  drawFigure(p, w, h, 0, Y(-0.14), 1, [orbHand, ankhHand], { cloak: TONE.warm, band: false });
  drawCrown(p, 0, Y(-0.19), X(0.08), 3);
  // 앙크 홀: 고리 + 가로대 + 막대
  goldLine(p, w, 1.5);
  p.line(ankhHand[0], ankhHand[1] + Y(0.02), ankhHand[0], Y(-0.16));
  p.line(ankhHand[0] - X(0.025), Y(-0.16), ankhHand[0] + X(0.025), Y(-0.16));
  p.ellipse(ankhHand[0], Y(-0.18), X(0.03), Y(0.03));
  // 구슬 + 십자
  drawPlanet(p, orbHand[0], orbHand[1] - Y(0.02), X(0.025), G);
  p.stroke(...G);
  p.line(orbHand[0], orbHand[1] - Y(0.045), orbHand[0], orbHand[1] - Y(0.065));
}

/**
 * V. 교황: 두 기둥 사이에서 삼중관을 쓰고 축복하는 손을 든 교황, 삼중 십자 지팡이, 교차된 두 열쇠, 앞의 두 신도 (전통, 가르침)
 * [AI 도움: Claude]
 */
export function drawHierophant(p: p5, w: number, h: number) {
  const [X, Y] = scaler(w, h);
  drawPillar(p, w, X(-0.28), Y(-0.22), Y(0.2), X(0.08), TONE.stone);
  drawPillar(p, w, X(0.28), Y(-0.22), Y(0.2), X(0.08), TONE.stone);

  const staffHand: Pt = [X(-0.13), Y(0.0)];
  const blessHand: Pt = [X(0.12), Y(-0.12)];
  // 삼중 십자 지팡이 (인물 뒤)
  goldLine(p, w, 1.5);
  p.line(staffHand[0], Y(0.12), staffHand[0], Y(-0.27));
  for (const [y, half] of [
    [-0.25, 0.02],
    [-0.23, 0.03],
    [-0.21, 0.04],
  ]) {
    p.line(staffHand[0] - X(half), Y(y), staffHand[0] + X(half), Y(y));
  }
  drawFigure(p, w, h, 0, Y(-0.14), 1, [staffHand, blessHand], { cloak: TONE.warm, band: false });
  // 삼중관: 아래가 넓은 세 층 + 꼭대기 십자
  p.rectMode(p.CENTER);
  goldShape(p, w, G);
  for (let k = 0; k < 3; k++) p.rect(0, Y(-0.18 - k * 0.018), X(0.07 - k * 0.012), Y(0.018), X(0.008));
  p.line(0, Y(-0.24), 0, Y(-0.22));
  // 교차된 열쇠 두 개
  drawKey(p, w, X(-0.03), Y(0.2), X(0.12), -0.5);
  drawKey(p, w, X(0.03), Y(0.2), X(0.12), 0.5);
  // 뒤돌아선 두 신도 (머리 + 어깨)
  for (const [sx, c] of [
    [-0.2, TONE.warm],
    [0.2, TONE.light],
  ] as const) {
    goldShape(p, w, c);
    p.arc(X(sx), Y(0.27), X(0.14), Y(0.1), Math.PI, TAU, p.CHORD);
    goldShape(p, w, FIG.hair);
    p.circle(X(sx), Y(0.2), X(0.06));
  }
}

/**
 * VI. 연인: 태양 앞에서 날개를 펴고 축복하는 천사, 구름, 아래의 두 사람, 불꽃 나무와 뱀이 감긴 열매 나무 (사랑, 선택)
 * [AI 도움: Claude]
 */
export function drawLovers(p: p5, w: number, h: number) {
  const [X, Y] = scaler(w, h);
  // 천사 뒤의 태양
  withGlow(p, PALETTE.goldHover, w * 0.1, () => {
    p.noStroke();
    p.fill(...G, 230);
    p.circle(0, Y(-0.28), X(0.2));
  });
  drawWings(p, w, 0, Y(-0.22), X(0.4));
  drawFigure(p, w, h, 0, Y(-0.27), 0.55, [[X(-0.11), Y(-0.24)], [X(0.11), Y(-0.24)]], { tunic: TONE.light });
  drawClouds(p, w, h, [
    [-0.2, -0.12, 0.07],
    [-0.08, -0.13, 0.08],
    [0.06, -0.13, 0.08],
    [0.19, -0.12, 0.07],
  ]);
  // 가운데 산
  goldShape(p, w, TONE.stone);
  p.triangle(X(-0.1), Y(0.2), 0, Y(0.0), X(0.1), Y(0.2));
  // 나무: 왼쪽은 불꽃 나무, 오른쪽은 열매 나무 + 뱀
  drawTree(p, w, X(-0.29), Y(0.1), X(0.2));
  for (const [fx, fy] of [
    [-0.33, -0.02],
    [-0.27, -0.05],
    [-0.24, 0.0],
  ]) {
    drawFlame(p, X(fx), Y(fy), X(0.025));
  }
  drawTree(p, w, X(0.29), Y(0.1), X(0.2), true);
  p.noFill();
  p.stroke(...G);
  p.strokeWeight(lineW(w) * 1.3);
  p.beginShape();
  for (let t = 0; t <= 1; t += 0.05) p.vertex(X(0.29) + Math.sin(t * 12) * X(0.025), Y(0.1) - t * Y(0.12));
  p.endShape();

  drawGround(p, w, h, Y(0.2));
  drawFigure(p, w, h, X(-0.17), Y(0.03), 0.6, [[X(-0.24), Y(0.1)], [X(-0.1), Y(0.06)]], { band: false });
  drawFigure(p, w, h, X(0.17), Y(0.03), 0.6, [[X(0.1), Y(0.06)], [X(0.24), Y(0.1)]], { tunic: TONE.light, band: false });
}

/**
 * VII. 전차: 별무늬 차양 아래 전차에 선 전사, 날개 달린 원반 문양, 두 바퀴, 앞에 앉은 검은·흰 스핑크스 (의지, 승리)
 * [AI 도움: Claude]
 */
export function drawChariot(p: p5, w: number, h: number) {
  const [X, Y] = scaler(w, h);
  // 차양 기둥 + 별무늬 천
  goldLine(p, w, 1.2);
  p.line(X(-0.19), Y(-0.24), X(-0.19), Y(0.02));
  p.line(X(0.19), Y(-0.24), X(0.19), Y(0.02));
  p.rectMode(p.CORNER);
  goldShape(p, w, TONE.leaf);
  p.rect(X(-0.23), Y(-0.29), X(0.46), Y(0.06), X(0.01));
  p.noStroke();
  p.fill(...G);
  for (let i = 0; i < 6; i++) drawStar(p, X(-0.19 + i * 0.076), Y(-0.26), X(0.012), X(0.005), 5);

  // 전사 (오른손에 지팡이)
  const wandHand: Pt = [X(0.12), Y(-0.08)];
  drawFigure(p, w, h, 0, Y(-0.15), 0.85, [[X(-0.11), Y(-0.03)], wandHand], { band: false });
  p.noStroke();
  p.fill(...G);
  drawStar(p, 0, Y(-0.19), X(0.025), X(0.01), 8); // 머리 위 별
  goldLine(p, w, 1.5);
  p.line(wandHand[0], wandHand[1] + Y(0.02), wandHand[0] + X(0.03), Y(-0.2));

  // 전차 몸체 + 날개 달린 원반
  p.rectMode(p.CORNER);
  goldShape(p, w, TONE.stone);
  p.rect(X(-0.21), Y(0.0), X(0.42), Y(0.12), X(0.01));
  drawWings(p, w, 0, Y(0.05), X(0.14), G);
  goldShape(p, w, G);
  p.circle(0, Y(0.05), X(0.035));
  // 바퀴
  for (const sx of [-0.17, 0.17]) {
    goldShape(p, w, TONE.dark);
    p.circle(X(sx), Y(0.15), X(0.11));
    for (let k = 0; k < 6; k++) {
      const a = (k * TAU) / 6;
      p.line(X(sx), Y(0.15), X(sx) + Math.cos(a) * X(0.05), Y(0.15) + Math.sin(a) * X(0.05));
    }
  }
  // 스핑크스 두 마리 (왼쪽 검정, 오른쪽 흰색)
  drawSphinx(p, w, X(-0.15), Y(0.255), X(0.16), TONE.dark);
  drawSphinx(p, w, X(0.15), Y(0.255), X(0.16), TONE.light);
}

/**
 * 스핑크스 (앞을 보고 앉은 모습): 아래가 넓은 몸통 + 앞발 2개 + 줄무늬 머리쓰개 + 얼굴
 * (x, y) = 앞발 위치 / s = 크기 / c = 몸 색
 * [AI 도움: Claude]
 */
function drawSphinx(p: p5, w: number, x: number, y: number, s: number, c: [number, number, number]) {
  goldShape(p, w, c);
  p.quad(x - s * 0.32, y, x + s * 0.32, y, x + s * 0.16, y - s * 0.45, x - s * 0.16, y - s * 0.45); // 몸통
  p.ellipse(x - s * 0.17, y, s * 0.2, s * 0.1); // 앞발
  p.ellipse(x + s * 0.17, y, s * 0.2, s * 0.1);
  // 머리쓰개: 어깨까지 내려오는 사다리꼴 + 가로 줄무늬
  const hy = y - s * 0.62;
  p.quad(x - s * 0.13, hy - s * 0.12, x + s * 0.13, hy - s * 0.12, x + s * 0.22, hy + s * 0.2, x - s * 0.22, hy + s * 0.2);
  p.stroke(...G, 150);
  for (const k of [0.02, 0.1, 0.18]) p.line(x - s * (0.15 + k * 0.35), hy + s * k, x + s * (0.15 + k * 0.35), hy + s * k);
  p.noStroke();
  p.fill(...FIG.skin);
  p.ellipse(x, hy + s * 0.02, s * 0.17, s * 0.22);
}

/**
 * VIII. 힘: 머리 위에 ∞가 뜬 여인이 사자의 입을 부드럽게 감싸 쥠 (부드러운 힘, 용기)
 * [AI 도움: Claude]
 */
export function drawStrength(p: p5, w: number, h: number) {
  const [X, Y] = scaler(w, h);
  drawMountains(p, w, h, Y(0.08));
  drawGround(p, w, h, Y(0.18));
  // 여인 → 사자 순서로 그려서, 사자의 머리(갈기)가 여인의 손 앞에 보이게 함
  drawFigure(p, w, h, X(0.13), Y(-0.12), 0.95, [[X(-0.02), Y(0.04)], [X(0.02), Y(0.08)]], { tunic: TONE.light, band: false });
  drawLion(p, w, X(-0.16), Y(0.13), X(0.36));
  // 꽃 화관
  for (const dx of [-0.03, 0, 0.03]) drawRose(p, X(0.13 + dx), Y(-0.15), w * 0.01);
  withGlow(p, G, w * 0.05, () => {
    goldLine(p, w, 1.5);
    drawInfinity(p, X(0.13), Y(-0.22), X(0.06));
  });
}

/**
 * IX. 은둔자: 눈 덮인 봉우리 위, 두건을 쓰고 지팡이를 짚은 채 여섯 꼭짓점 별이 든 등불을 든 노인 (성찰, 내면의 빛)
 * [AI 도움: Claude]
 */
export function drawHermit(p: p5, w: number, h: number) {
  const [X, Y] = scaler(w, h);
  // 눈 덮인 봉우리
  goldShape(p, w, TONE.stone);
  p.beginShape();
  p.vertex(X(-0.42), Y(0.3));
  p.vertex(X(-0.42), Y(0.2));
  p.vertex(X(-0.1), Y(0.1));
  p.vertex(X(0.05), Y(0.07));
  p.vertex(X(0.2), Y(0.12));
  p.vertex(X(0.42), Y(0.18));
  p.vertex(X(0.42), Y(0.3));
  p.endShape(p.CLOSE);
  p.stroke(...PALETTE.text, 170);
  p.line(X(-0.18), Y(0.13), X(-0.08), Y(0.12));
  p.line(X(0.1), Y(0.1), X(0.2), Y(0.14));

  const staffHand: Pt = [X(-0.14), Y(0.03)];
  const lampHand: Pt = [X(0.14), Y(-0.09)];
  goldLine(p, w, 1.6);
  p.line(staffHand[0], Y(-0.13), staffHand[0] - X(0.01), Y(0.1)); // 지팡이
  drawFigure(p, w, h, X(-0.02), Y(-0.1), 1, [staffHand, lampHand], { hood: true, cloak: TONE.stone, tunic: TONE.leaf });
  // 흰 수염
  p.noStroke();
  p.fill(...PALETTE.text);
  p.triangle(X(-0.045), Y(-0.09), X(0.005), Y(-0.09), X(-0.02), Y(-0.045));
  // 등불: 손에서 늘어진 줄 + 육각 등 + 안의 빛나는 별
  const lx = lampHand[0] + X(0.01);
  const ly = Y(-0.02);
  p.stroke(...G);
  p.strokeWeight(lineW(w));
  p.line(lampHand[0], lampHand[1], lx, ly - X(0.04));
  withGlow(p, PALETTE.goldHover, w * 0.12, () => {
    goldShape(p, w, mix(PALETTE.gold, PALETTE.text, 0.4), 120);
    drawStarShape(p, lx, ly, X(0.04), X(0.035), 6);
    p.noStroke();
    p.fill(...PALETTE.goldHover);
    drawStar(p, lx, ly, X(0.025), X(0.012), 6);
  });
}

/**
 * X. 운명의 수레바퀴: 글자(T·A·R·O)가 새겨진 큰 바퀴, 위의 스핑크스와 검, 왼쪽의 뱀, 네 모서리 구름 (순환, 전환점)
 * [AI 도움: Claude]
 */
export function drawWheel(p: p5, w: number, h: number) {
  const [X, Y] = scaler(w, h);
  // 네 모서리 구름 + 작은 빛
  for (const [cx, cy] of [
    [-0.26, -0.27],
    [0.26, -0.27],
    [-0.27, 0.2],
    [0.27, 0.2],
  ]) {
    drawClouds(p, w, h, [
      [cx - 0.04, cy, 0.05],
      [cx + 0.03, cy - 0.01, 0.06],
    ]);
    drawSparkle(p, X(cx), Y(cy) - X(0.01), X(0.02), 230);
  }
  // 바퀴
  const cy = Y(-0.04);
  const R = X(0.22);
  goldShape(p, w, TONE.leaf);
  p.circle(0, cy, R * 2);
  goldLine(p, w);
  p.circle(0, cy, R * 1.6);
  p.circle(0, cy, R * 0.6);
  for (let k = 0; k < 8; k++) {
    const a = (k * TAU) / 8;
    p.line(Math.cos(a) * R * 0.3, cy + Math.sin(a) * R * 0.3, Math.cos(a) * R * 0.8, cy + Math.sin(a) * R * 0.8);
    drawPlanet(p, Math.cos(a + TAU / 16) * R * 0.55, cy + Math.sin(a + TAU / 16) * R * 0.55, R * 0.05, k % 2 ? PALETTE.sub : G);
  }
  // 바퀴 띠에 새긴 글자
  p.noStroke();
  p.fill(...G);
  p.textAlign(p.CENTER, p.CENTER);
  p.textFont(CANVAS_SERIF);
  p.textSize(R * 0.16);
  ['T', 'A', 'R', 'O'].forEach((ch, k) => {
    const a = -Math.PI / 2 + (k * TAU) / 4;
    p.text(ch, Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9);
  });
  p.textFont(CANVAS_FONT);
  withGlow(p, PALETTE.goldHover, w * 0.06, () => {
    goldShape(p, w, G);
    p.circle(0, cy, R * 0.25);
  });
  // 위의 스핑크스 + 검
  drawSuitSymbol(p, 'swords', X(0.05), cy - R - X(0.05), X(0.1));
  drawSphinx(p, w, 0, cy - R + X(0.01), X(0.1), TONE.stone);
  // 왼쪽으로 내려가는 뱀
  p.noFill();
  p.stroke(...G);
  p.strokeWeight(lineW(w) * 1.6);
  p.beginShape();
  for (let t = 0; t <= 1; t += 0.04) p.vertex(-R - X(0.04) + Math.sin(t * 14) * X(0.02), cy - R * 0.6 + t * R * 1.5);
  p.endShape();
}

/** 그림이 있는 0~10번 카드: 번호 → 그리는 함수 */
export const SCENES_0_TO_10: Record<number, (p: p5, w: number, h: number) => void> = {
  0: drawFool,
  1: drawMagician,
  2: drawHighPriestess,
  3: drawEmpress,
  4: drawEmperor,
  5: drawHierophant,
  6: drawLovers,
  7: drawChariot,
  8: drawStrength,
  9: drawHermit,
  10: drawWheel,
};

/**
 * I. 마법사: 한 손은 하늘로 지팡이, 한 손은 땅을 가리킴 ("위의 것을 아래로")
 *   머리 위 ∞, 탁자 위 컵·검·펜타클(4원소 도구), 발치의 장미
 * [AI 도움: Claude]
 */
export function drawMagician(p: p5, w: number, h: number) {
  drawHalo(p, 0, -0.165 * h, w * 0.17);
  withGlow(p, G, w * 0.05, () => {
    goldLine(p, w, 1.5);
    drawInfinity(p, 0, -0.275 * h, w * 0.075);
  });

  // 인물: 오른손은 하늘로(지팡이), 왼손은 땅을 가리킴
  const handUp: Pt = [0.135 * w, -0.215 * h];
  const handDown: Pt = [-0.15 * w, -0.005 * h];
  drawFigure(p, w, h, 0, -0.165 * h, 1, [handDown, handUp]);

  // 하늘을 향한 지팡이 (손에 쥔 모습) + 빛나는 끝
  p.stroke(...G);
  p.strokeWeight(lineW(w) * 2.2);
  p.line(0.12 * w, -0.185 * h, 0.17 * w, -0.3 * h);
  withGlow(p, PALETTE.goldHover, w * 0.08, () => {
    drawSparkle(p, 0.172 * w, -0.31 * h, w * 0.035, 255);
  });
  drawSparkle(p, -0.165 * w, 0.015 * h, w * 0.02, 220);

  // 탁자: 상판 + 앞으로 늘어진 식탁보(물결 모양 밑단 + 금색 테두리 + 가운데 별 자수)
  const tTop = 0.15 * h;
  const tHalf = 0.31 * w;
  const clothBottom = 0.25 * h;
  goldShape(p, w, mix(PALETTE.card, PALETTE.sub, 0.15));
  p.beginShape();
  p.vertex(-tHalf, tTop);
  p.vertex(tHalf, tTop);
  p.vertex(tHalf, clothBottom);
  const scallops = 6;
  for (let i = scallops; i > 0; i--) {
    // 오른쪽 → 왼쪽으로 아래로 볼록한 물결
    const x1 = -tHalf + (i * 2 * tHalf) / scallops;
    const x0 = -tHalf + ((i - 1) * 2 * tHalf) / scallops;
    p.bezierVertex(x1, clothBottom + 0.02 * h, x0, clothBottom + 0.02 * h, x0, clothBottom);
  }
  p.endShape(p.CLOSE);
  p.noFill();
  p.stroke(...G, 150);
  p.strokeWeight(lineW(w) * 0.8);
  p.line(-tHalf + 0.02 * w, clothBottom - 0.012 * h, tHalf - 0.02 * w, clothBottom - 0.012 * h); // 밑단 장식선
  p.noStroke();
  p.fill(...G, 200);
  drawStar(p, 0, 0.205 * h, 0.035 * w, 0.014 * w, 8);
  p.rectMode(p.CENTER);
  goldShape(p, w);
  p.rect(0, tTop, tHalf * 2.08, 0.022 * h, w * 0.008); // 상판

  // 탁자 위 4원소 도구 (컵·검·펜타클 + 손에 든 지팡이)
  drawSuitSymbol(p, 'cups', -0.22 * w, 0.112 * h, 0.09 * w);
  drawSuitSymbol(p, 'pentacles', 0.22 * w, 0.115 * h, 0.08 * w);
  p.push();
  p.translate(-0.13 * w, 0.132 * h);
  p.rotate(-Math.PI / 2 + 0.25);
  drawSuitSymbol(p, 'swords', 0, 0, 0.09 * w);
  p.pop();

  // 식탁보 양옆의 장미
  drawRose(p, -0.3 * w, 0.245 * h, w * 0.028);
  drawRose(p, 0.3 * w, 0.245 * h, w * 0.028);
}
