// 담당: 장진영
// 타로 리딩 화면 전체를 그리는 p5.js 스케치 (화면 전체 크기 캔버스)
//   ① 섞기 애니메이션 → ② 78장을 여러 줄 + 페이지로 깔기 → ③ 3장 고르기(과거·현재·조언 자리로 날아감)
//   → ④ 한 장씩 뒤집기
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 함수 단위로 작성했습니다. (AI 사용 비율: 약 100%)
//
// 구조 설명
// - createTarotSketch(옵션)  →  P5Canvas에 넘길 sketch 함수를 만들어 돌려줍니다.
// - 진행 상황(s: TarotSession)은 바뀔 때마다 onChange로 React에 알려주고, React가 localStorage에 저장합니다.
// - 애니메이션 정보(날아가는 중, 뒤집히는 중 등)는 저장하지 않습니다.
//   → 새로고침하면 애니메이션 없이 "결과 상태" 그대로 다시 그려집니다.

import type p5 from 'p5';
import { createNebula, drawCelestialWheel, drawSparkle } from './celestial';
import { DECK, DECK_SIZE, createShuffledDeck } from './deck';
import { drawCardBack, drawCardFront, drawStar, fitText } from './drawCard';
import { PALETTE } from './palette';
import { POSITION_LABELS, type TarotSession } from './storage';

type SketchOptions = {
  getInitial: () => TarotSession; // 캔버스가 만들어질 때 시작 상태를 가져오는 함수
  onChange: (s: TarotSession) => void; // 상태가 바뀔 때마다 호출 (React가 저장)
  reducedMotion: boolean; // 사용자가 "동작 줄이기"를 켰으면 애니메이션을 생략
};

/** 화면 배치 정보 (창 크기가 바뀔 때마다 다시 계산) */
type Layout = {
  w: number;
  h: number;
  side: number; // 좌우 화살표 자리 폭
  gap: number; // 카드 사이 간격
  cardW: number; // 깔린 카드 크기
  cardH: number;
  cols: number; // 한 페이지의 열 수
  rows: number; // 한 페이지의 줄 수
  perPage: number; // 한 페이지에 보이는 카드 수
  pages: number; // 전체 페이지 수
  gridLeft: number; // 카드 영역 왼쪽 x
  gridY: number; // 카드 영역 위쪽 y
  usedW: number; // 카드 영역 실제 너비
  usedH: number; // 카드 영역 실제 높이
  gridTop: number; // 카드 영역(여백 포함) 시작 y
  gridBottom: number; // 카드 영역 끝 y = 아래쪽 자리 영역 시작
  pageStride: number; // 한 페이지 넘길 때 이동하는 거리(px)
  slotW: number; // 과거·현재·조언 자리 카드 크기
  slotH: number;
  slotCY: number; // 자리 카드 중심 y
  slotXs: number[]; // 자리 카드 중심 x 3개
};

const TOP_BAR = 64; // 위쪽 HTML 버튼 줄 높이 (TarotPage.css의 .tarot-topbar와 맞춤)
const CARD_RATIO = 1.62; // 카드 세로/가로 비율

/**
 * 창 크기(w, h)에 맞춰 카드 크기·줄 수·페이지 수·자리 위치를 계산하는 함수.
 * 화면 위쪽 약 56%는 "깔린 카드", 아래쪽은 "과거·현재·조언 자리"로 씁니다.
 * 카드가 너무 작아지지 않게 최소 크기를 두고, 한 화면에 다 안 들어가면 여러 페이지로 나눕니다.
 * [AI 도움: Claude] 배치 계산 작성
 */
export function computeLayout(w: number, h: number): Layout {
  const narrow = w < 600;
  const side = narrow ? 34 : 56;
  const gap = narrow ? 6 : 10;
  const gridTop = TOP_BAR + 8;
  const gridBottom = Math.round(h * 0.56);
  const dotsH = 22; // 페이지 점 표시 자리
  const availW = w - side * 2;
  const availH = gridBottom - gridTop - dotsH;

  // 넓은 화면 기준으로 한 줄에 13장 정도 들어가게 하되, 너무 크거나 작지 않게 제한
  let cardW = Math.min(110, Math.max(44, (availW - gap * 12) / 13));
  let cardH = cardW * CARD_RATIO;
  // 세로 공간이 부족하면 최소 2줄은 들어가도록 줄임
  if (cardH * 2 + gap > availH) {
    cardH = Math.max(40, (availH - gap) / 2);
    cardW = cardH / CARD_RATIO;
  }
  const cols = Math.max(1, Math.floor((availW + gap) / (cardW + gap)));
  const rows = Math.max(1, Math.min(Math.ceil(DECK_SIZE / cols), Math.floor((availH + gap) / (cardH + gap))));
  const perPage = cols * rows;
  const pages = Math.ceil(DECK_SIZE / perPage);
  const usedW = cols * cardW + (cols - 1) * gap;
  const usedH = rows * cardH + (rows - 1) * gap;
  const gridLeft = (w - usedW) / 2;
  const gridY = gridTop + (availH - usedH) / 2;
  const pageStride = cols * (cardW + gap);

  // 아래쪽: 과거·현재·조언 자리 (위에 이름표, 아래에 카드 이름·안내 문구 공간)
  const labelH = 22;
  const nameH = 44;
  const hintH = 30;
  const area = h - gridBottom;
  const slotGap = narrow ? 12 : 28;
  const maxSlotW = (Math.min(w, 900) - 32 - slotGap * 2) / 3;
  const slotH = Math.max(60, Math.min(area - labelH - nameH - hintH - 16, maxSlotW * CARD_RATIO));
  const slotW = slotH / CARD_RATIO;
  const slotCY = gridBottom + labelH + 8 + slotH / 2;
  const slotXs = [-1, 0, 1].map((k) => w / 2 + k * (slotW + slotGap));

  return {
    w, h, side, gap, cardW, cardH, cols, rows, perPage, pages, gridLeft, gridY, usedW, usedH,
    gridTop, gridBottom, pageStride, slotW, slotH, slotCY, slotXs,
  };
}

/** 0~1 사이 값을 부드럽게(처음과 끝은 천천히) 바꾸는 함수 */
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** 0~1 사이 값을 끝에서 천천히 멈추게 바꾸는 함수 */
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type Star = { x: number; y: number; r: number; phase: number; speed: number };
type Flight = { x: number; y: number; start: number }; // 깔린 자리 → 과거·현재·조언 자리로 날아가는 카드
type Press = { x: number; y: number; scroll: number; dragging: boolean }; // 누르기 시작한 위치(드래그 판별용)

/**
 * P5Canvas에 넘길 sketch 함수를 만드는 함수.
 * [AI 도움: Claude] 스케치 전체 구조 작성
 */
export function createTarotSketch(opts: SketchOptions) {
  return (p: p5) => {
    // ── 상태 ─────────────────────────────────────────
    let s: TarotSession = structuredClone(opts.getInitial()); // 저장되는 진행 상황
    let L: Layout; // 현재 화면 배치
    let canvasEl: HTMLCanvasElement; // 클릭이 캔버스에서 일어났는지 확인용

    // 애니메이션 시간(ms). 동작 줄이기 설정이면 0 → 즉시 완료
    const ms = (v: number) => (opts.reducedMotion ? 0 : v);
    const SHUFFLE_MS = ms(2600);
    const DEAL_MS = ms(450);
    const DEAL_STAGGER = ms(10);
    const FLY_MS = ms(650);
    const FLIP_MS = ms(700);

    let page = 0; // 목표 페이지
    let scrollPos = 0; // 현재 보이는 페이지 위치(소수 가능, 부드럽게 따라감)
    let shuffleStart = 0;
    let dealStart = -Infinity; // -Infinity = 애니메이션 없이 바로 제자리
    const flights: (Flight | null)[] = [null, null, null];
    const flipStarts = [-Infinity, -Infinity, -Infinity];
    let stars: Star[] = []; // 작은 별 (배경)
    let sparkles: Star[] = []; // 큰 반짝이는 별 ✦ (배경)
    let nebula: p5.Image; // 성운 배경 이미지 (처음 한 번만 만듦)
    let press: Press | null = null;
    let lastWheel = 0;

    /** 시작 시각과 길이로 진행률(0~1)을 구함. 길이가 0이거나 시작이 -Infinity면 1 */
    const progress = (start: number, dur: number) => (dur <= 0 ? 1 : clamp((p.millis() - start) / dur, 0, 1));

    /** 상태가 바뀌었음을 React에 알림 (복사본을 넘겨서 서로 영향 없게) */
    const emit = () => opts.onChange(structuredClone(s));

    // ── p5 기본 함수 ────────────────────────────────

    /**
     * 처음 한 번 실행: 화면 전체 크기 캔버스 생성, 성운·별 배경 준비, 섞기 시작 시각 기록
     * [AI 도움: Claude]
     */
    p.setup = () => {
      const cnv = p.createCanvas(p.windowWidth, p.windowHeight);
      canvasEl = cnv.elt as HTMLCanvasElement;
      p.textFont('Pretendard, "Noto Sans KR", system-ui, sans-serif');
      p.rectMode(p.CENTER);
      L = computeLayout(p.width, p.height);
      stars = Array.from({ length: 160 }, () => ({
        x: p.random(),
        y: p.random(),
        r: p.random(0.6, 2.2),
        phase: p.random(p.TWO_PI),
        speed: p.random(0.001, 0.003),
      }));
      sparkles = Array.from({ length: 14 }, () => ({
        x: p.random(),
        y: p.random(),
        r: p.random(4, 9),
        phase: p.random(p.TWO_PI),
        speed: p.random(0.0008, 0.002),
      }));
      nebula = createNebula(p);
      if (s.phase === 'shuffle') shuffleStart = p.millis();
    };

    /** 창 크기가 바뀌면 캔버스와 배치를 다시 맞춤 (전체화면 전환 포함) */
    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      L = computeLayout(p.width, p.height);
      page = clamp(page, 0, L.pages - 1);
      scrollPos = page;
    };

    /**
     * 매 프레임 실행: 단계(phase)에 맞는 화면을 그림
     * [AI 도움: Claude]
     */
    p.draw = () => {
      const now = p.millis();
      drawStars(now);

      if (s.phase === 'shuffle') {
        drawShuffle(now);
        if (now - shuffleStart >= SHUFFLE_MS) finishShuffle();
        return;
      }

      // 드래그 중이 아니면 목표 페이지 쪽으로 부드럽게 이동
      if (!press?.dragging) scrollPos += (page - scrollPos) * (opts.reducedMotion ? 1 : 0.18);

      const hoverCard = s.phase === 'pick' ? hitGridCard(p.mouseX, p.mouseY) : -1;
      const hoverSlot = s.phase === 'reveal' ? hitSlot(p.mouseX, p.mouseY) : -1;
      const hoverArrow = hitArrow(p.mouseX, p.mouseY) !== 0;

      drawGrid(hoverCard);
      drawPager();
      drawSlots(hoverSlot);
      drawFlights();
      drawHint();
      p.cursor(hoverCard >= 0 || hoverSlot >= 0 || hoverArrow ? p.HAND : p.ARROW);
    };

    // ── 입력 처리 (마우스 + 터치 공용) ──────────────────
    // p5는 마우스 이벤트를 window 전체에서 받기 때문에, 캔버스 위에서 일어난 것만 처리합니다.
    // (안 그러면 위쪽 HTML 버튼을 눌러도 카드가 선택될 수 있음)

    /** 누르기 시작: 위치 기억 (나중에 클릭인지 드래그인지 구분) */
    p.mousePressed = (e?: object) => {
      if ((e as Event | undefined)?.target !== canvasEl) return;
      if (s.phase === 'shuffle') {
        finishShuffle(); // 섞는 중에 누르면 바로 섞기 완료
        return false;
      }
      press = { x: p.mouseX, y: p.mouseY, scroll: scrollPos, dragging: false };
      return false; // 터치 시 화면 스크롤·확대 방지
    };

    /** 누른 채 옆으로 밀기: 카드 페이지를 손가락/마우스를 따라 움직임 */
    p.mouseDragged = () => {
      if (!press) return;
      const dx = p.mouseX - press.x;
      if (!press.dragging && Math.abs(dx) > 10) press.dragging = true;
      if (press.dragging && L.pages > 1) {
        scrollPos = clamp(press.scroll - dx / L.pageStride, -0.3, L.pages - 1 + 0.3);
      }
      return false;
    };

    /** 손을 뗌: 많이 밀었으면 페이지 넘기기, 아니면 클릭으로 처리 */
    p.mouseReleased = () => {
      if (!press) return;
      const dx = p.mouseX - press.x;
      if (press.dragging) {
        if (dx < -50) page = clamp(page + 1, 0, L.pages - 1);
        else if (dx > 50) page = clamp(page - 1, 0, L.pages - 1);
      } else {
        handleTap(p.mouseX, p.mouseY);
      }
      press = null;
      return false;
    };

    /** 마우스 휠(또는 트랙패드)로 페이지 넘기기. 너무 빨리 넘어가지 않게 0.4초 간격 제한 */
    p.mouseWheel = (e?: object) => {
      const ev = e as WheelEvent;
      if (ev.target !== canvasEl || s.phase === 'shuffle') return;
      const d = Math.abs(ev.deltaX) > Math.abs(ev.deltaY) ? ev.deltaX : ev.deltaY;
      if (Math.abs(d) > 4 && p.millis() - lastWheel > 400) {
        changePage(d > 0 ? 1 : -1);
        lastWheel = p.millis();
      }
      return false;
    };

    /** 키보드 ← → 로 페이지 넘기기 */
    p.keyPressed = () => {
      if (p.keyCode === p.LEFT_ARROW) changePage(-1);
      if (p.keyCode === p.RIGHT_ARROW) changePage(1);
    };

    // ── 동작(상태 변경) ───────────────────────────────

    /**
     * 섞기 완료: 이 순간 카드 순서와 정/역방향을 "확정"하고 저장합니다.
     * 이후로는 저장된 값만 쓰기 때문에 새로고침·이어하기를 해도 결과가 바뀌지 않습니다.
     * [AI 도움: Claude]
     */
    function finishShuffle() {
      if (s.phase !== 'shuffle') return;
      const { order, reversed } = createShuffledDeck();
      s = { ...s, phase: 'pick', order, reversed };
      dealStart = p.millis();
      emit();
    }

    /** 페이지를 d만큼(±1) 넘김 */
    function changePage(d: number) {
      page = clamp(page + d, 0, L.pages - 1);
    }

    /** 클릭(탭) 위치에 따라 화살표 / 카드 고르기 / 카드 뒤집기 중 하나를 실행 */
    function handleTap(mx: number, my: number) {
      const arrow = hitArrow(mx, my);
      if (arrow !== 0) return changePage(arrow);
      if (s.phase === 'pick') {
        const i = hitGridCard(mx, my);
        if (i >= 0) pickCard(i);
      } else if (s.phase === 'reveal') {
        const slot = hitSlot(mx, my);
        if (slot >= 0) flipCard(slot);
      }
    }

    /**
     * 깔린 카드 중 i번째를 고르는 함수.
     * 고른 순서대로 과거 → 현재 → 조언 자리에 놓이고, 이미 고른 카드는 다시 고를 수 없습니다(비복원).
     * [AI 도움: Claude]
     */
    function pickCard(i: number) {
      const id = s.order[i];
      if (s.picked.length >= 3 || s.picked.includes(id)) return;
      const pos = gridCardPos(i);
      const slot = s.picked.length;
      flights[slot] = { x: pos.x, y: pos.y, start: p.millis() };
      s.picked = [...s.picked, id];
      if (s.picked.length === 3) s.phase = 'reveal';
      emit();
    }

    /**
     * slot번째 자리(0=과거, 1=현재, 2=조언)의 카드를 뒤집는 함수. 3장 다 뒤집으면 done 단계로.
     * [AI 도움: Claude]
     */
    function flipCard(slot: number) {
      if (s.flipped[slot]) return;
      s.flipped = s.flipped.map((f, k) => (k === slot ? true : f));
      flipStarts[slot] = p.millis();
      if (s.flipped.every(Boolean)) s.phase = 'done';
      emit();
    }

    // ── 위치 계산 / 클릭 판정 ─────────────────────────

    /** i번째 깔린 카드의 현재 화면 중심 좌표 (페이지 스크롤 반영) */
    function gridCardPos(i: number) {
      const pageIdx = Math.floor(i / L.perPage);
      const inPage = i % L.perPage;
      const row = Math.floor(inPage / L.cols);
      const col = inPage % L.cols;
      return {
        x: L.gridLeft + (pageIdx - scrollPos) * L.pageStride + col * (L.cardW + L.gap) + L.cardW / 2,
        y: L.gridY + row * (L.cardH + L.gap) + L.cardH / 2,
      };
    }

    /** 마우스가 올라간 깔린 카드 번호(i)를 찾음. 없으면 -1 */
    function hitGridCard(mx: number, my: number): number {
      if (mx < L.gridLeft || mx > L.gridLeft + L.usedW) return -1;
      for (let i = 0; i < DECK_SIZE; i++) {
        if (s.picked.includes(s.order[i])) continue;
        const { x, y } = gridCardPos(i);
        if (Math.abs(mx - x) <= L.cardW / 2 && Math.abs(my - y) <= L.cardH / 2) return i;
      }
      return -1;
    }

    /** 마우스가 올라간 "뒤집을 수 있는" 자리 번호를 찾음. 없으면 -1 */
    function hitSlot(mx: number, my: number): number {
      for (let k = 0; k < 3; k++) {
        if (s.picked[k] === undefined || s.flipped[k] || isFlying(k)) continue;
        if (Math.abs(mx - L.slotXs[k]) <= L.slotW / 2 && Math.abs(my - L.slotCY) <= L.slotH / 2) return k;
      }
      return -1;
    }

    /** 좌우 화살표 위치 (페이지가 1개면 화살표 없음) */
    function arrowPos(dir: -1 | 1) {
      return {
        x: dir === -1 ? L.gridLeft - L.side / 2 : L.gridLeft + L.usedW + L.side / 2,
        y: L.gridY + L.usedH / 2,
        r: Math.min(18, L.side * 0.42),
      };
    }

    /** 화살표 클릭 판정: 왼쪽이면 -1, 오른쪽이면 1, 아니면 0 */
    function hitArrow(mx: number, my: number): number {
      if (L.pages <= 1 || s.phase === 'shuffle') return 0;
      for (const dir of [-1, 1] as const) {
        const a = arrowPos(dir);
        const enabled = dir === -1 ? page > 0 : page < L.pages - 1;
        if (enabled && p.dist(mx, my, a.x, a.y) <= a.r + 6) return dir;
      }
      return 0;
    }

    const isFlying = (k: number) => flights[k] !== null && progress(flights[k]!.start, FLY_MS) < 1;

    // ── 그리기 ───────────────────────────────────────

    /**
     * 밤하늘 배경: 성운 이미지(화면 크기로 늘려 그림) + 깜빡이는 작은 별 + 큰 반짝이는 별 ✦
     * [AI 도움: Claude]
     */
    function drawStars(now: number) {
      p.background(...PALETTE.bg);
      p.image(nebula, 0, 0, p.width, p.height);
      p.noStroke();
      for (const st of stars) {
        const a = opts.reducedMotion ? 160 : 110 + 110 * Math.sin(now * st.speed + st.phase);
        p.fill(...PALETTE.text, a);
        p.circle(st.x * p.width, st.y * p.height, st.r);
      }
      for (const sp of sparkles) {
        const a = opts.reducedMotion ? 200 : 140 + 115 * Math.sin(now * sp.speed + sp.phase);
        drawSparkle(p, sp.x * p.width, sp.y * p.height, sp.r, a);
      }
    }

    /**
     * 섞기 애니메이션: 가운데 천체 원판이 돌고, 카드 뒷면 26장이 원판 둘레를 돌며 섞임
     * (카드마다 도는 속도와 반지름이 조금씩 달라서 서로 엇갈리며 섞이는 것처럼 보임)
     * [AI 도움: Claude]
     */
    function drawShuffle(now: number) {
      const t = now - shuffleStart;
      const cx = p.width / 2;
      const cy = p.height / 2 - 20;
      const R = Math.min(p.width, p.height) * 0.26;
      drawCelestialWheel(p, cx, cy, R, opts.reducedMotion ? 0 : now);

      const n = 26;
      const size = Math.max(L.cardW * 0.9, 52);
      for (let i = 0; i < n; i++) {
        const a = t * 0.0022 * (1 + (i % 3) * 0.3) + (i * p.TWO_PI) / n;
        const r = R * (1.05 + 0.3 * Math.sin(t * 0.0025 + i * 1.7));
        p.push();
        p.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        p.rotate(a + p.HALF_PI); // 카드가 원의 바깥쪽을 향하게
        drawCardBack(p, size, size * CARD_RATIO);
        p.pop();
      }
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.fill(...PALETTE.gold);
      p.textSize(20);
      p.text('카드를 섞고 있어요…', cx, p.height - 90);
      p.fill(...PALETTE.sub);
      p.textSize(14);
      p.text('화면을 누르면 바로 섞기를 마쳐요', cx, p.height - 62);
    }

    /** 점선 빈 칸 (이미 고른 카드 자리, 아직 비어 있는 과거·현재·조언 자리) */
    function drawEmptyOutline(x: number, y: number, w: number, h: number, alpha: number) {
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      p.noFill();
      p.stroke(...PALETTE.sub, alpha);
      p.strokeWeight(1.5);
      ctx.setLineDash([6, 6]);
      p.rect(x, y, w, h, w * 0.07);
      ctx.setLineDash([]);
    }

    /** 카드 주변 은은한 금빛 (마우스를 올렸을 때) */
    function drawGlow(w: number, h: number) {
      p.noStroke();
      p.fill(...PALETTE.gold, 45);
      p.rect(0, 0, w + 14, h + 14, w * 0.12);
      p.fill(...PALETTE.gold, 70);
      p.rect(0, 0, w + 6, h + 6, w * 0.1);
    }

    /**
     * 깔린 카드 78장 그리기.
     * - 지금 보이는 페이지 근처 카드만 그려서 가볍게 유지
     * - 이미 고른 카드는 점선 빈 칸으로 표시
     * - 섞기 직후에는 가운데에서 하나씩 제자리로 날아가는 "카드 깔기" 효과
     * [AI 도움: Claude]
     */
    function drawGrid(hover: number) {
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      const clipL = L.gridLeft - 12;
      const clipR = L.gridLeft + L.usedW + 12;
      ctx.save();
      ctx.beginPath();
      ctx.rect(clipL, L.gridTop - 6, clipR - clipL, L.gridBottom - L.gridTop);
      ctx.clip(); // 카드 영역 밖(화살표 쪽)으로 삐져나온 카드는 안 보이게 자르기

      const dim = s.phase !== 'pick';
      for (let i = 0; i < DECK_SIZE; i++) {
        const pos = gridCardPos(i);
        if (pos.x + L.cardW / 2 < clipL || pos.x - L.cardW / 2 > clipR) continue;
        if (s.picked.includes(s.order[i])) {
          drawEmptyOutline(pos.x, pos.y, L.cardW, L.cardH, 60);
          continue;
        }
        const e = easeOutCubic(progress(dealStart + (i % L.perPage) * DEAL_STAGGER, DEAL_MS));
        const x = p.lerp(p.width / 2, pos.x, e);
        const y = p.lerp(L.gridBottom, pos.y, e) - (i === hover ? L.cardH * 0.07 : 0);
        p.push();
        p.translate(x, y);
        if (i === hover) drawGlow(L.cardW, L.cardH);
        drawCardBack(p, L.cardW, L.cardH);
        if (dim) {
          // 3장을 다 골랐으면 깔린 카드는 어둡게 (뒤집기에 집중)
          p.noStroke();
          p.fill(...PALETTE.bg, 150);
          p.rect(0, 0, L.cardW + 2, L.cardH + 2, L.cardW * 0.07);
        }
        p.pop();
      }
      ctx.restore();
    }

    /** 좌우 화살표 + 페이지 점(●○○) */
    function drawPager() {
      if (L.pages <= 1) return;
      for (const dir of [-1, 1] as const) {
        const a = arrowPos(dir);
        const enabled = dir === -1 ? page > 0 : page < L.pages - 1;
        p.noFill();
        p.stroke(...PALETTE.gold, enabled ? 230 : 60);
        p.strokeWeight(1.5);
        p.circle(a.x, a.y, a.r * 2);
        p.strokeWeight(2);
        const k = a.r * 0.35;
        p.line(a.x + k * 0.5 * dir, a.y - k, a.x - k * 0.5 * dir, a.y);
        p.line(a.x - k * 0.5 * dir, a.y, a.x + k * 0.5 * dir, a.y + k);
      }
      const dotY = L.gridY + L.usedH + 14;
      p.noStroke();
      for (let k = 0; k < L.pages; k++) {
        const x = p.width / 2 + (k - (L.pages - 1) / 2) * 16;
        if (k === page) p.fill(...PALETTE.gold);
        else p.fill(...PALETTE.sub, 90);
        p.circle(x, dotY, k === page ? 8 : 6);
      }
    }

    /**
     * 과거·현재·조언 자리 3개 그리기 + 뒤집기 애니메이션.
     * 뒤집기 원리: 가로 크기를 cos 곡선으로 1 → 0 → 1로 바꾸면서,
     *   가운데(0이 되는 순간)를 지나면 뒷면 대신 앞면을 그립니다 → 3D로 도는 것처럼 보임.
     * [AI 도움: Claude]
     */
    function drawSlots(hoverSlot: number) {
      drawSlotBackdrop();
      p.textAlign(p.CENTER, p.CENTER);
      for (let k = 0; k < 3; k++) {
        const x = L.slotXs[k];
        const y = L.slotCY;

        p.noStroke();
        p.fill(...PALETTE.sub);
        p.textSize(15);
        p.text(POSITION_LABELS[k], x, y - L.slotH / 2 - 16);

        const id = s.picked[k];
        if (id === undefined || isFlying(k)) {
          drawEmptyOutline(x, y, L.slotW, L.slotH, 120);
          continue;
        }

        const t = s.flipped[k] ? easeInOutCubic(progress(flipStarts[k], FLIP_MS)) : 0;
        const scaleX = Math.max(Math.abs(Math.cos(Math.PI * t)), 0.001);
        const lift = Math.sin(Math.PI * t) * L.slotH * 0.06 + (k === hoverSlot ? 6 : 0);

        p.push();
        p.translate(x, y - lift);
        if (k === hoverSlot) drawGlow(L.slotW, L.slotH);
        p.scale(scaleX, 1);
        if (t < 0.5) drawCardBack(p, L.slotW, L.slotH);
        else drawCardFront(p, DECK[id], L.slotW, L.slotH, s.reversed[id]);
        p.pop();

        // 카드 아래 글자: 뒤집기 완료 → 카드 이름 + 정/역방향, 아직이면 안내
        const textY = y + L.slotH / 2 + 16;
        p.noStroke();
        if (s.flipped[k] && t >= 1) {
          p.fill(...PALETTE.text);
          fitText(p, DECK[id].nameKo, x, textY, L.slotW + 24, 15);
          p.fill(...(s.reversed[id] ? PALETTE.sub : PALETTE.gold));
          p.textSize(13);
          p.text(s.reversed[id] ? '역방향' : '정방향', x, textY + 20);
        } else if (s.phase === 'reveal' && !s.flipped[k]) {
          p.fill(...PALETTE.sub, 200);
          p.textSize(13);
          p.text('눌러서 뒤집기', x, textY);
        }
      }
    }

    /**
     * 과거·현재·조언 자리 뒤 배경:
     *   ① 흐릿하게 도는 큰 천체 원판 (카드 영역 위로는 안 넘어가게 잘라냄)
     *   ② 고른 카드끼리 별자리처럼 금색 선으로 연결 + 선 가운데 작은 별
     * [AI 도움: Claude]
     */
    function drawSlotBackdrop() {
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, L.gridBottom, p.width, p.height - L.gridBottom);
      ctx.clip();
      ctx.globalAlpha = 0.22; // 전체를 옅게
      const R = Math.min(p.width * 0.42, (p.height - L.gridBottom) * 0.62);
      drawCelestialWheel(p, p.width / 2, L.slotCY, R, opts.reducedMotion ? 0 : p.millis());
      ctx.restore();

      const placed = s.picked.filter((_, k) => !isFlying(k)).length;
      p.stroke(...PALETTE.gold, 150);
      p.strokeWeight(1.2);
      for (let k = 0; k < placed - 1; k++) {
        p.line(L.slotXs[k], L.slotCY, L.slotXs[k + 1], L.slotCY);
      }
      for (let k = 0; k < placed - 1; k++) {
        drawSparkle(p, (L.slotXs[k] + L.slotXs[k + 1]) / 2, L.slotCY, 5, 230);
      }
    }

    /**
     * 고른 카드가 깔린 자리에서 과거·현재·조언 자리로 포물선을 그리며 날아가는 애니메이션
     * [AI 도움: Claude]
     */
    function drawFlights() {
      for (let k = 0; k < 3; k++) {
        const f = flights[k];
        if (!f) continue;
        const raw = progress(f.start, FLY_MS);
        if (raw >= 1) {
          flights[k] = null;
          continue;
        }
        const t = easeInOutCubic(raw);
        p.push();
        p.translate(p.lerp(f.x, L.slotXs[k], t), p.lerp(f.y, L.slotCY, t) - Math.sin(Math.PI * raw) * 50);
        p.rotate(Math.sin(Math.PI * raw) * 0.25);
        drawCardBack(p, p.lerp(L.cardW, L.slotW, t), p.lerp(L.cardH, L.slotH, t));
        p.pop();
      }
    }

    /** 화면 맨 아래 안내 문구 (단계별로 다름) */
    function drawHint() {
      let msg = '';
      if (s.phase === 'pick') {
        msg = `마음이 가는 카드를 ${3 - s.picked.length}장 더 골라주세요`;
        if (L.pages > 1) msg += '  ·  ◀ ▶ 또는 옆으로 밀어서 넘기기';
      } else if (s.phase === 'reveal') {
        msg = '카드를 눌러 한 장씩 뒤집어 보세요';
      } else if (s.phase === 'done') {
        msg = '세 장을 모두 확인했어요 · 해석 화면은 다음 개발 단계에서 추가됩니다';
      }
      p.noStroke();
      p.fill(...PALETTE.gold);
      p.textAlign(p.CENTER, p.CENTER);
      fitText(p, msg, p.width / 2, p.height - 20, p.width - 32, 15);
      if (s.phase === 'pick') {
        // 남은 장수를 작은 별로도 표시
        for (let k = 0; k < 3; k++) {
          p.fill(...PALETTE.gold, k < s.picked.length ? 255 : 60);
          drawStar(p, p.width / 2 + (k - 1) * 18, p.height - 44, 6, 2.5, 4);
        }
      }
    }
  };
}
