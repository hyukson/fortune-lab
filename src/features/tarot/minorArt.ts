// 담당: 장진영
// 마이너 아르카나 56장의 그림 — 카드마다 따로 그리지 않고 "규칙"으로 생성합니다.
//   ① 슈트별 배경 (완드: 새싹 언덕 / 컵: 물결 / 소드: 바람과 구름 / 펜타클: 꽃 정원)
//   ② 숫자 카드(2~10): 은은한 원판 무늬 위에 슈트 기호를 숫자만큼 배치
//   ③ 에이스: 후광 + 빛나는 큰 기호
//   ④ 인물 카드(시종·기사·여왕·왕): 슈트 기호를 든 인물 + 계급에 따라 왕관·왕좌
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 함수 단위로 작성했습니다. (AI 사용 비율: 약 100%)
// 좌표 규칙은 artParts.ts 맨 위 설명 참고 (X(0.2) = 너비의 20%, Y(-0.1) = 높이의 -10%)

import type p5 from 'p5';
import { G, TAU, TONE, drawClouds, drawFigure, drawGround, drawHalo, drawRose, goldShape, lineW, withGlow } from './artParts';
import { drawSparkle } from './celestial';
import type { Suit, TarotCard } from './deck';
import { PALETTE, type RGB } from './palette';
import { drawCrown, drawSuitSymbol } from './symbols';

/** 비율 → px 변환 도우미 (X: 너비 기준, Y: 높이 기준) */
const scaler = (w: number, h: number) => [(f: number) => f * w, (f: number) => f * h] as const;

/** 그림 창의 가운데 높이 (기호를 이 높이 중심으로 배치) */
const CENTER_Y = -0.065;

/** 슈트별 인물 옷 색 */
const SUIT_CLOAK: Record<Suit, RGB> = {
  wands: TONE.warm,
  cups: TONE.leaf,
  swords: TONE.stone,
  pentacles: TONE.dark,
};

/**
 * 슈트별 배경 (그림 창 아래쪽에 깔림)
 * [AI 도움: Claude]
 */
function drawSuitBackdrop(p: p5, suit: Suit, w: number, h: number) {
  const [X, Y] = scaler(w, h);
  if (suit === 'wands') {
    // 완드(불·열정): 언덕 + 새싹
    drawGround(p, w, h, Y(0.2));
    p.noStroke();
    p.fill(...TONE.leaf);
    for (const x of [-0.25, -0.1, 0.12, 0.27]) {
      p.ellipse(X(x - 0.012), Y(0.215), X(0.03), X(0.012));
      p.ellipse(X(x + 0.012), Y(0.21), X(0.03), X(0.012));
    }
  } else if (suit === 'cups') {
    // 컵(물·감정): 물결 세 줄
    goldShape(p, w, PALETTE.sub, 45);
    p.rectMode(p.CORNER);
    p.rect(X(-0.4), Y(0.2), X(0.8), Y(0.1));
    p.noFill();
    p.stroke(...PALETTE.sub, 170);
    p.strokeWeight(lineW(w) * 0.8);
    for (const wy of [0.215, 0.235, 0.255]) {
      p.beginShape();
      for (let x = -0.36; x <= 0.36; x += 0.02) p.vertex(X(x), Y(wy) + Math.sin(x * 45 + wy * 100) * Y(0.004));
      p.endShape();
    }
  } else if (suit === 'swords') {
    // 소드(공기·생각): 위쪽 구름 + 비스듬한 바람 선
    drawClouds(p, w, h, [
      [-0.27, -0.25, 0.05],
      [-0.2, -0.27, 0.06],
      [0.22, -0.26, 0.06],
      [0.29, -0.24, 0.05],
    ]);
    p.noFill();
    p.stroke(...PALETTE.sub, 120);
    p.strokeWeight(lineW(w) * 0.8);
    for (const [x, y] of [
      [-0.3, 0.17],
      [0.05, 0.22],
      [0.18, 0.15],
    ]) {
      p.bezier(X(x), Y(y), X(x + 0.05), Y(y - 0.02), X(x + 0.1), Y(y + 0.01), X(x + 0.15), Y(y - 0.01));
    }
  } else {
    // 펜타클(흙·현실): 땅 + 작은 꽃들
    drawGround(p, w, h, Y(0.21));
    for (const x of [-0.28, -0.14, 0.15, 0.28]) drawRose(p, X(x), Y(0.24), w * 0.014);
  }
}

/**
 * 숫자 카드 기호 뒤의 은은한 원판 무늬 (이중 원 + 눈금 12개)
 * [AI 도움: Claude]
 */
function drawMandala(p: p5, w: number, h: number) {
  const y = CENTER_Y * h;
  const r = 0.3 * w;
  p.noFill();
  p.stroke(...G, 45);
  p.strokeWeight(lineW(w));
  p.circle(0, y, r * 2);
  p.circle(0, y, r * 1.7);
  for (let i = 0; i < 12; i++) {
    const a = (i * TAU) / 12;
    p.line(Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85, Math.cos(a) * r, y + Math.sin(a) * r);
  }
}

/**
 * 숫자 카드(2~10)의 기호를 개수만큼 배치하는 함수.
 * 2~3장은 세로 한 줄, 4장 이상은 두 줄(홀수면 마지막 하나는 가운데).
 * [AI 도움: Claude] 배치 계산 작성
 */
function drawPips(p: p5, suit: Suit, count: number, w: number, h: number) {
  const few = count <= 3; // 2~3장은 한 줄로 크게, 4장 이상은 두 줄
  const size = w * (few ? 0.26 : 0.17);
  const cols = few ? 1 : 2;
  const rows = Math.ceil(count / cols);
  const areaH = h * (few ? 0.28 : 0.4);
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const isLastAlone = cols === 2 && count % 2 === 1 && i === count - 1;
    const x = cols === 1 || isLastAlone ? 0 : (col === 0 ? -1 : 1) * w * 0.15;
    const y = CENTER_Y * h + (rows === 1 ? 0 : -areaH / 2 + (row * areaH) / (rows - 1));
    drawSuitSymbol(p, suit, x, y, size);
  }
}

/**
 * 에이스: 후광 + 빛 번짐이 있는 큰 기호 + 주변의 작은 반짝임 (새로운 시작의 에너지)
 * [AI 도움: Claude]
 */
function drawAce(p: p5, suit: Suit, w: number, h: number) {
  const [X, Y] = scaler(w, h);
  const y = Y(CENTER_Y);
  drawHalo(p, 0, y, X(0.2));
  withGlow(p, PALETTE.goldHover, w * 0.08, () => drawSuitSymbol(p, suit, 0, y, X(0.42)));
  for (const [sx, sy] of [
    [-0.22, -0.2],
    [0.24, -0.12],
    [-0.2, 0.08],
    [0.2, 0.1],
  ]) {
    drawSparkle(p, X(sx), Y(sy), X(0.02), 220);
  }
}

/**
 * 인물 카드: 오른손에 슈트 기호를 든 인물
 * - 시종(11): 머리띠만 / 기사(12): 작은 왕관(투구) / 여왕(13)·왕(14): 왕관 + 뒤에 왕좌
 * [AI 도움: Claude]
 */
function drawCourt(p: p5, card: TarotCard, w: number, h: number) {
  const [X, Y] = scaler(w, h);
  const suit = card.suit!;
  const rank = card.number - 10; // 1=시종, 2=기사, 3=여왕, 4=왕
  const headY = Y(-0.15);
  if (rank >= 3) {
    // 왕좌 등받이 (위가 둥근 판)
    p.rectMode(p.CORNER);
    goldShape(p, w, TONE.stone);
    p.rect(X(-0.17), Y(-0.24), X(0.34), Y(0.4), X(0.12), X(0.12), 0, 0);
  }
  const symbolHand: [number, number] = [X(0.14), Y(-0.1)];
  drawFigure(p, w, h, 0, headY, 0.95, [[X(-0.12), Y(0.02)], symbolHand], {
    cloak: SUIT_CLOAK[suit],
    tunic: rank === 3 ? TONE.light : undefined,
    band: rank === 1,
  });
  if (rank >= 2) drawCrown(p, 0, headY - Y(0.045), X(0.05 + rank * 0.012), rank + 1);
  withGlow(p, PALETTE.goldHover, w * 0.04, () => drawSuitSymbol(p, suit, symbolHand[0] + X(0.03), Y(-0.19), X(0.13)));
}

/**
 * 마이너 카드 그림 전체 (그림 창 안을 잘라내기(clip)한 상태에서 호출됨)
 * [AI 도움: Claude]
 */
export function drawMinorArt(p: p5, card: TarotCard, w: number, h: number): void {
  if (!card.suit) return;
  p.push();
  drawSuitBackdrop(p, card.suit, w, h);
  if (card.number === 1) {
    drawAce(p, card.suit, w, h);
  } else if (card.number <= 10) {
    drawMandala(p, w, h);
    drawPips(p, card.suit, card.number, w, h);
  } else {
    drawCourt(p, card, w, h);
  }
  p.pop();
}
