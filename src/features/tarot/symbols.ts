// 담당: 장진영
// 여러 파일에서 같이 쓰는 기본 도형: 별, 슈트 기호(완드·컵·소드·펜타클)
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 함수 단위로 작성했습니다. (AI 사용 비율: 약 100%)

import type p5 from 'p5';
import type { Suit } from './deck';
import { PALETTE } from './palette';

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
 * 왕관: 뾰족한 봉우리 n개 + 봉우리 끝 보석 + 아래 띠 (인물 카드, 황제·정의 등)
 * [AI 도움: Claude] 함수 작성
 */
export function drawCrown(p: p5, x: number, y: number, s: number, peaks: number): void {
  p.fill(...PALETTE.gold);
  p.stroke(...PALETTE.goldHover);
  p.strokeWeight(Math.max(0.6, s * 0.03));
  p.beginShape();
  p.vertex(x - s / 2, y + s * 0.3);
  for (let i = 0; i <= peaks * 2; i++) {
    const px = x - s / 2 + (i * s) / (peaks * 2);
    p.vertex(px, i % 2 === 0 ? y - s * 0.3 : y + s * 0.02);
  }
  p.vertex(x + s / 2, y + s * 0.3);
  p.endShape(p.CLOSE);
  p.noStroke();
  p.fill(...PALETTE.sub);
  for (let i = 0; i <= peaks; i++) p.circle(x - s / 2 + (i * s) / peaks, y - s * 0.32, s * 0.11);
  p.fill(...PALETTE.card);
  p.rectMode(p.CENTER);
  p.rect(x, y + s * 0.2, s * 0.9, s * 0.07);
}

/**
 * 슈트 기호 하나를 (x, y)에 크기 s로 그리는 함수
 * - 완드: 잎이 달린 지팡이 / 컵: 잔 / 소드: 검 / 펜타클: 원 안의 별
 * [AI 도움: Claude] 함수 작성
 */
export function drawSuitSymbol(p: p5, suit: Suit, x: number, y: number, s: number): void {
  p.push();
  p.translate(x, y);
  p.rectMode(p.CENTER);
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
