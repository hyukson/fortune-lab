// 결과 저장용 '결과 카드' 이미지를 캔버스에 직접 그립니다. (1080 × 1620, 세로형 PNG)
// 색은 theme.css의 CSS 변수 값을 읽어서 사용 — 팀 공식 색이 바뀌면 카드 색도 같이 바뀝니다.
import type { PalmResult } from './analyzePalm';
import { LINE_INFO } from './config';
import { HAND_TYPES, INDEX_RING_INFO, readingFrame, SIDE_LABEL, THUMB_INFO, type HandChoice } from './handReading';
import { CONTINUITY_LABEL, CURVE_LABEL, LENGTH_LABEL, typeTitle } from './reading';
import { SCORE_INFO, topScore } from './scores';

const W = 1080;
const H = 1620;

type Theme = { bg: string; card: string; gold: string; text: string; sub: string; font: string; display: string };

function readTheme(): Theme {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    bg: v('--color-bg'),
    card: v('--color-card'),
    gold: v('--color-gold'),
    text: v('--color-text'),
    sub: v('--color-sub'),
    font: v('--font') || 'sans-serif',
    display: v('--font-display') || 'serif',
  };
}

/** 결과 카드 캔버스 만들기 */
export async function drawResultCard(result: PalmResult, choice: HandChoice): Promise<HTMLCanvasElement> {
  const t = readTheme();
  // 웹 폰트가 아직 안 받아졌으면 기다림 (안 기다리면 기본 글꼴로 그려짐)
  await Promise.all([
    document.fonts.load(`700 80px ${t.display}`),
    document.fonts.load(`400 30px ${t.font}`),
    document.fonts.load(`700 30px ${t.font}`),
  ]).catch(() => {});

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const font = (weight: number, size: number, family = t.font) => `${weight} ${size}px ${family}`;

  const hand = HAND_TYPES[result.handCats.type];
  const frame = readingFrame(choice);
  const best = topScore(result.scores);
  const lineCats = Object.fromEntries(result.lines.filter((l) => l.cats).map((l) => [l.key, l.cats!]));

  // ── 배경 + 별 ──
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);
  let seed = 7; // 항상 같은 별 배치
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  ctx.fillStyle = t.text;
  for (let i = 0; i < 90; i++) {
    ctx.globalAlpha = 0.15 + rand() * 0.45;
    ctx.beginPath();
    ctx.arc(rand() * W, rand() * H, 0.6 + rand() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ── 머리말 ──
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = t.gold;
  ctx.font = font(700, 30, t.display);
  ctx.fillText('운세연구소 · 손금', W / 2, 92);
  ctx.fillStyle = t.sub;
  ctx.font = font(400, 28);
  ctx.fillText(`${SIDE_LABEL[choice.side]} · ${frame.title} (${frame.short})`, W / 2, 142);

  // 대표 유형: 기호 원 + 이름
  ctx.font = font(700, 86, t.display);
  const nameW = ctx.measureText(hand.name).width;
  const circleR = 54;
  const groupW = circleR * 2 + 26 + nameW;
  const gx = (W - groupW) / 2;
  const cy = 240;
  ctx.fillStyle = t.card;
  ctx.strokeStyle = t.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(gx + circleR, cy, circleR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = t.gold;
  ctx.textBaseline = 'middle';
  ctx.font = font(700, 60, t.display);
  ctx.fillText(hand.symbol, gx + circleR, cy + 3);
  ctx.textAlign = 'left';
  ctx.font = font(700, 86, t.display);
  ctx.fillText(hand.name, gx + circleR * 2 + 26, cy + 4);

  ctx.textAlign = 'center';
  ctx.fillStyle = t.text;
  ctx.font = font(700, 38);
  ctx.fillText(typeTitle(lineCats), W / 2, 344);

  // 가장 높은 지표 알약
  const pill = `${SCORE_INFO[best.key].name}이 가장 돋보이는 손이에요`;
  ctx.font = font(700, 28);
  const pw = ctx.measureText(pill).width + 56;
  roundRect(ctx, (W - pw) / 2, 380, pw, 54, 27);
  ctx.fillStyle = t.card;
  ctx.fill();
  ctx.fillStyle = t.gold;
  ctx.fillText(pill, W / 2, 408);

  // ── 가운데: 사진 + 손금 / 레이더 차트 ──
  const panelY = 470;
  const panelH = 620;
  roundRect(ctx, 50, panelY, W - 100, panelH, 28);
  ctx.fillStyle = t.card;
  ctx.fill();

  drawPhoto(ctx, result, t, { x: 80, y: panelY + 30, w: 470, h: panelH - 60 });
  drawRadar(ctx, result, t, { cx: 800, cy: panelY + panelH / 2 + 6, r: 168 }, font);

  // ── 아래: 선별 판정 + 손 모양 ──
  const listY = 1130;
  roundRect(ctx, 50, listY, W - 100, 380, 28);
  ctx.fillStyle = t.card;
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const rowX = 96;
  let y = listY + 58;
  for (const line of result.lines) {
    ctx.fillStyle = rgb(LINE_INFO[line.key].rgb);
    ctx.beginPath();
    ctx.arc(rowX + 9, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = t.text;
    ctx.font = font(700, 32);
    ctx.fillText(LINE_INFO[line.key].name, rowX + 34, y);
    ctx.fillStyle = t.sub;
    ctx.font = font(400, 29);
    const desc = line.cats
      ? `길이 ${LENGTH_LABEL[line.cats.length]} · ${CURVE_LABEL[line.cats.curve]} · ${CONTINUITY_LABEL[line.cats.continuity]}`
      : '사진에서 찾지 못했어요';
    ctx.fillText(desc, rowX + 190, y);
    y += 62;
  }
  // 구분선
  ctx.strokeStyle = t.sub;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rowX, y - 22);
  ctx.lineTo(W - rowX, y - 22);
  ctx.stroke();
  ctx.globalAlpha = 1;
  y += 20;
  const rows: [string, string][] = [
    ['손 모양', `${hand.name} · ${hand.palm} · ${hand.fingers}`],
    ['손가락', `${INDEX_RING_INFO[result.handCats.indexRing].name} · ${THUMB_INFO[result.handCats.thumb].name}`],
  ];
  for (const [label, value] of rows) {
    ctx.fillStyle = t.gold;
    ctx.font = font(700, 30);
    ctx.fillText(label, rowX, y);
    ctx.fillStyle = t.text;
    ctx.font = font(400, 29);
    ctx.fillText(value, rowX + 190, y);
    y += 58;
  }

  // ── 꼬리말 ──
  ctx.textAlign = 'center';
  ctx.fillStyle = t.sub;
  ctx.font = font(400, 24);
  ctx.fillText('엔터테인먼트 목적의 콘텐츠입니다 · hyukson.github.io/fortune-lab', W / 2, H - 56);

  return canvas;
}

// 사진을 상자 안에 비율 유지해 넣고, 그 위에 찾은 손금을 그림
function drawPhoto(
  ctx: CanvasRenderingContext2D,
  result: PalmResult,
  t: Theme,
  box: { x: number; y: number; w: number; h: number },
) {
  const img = result.image;
  const s = Math.min(box.w / img.width, box.h / img.height);
  const w = img.width * s;
  const h = img.height * s;
  const x = box.x + (box.w - w) / 2;
  const y = box.y + (box.h - h) / 2;

  ctx.save();
  roundRect(ctx, x, y, w, h, 20);
  ctx.clip();
  ctx.drawImage(img, x, y, w, h);
  ctx.fillStyle = t.bg;
  ctx.globalAlpha = 0.35; // 선이 잘 보이도록 살짝 어둡게
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const line of result.lines) {
    if (!line.found) continue;
    for (const [width, color, alpha] of [
      [11, t.bg, 0.8],
      [5.5, rgb(LINE_INFO[line.key].rgb), 1],
    ] as const) {
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = width;
      for (const path of line.paths) {
        if (path.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(x + path[0].x * s, y + path[0].y * s);
        for (const p of path) ctx.lineTo(x + p.x * s, y + p.y * s);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function drawRadar(
  ctx: CanvasRenderingContext2D,
  result: PalmResult,
  t: Theme,
  { cx, cy, r }: { cx: number; cy: number; r: number },
  font: (weight: number, size: number, family?: string) => string,
) {
  const scores = result.scores;
  const n = scores.length;
  const pt = (i: number, rr: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return { x: cx + rr * Math.cos(a), y: cy + rr * Math.sin(a) };
  };
  const poly = (rr: (i: number) => number) => {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p = pt(i, rr(i));
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
  };

  ctx.strokeStyle = t.sub;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 1.5;
  for (const v of [0.25, 0.5, 0.75, 1]) {
    poly(() => r * v);
    ctx.stroke();
  }
  for (let i = 0; i < n; i++) {
    const p = pt(i, r);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  poly((i) => (r * scores[i].value) / 100);
  ctx.fillStyle = t.gold;
  ctx.globalAlpha = 0.28;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = t.gold;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < n; i++) {
    const p = pt(i, r + 54);
    ctx.fillStyle = t.sub;
    ctx.font = font(400, 26);
    ctx.fillText(SCORE_INFO[scores[i].key].short, p.x, p.y - 16);
    ctx.fillStyle = t.text;
    ctx.font = font(700, 30);
    ctx.fillText(String(scores[i].value), p.x, p.y + 18);
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const rgb = ([r, g, b]: readonly [number, number, number]) => `rgb(${r}, ${g}, ${b})`;

/** 캔버스 → PNG 파일 */
export function canvasToFile(canvas: HTMLCanvasElement, name: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(new File([blob], name, { type: 'image/png' })) : reject(new Error('이미지 변환 실패'))), 'image/png');
  });
}
