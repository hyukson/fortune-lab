// 담당: 장진영
// 개발용 "카드 디자인 미리보기" 화면 (주소: #/tarot?preview=1)
// 카드는 무작위로 뽑히기 때문에, 디자인을 확인하고 싶은 카드를 한 화면에 모아서 보여줍니다.
// 마우스를 올린 카드는 크게 확대해서 보여줍니다.
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 함수 단위로 작성했습니다. (AI 사용 비율: 약 100%)

import type p5 from 'p5';
import { DECK } from './deck';
import { drawCardBack, drawCardFront, fitText } from './drawCard';
import { CANVAS_FONT, PALETTE } from './palette';

/** 미리볼 카드 목록: [카드 id, 역방향 여부]. -1은 카드 뒷면 */
const PREVIEW: [number, boolean][] = [
  // 메이저 아르카나 22장 (0 바보 ~ 21 세계)
  ...Array.from({ length: 22 }, (_, i) => [i, false] as [number, boolean]),
  [19, true], // 태양 역방향
  [22 + 0, false], // 완드 에이스 (마이너 숫자 카드)
  [22 + 14 + 2, false], // 컵 3
  [22 + 14 * 2 + 9, false], // 소드 10
  [22 + 14 * 3 + 12, false], // 펜타클 여왕 (마이너 인물 카드)
  [-1, false], // 뒷면
];

/** 마이너 카드 미리보기 목록 (주소에 &set=minor 를 붙이면 이 목록을 보여줌) */
const m = (suitIdx: number, number: number): [number, boolean] => [22 + suitIdx * 14 + number - 1, false];
const PREVIEW_MINOR: [number, boolean][] = [
  m(0, 1), m(1, 1), m(2, 1), m(3, 1), // 에이스 4장
  m(1, 2), m(0, 5), m(2, 7), m(3, 10), // 숫자 카드
  m(0, 11), m(2, 12), m(1, 13), m(3, 14), // 시종·기사·여왕·왕
  [22 + 14 + 12, true], // 컵 여왕 역방향
];

const RATIO = 1.62;

/**
 * 미리보기 스케치: 카드를 격자로 배치하고, 마우스를 올린 카드는 오른쪽(또는 아래)에 크게 표시
 * [AI 도움: Claude]
 */
export function previewSketch(p: p5) {
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.textFont(CANVAS_FONT);
  };
  p.windowResized = () => p.resizeCanvas(p.windowWidth, p.windowHeight);

  p.draw = () => {
    p.background(...PALETTE.bg);
    const wide = p.width > p.height;
    // 왼쪽(또는 위쪽): 작은 카드 격자 / 오른쪽(또는 아래쪽): 확대 카드
    const gridW = wide ? p.width * 0.55 : p.width;
    const gridH = wide ? p.height : p.height * 0.5;
    // 주소 끝에 &set=minor 면 마이너 목록, &card=번호 면 그 카드를 처음부터 크게 보여줌
    const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
    const list = params.get('set') === 'minor' ? PREVIEW_MINOR : PREVIEW;
    const cols = wide ? (list.length > 16 ? 7 : 5) : 5;
    const rows = Math.ceil(list.length / cols);
    const cw = Math.min((gridW - 40) / cols - 16, (gridH - 80) / rows / RATIO - 16);
    const ch = cw * RATIO;

    const fromUrl = Number(params.get('card'));
    let hover = fromUrl >= 0 && fromUrl < list.length ? fromUrl : 0;
    list.forEach(([id, rev], i) => {
      const x = 20 + (i % cols) * (cw + 16) + cw / 2 + (gridW - cols * (cw + 16) - 24) / 2;
      const y = 60 + Math.floor(i / cols) * (ch + 16) + ch / 2;
      if (Math.abs(p.mouseX - x) < cw / 2 && Math.abs(p.mouseY - y) < ch / 2) hover = i;
      p.push();
      p.translate(x, y);
      drawOne(p, id, rev, cw, ch);
      p.pop();
    });

    // 확대 카드
    const bigH = wide ? p.height * 0.86 : p.height * 0.46;
    const bigW = Math.min(bigH / RATIO, wide ? p.width * 0.4 : p.width * 0.8);
    const [id, rev] = list[hover];
    p.push();
    p.translate(wide ? gridW + (p.width - gridW) / 2 : p.width / 2, wide ? p.height / 2 : gridH + p.height * 0.25);
    drawOne(p, id, rev, bigW, bigW * RATIO);
    p.pop();

    p.noStroke();
    p.fill(...PALETTE.gold);
    p.textAlign(p.LEFT, p.CENTER);
    fitText(p, '카드 디자인 미리보기 (개발용) · 카드에 마우스를 올리면 크게 보여요', 20, 28, p.width - 40, 16);
  };
}

/** 카드 하나 그리기 (id가 -1이면 뒷면) */
function drawOne(p: p5, id: number, reversed: boolean, w: number, h: number) {
  if (id < 0) drawCardBack(p, w, h);
  else drawCardFront(p, DECK[id], w, h, reversed);
}
