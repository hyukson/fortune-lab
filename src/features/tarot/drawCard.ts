// 담당: 장진영
// p5.js로 카드 앞면/뒷면을 "직접" 그리는 함수 모음 (저작권 있는 덱 이미지를 쓰지 않기 위해 도형으로 그림)
// 1차 버전: 간단한 그림. 3차에서 카드별 그림을 다듬을 예정.
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 함수 단위로 작성했습니다. (AI 사용 비율: 약 100%)
//
// 모든 그리기 함수는 "카드 중심이 (0, 0)"이라고 가정합니다.
// → 호출하는 쪽에서 p.translate(x, y)로 위치를 옮긴 뒤 부르면 되고,
//   뒤집기(scale)·역방향(rotate)도 중심 기준으로 쉽게 적용됩니다.

import type p5 from 'p5';
import { drawCrescent, drawSparkle } from './celestial';
import type { Suit, TarotCard } from './deck';
import { PALETTE } from './palette';

/** 마이너 카드 위쪽에 표시할 짧은 숫자 표기 (1~14) */
const RANK_SHORT = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'P', 'Kn', 'Q', 'K'];

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
 * 별 모양(뾰족한 부분 n개)을 그리는 함수. r1 = 바깥 반지름, r2 = 안쪽 반지름
 * [AI 도움: Claude] 함수 작성
 */
export function drawStar(p: p5, x: number, y: number, r1: number, r2: number, n: number): void {
  p.beginShape();
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? r1 : r2;
    const a = -p.HALF_PI + (i * p.PI) / n;
    p.vertex(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  p.endShape(p.CLOSE);
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

/**
 * 슈트 기호 하나를 (x, y)에 크기 s로 그리는 함수
 * - 완드: 잎이 달린 지팡이 / 컵: 잔 / 소드: 검 / 펜타클: 원 안의 별
 * [AI 도움: Claude] 함수 작성
 */
export function drawSuitSymbol(p: p5, suit: Suit, x: number, y: number, s: number): void {
  p.push();
  p.translate(x, y);
  p.stroke(...PALETTE.gold);
  p.fill(...PALETTE.gold);
  p.strokeWeight(Math.max(1, s * 0.1));

  if (suit === 'wands') {
    p.line(0, -s * 0.5, 0, s * 0.5);
    p.noStroke();
    p.ellipse(-s * 0.15, -s * 0.2, s * 0.22, s * 0.12);
    p.ellipse(s * 0.15, s * 0.05, s * 0.22, s * 0.12);
  } else if (suit === 'cups') {
    p.noStroke();
    p.arc(0, -s * 0.15, s * 0.7, s * 0.7, 0, p.PI, p.CHORD); // 잔 몸통 (반원)
    p.rect(0, s * 0.2, s * 0.1, s * 0.3); // 손잡이 기둥
    p.rect(0, s * 0.38, s * 0.45, s * 0.08); // 받침
  } else if (suit === 'swords') {
    p.line(0, -s * 0.5, 0, s * 0.25); // 칼날
    p.line(-s * 0.25, s * 0.22, s * 0.25, s * 0.22); // 손잡이 가로대
    p.line(0, s * 0.25, 0, s * 0.45); // 손잡이
  } else {
    p.noFill();
    p.circle(0, 0, s * 0.85);
    p.noStroke();
    p.fill(...PALETTE.gold);
    drawStar(p, 0, 0, s * 0.32, s * 0.13, 5);
  }
  p.pop();
}

/**
 * 마이너 숫자 카드(1~10)의 기호를 개수만큼 배치하는 함수.
 * 1장은 가운데 크게, 2~3장은 세로 한 줄, 4장 이상은 두 줄(홀수면 마지막 하나는 가운데).
 * [AI 도움: Claude] 배치 계산 작성
 */
function drawPips(p: p5, suit: Suit, count: number, w: number, h: number): void {
  if (count === 1) {
    drawSuitSymbol(p, suit, 0, 0, w * 0.45);
    return;
  }
  const size = w * (count <= 3 ? 0.24 : 0.2);
  const cols = count <= 3 ? 1 : 2;
  const rows = Math.ceil(count / cols);
  const areaH = h * 0.5;
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const isLastAlone = cols === 2 && count % 2 === 1 && i === count - 1;
    const x = cols === 1 || isLastAlone ? 0 : (col === 0 ? -1 : 1) * w * 0.17;
    const y = rows === 1 ? 0 : -areaH / 2 + (row * areaH) / (rows - 1);
    drawSuitSymbol(p, suit, x, y, size);
  }
}

/**
 * 메이저 카드 가운데 그림 (간단 버전): 눈금 달린 이중 원 + 카드 번호에 따라 뾰족한 개수가 다른 별
 * [AI 도움: Claude] 함수 작성
 */
function drawMajorSymbol(p: p5, number: number, size: number): void {
  p.noFill();
  p.stroke(...PALETTE.gold);
  p.strokeWeight(Math.max(1, size * 0.03));
  p.circle(0, 0, size * 1.6);
  p.stroke(...PALETTE.sub, 140);
  p.circle(0, 0, size * 1.25);
  // 원판 느낌의 눈금 12개
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
 * 카드 앞면을 그리는 함수.
 * reversed(역방향)가 true면 카드 전체를 180° 돌려서 그립니다 (실제 타로처럼 거꾸로 보임).
 * [AI 도움: Claude] 함수 작성
 */
export function drawCardFront(p: p5, card: TarotCard, w: number, h: number, reversed: boolean): void {
  p.push();
  if (reversed) p.rotate(p.PI);
  drawFrame(p, w, h);

  // 위쪽: 번호 (메이저는 로마 숫자, 마이너는 A/2~10/P/Kn/Q/K)
  p.noStroke();
  p.fill(...PALETTE.gold);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(h * 0.07);
  const label = card.arcana === 'major' ? toRoman(card.number) : RANK_SHORT[card.number - 1];
  p.text(label, 0, -h * 0.37);

  // 가운데: 그림
  if (card.arcana === 'major') {
    drawMajorSymbol(p, card.number, w * 0.34);
  } else if (card.suit) {
    if (card.number <= 10) {
      drawPips(p, card.suit, card.number, w, h);
    } else {
      // 시종·기사·여왕·왕: 큰 기호 + 인물 표시(작은 왕관 모양)
      drawSuitSymbol(p, card.suit, 0, h * 0.04, w * 0.4);
      p.noStroke();
      p.fill(...PALETTE.sub);
      const cw = w * 0.08 * (card.number - 9); // 시종 < 기사 < 여왕 < 왕 순으로 왕관이 커짐
      drawStar(p, 0, -h * 0.2, cw, cw * 0.5, card.number - 8);
    }
  }

  // 아래쪽: 카드 이름
  p.fill(...PALETTE.text);
  fitText(p, card.nameKo, 0, h * 0.37, w * 0.8, h * 0.07);
  p.pop();
}
