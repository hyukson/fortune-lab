// 결과 영역 → PNG 이미지 만들기 (DownloadButton에서 사용)
//
// html-to-image를 그대로 쓰면 생기는 문제 두 가지를 여기서 보완합니다.
//  1) 웹 폰트: 기본 동작은 사이트의 모든 글꼴 파일(Pretendard 조각 300여 개)을 받아서 10초 이상 걸림
//     → 결과 영역에 실제로 쓰인 글자가 들어 있는 글꼴 조각만 골라 넣음 (보통 10~30개, 한 번 받으면 재사용)
//  2) SVG 그래프: CSS 클래스로 준 색(fill/stroke)이 빠져서 검게 나옴
//     → 저장하는 동안만 SVG 요소에 계산된 색을 직접 써 넣었다가 원래대로 되돌림

type FontFace = { family: string; css: string; url: string; base: string; ranges: [number, number][] | null };

const SVG_PROPS = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'opacity',
  'font-family',
  'font-size',
  'font-weight',
  'letter-spacing',
  'text-anchor',
  'dominant-baseline',
];

const sheetTextCache = new Map<string, Promise<string>>();
const fontDataCache = new Map<string, Promise<string>>();

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// ── 1. 웹 폰트 ──────────────────────────────────────────────

function fetchText(href: string): Promise<string> {
  if (!sheetTextCache.has(href)) {
    sheetTextCache.set(
      href,
      fetch(href)
        .then((r) => (r.ok ? r.text() : ''))
        .catch(() => ''),
    );
  }
  return sheetTextCache.get(href)!;
}

// 스타일시트에서 @font-face 글을 모음. @import로 불러온 시트(예: 별자리의 구글 폰트)까지 따라감
async function sheetTexts(sheet: CSSStyleSheet): Promise<{ text: string; base: string }[]> {
  const base = sheet.href ?? location.href;
  let rules: CSSRule[];
  try {
    rules = Array.from(sheet.cssRules);
  } catch {
    // 다른 도메인(구글 폰트, jsdelivr) 스타일시트는 직접 받아서 읽음
    return [{ text: await fetchText(sheet.href!), base }];
  }
  const out = [{ text: rules.map((r) => r.cssText).join('\n'), base }];
  for (const rule of rules) {
    if (rule instanceof CSSImportRule) {
      if (rule.styleSheet) out.push(...(await sheetTexts(rule.styleSheet)));
      else out.push({ text: await fetchText(new URL(rule.href, base).href), base: new URL(rule.href, base).href });
    }
  }
  return out;
}

function parseRanges(value: string | undefined): [number, number][] | null {
  if (!value) return null;
  return value.split(',').map((part) => {
    const v = part.trim().replace(/^U\+/i, '');
    if (v.includes('-')) {
      const [a, b] = v.split('-');
      return [parseInt(a, 16), parseInt(b, 16)];
    }
    return [parseInt(v.replace(/\?/g, '0'), 16), parseInt(v.replace(/\?/g, 'F'), 16)];
  });
}

const cleanFamily = (f: string) => f.trim().replace(/^['"]|['"]$/g, '').toLowerCase();

async function collectFontFaces(): Promise<FontFace[]> {
  const faces: FontFace[] = [];
  const seen = new Set<string>();
  for (const sheet of Array.from(document.styleSheets)) {
    for (const { text, base } of await sheetTexts(sheet)) {
    for (const block of text.match(/@font-face\s*{[^}]*}/g) ?? []) {
      const family = /font-family:\s*([^;]+);?/.exec(block)?.[1];
      const url = /url\(\s*['"]?([^'")]+)['"]?\s*\)/.exec(block)?.[1];
      if (!family || !url || seen.has(block)) continue;
      seen.add(block);
      faces.push({
        family: cleanFamily(family),
        css: block,
        url,
        base,
        ranges: parseRanges(/unicode-range:\s*([^;}]+)/.exec(block)?.[1]),
      });
    }
    }
  }
  return faces;
}

function toDataUrl(url: string): Promise<string> {
  if (!fontDataCache.has(url)) {
    fontDataCache.set(
      url,
      fetch(url)
        .then((r) => r.blob())
        .then(
          (blob) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            }),
        ),
    );
  }
  return fontDataCache.get(url)!;
}

// 결과 영역에서 쓰인 글꼴 이름과 글자만 골라서 필요한 @font-face만 만들어 줌
async function buildFontCss(target: HTMLElement): Promise<string> {
  const families = new Set<string>();
  for (const el of [target, ...Array.from(target.querySelectorAll<Element>('*'))]) {
    getComputedStyle(el)
      .fontFamily.split(',')
      .forEach((f) => families.add(cleanFamily(f)));
  }
  const codes = new Set<number>();
  for (const ch of target.textContent ?? '') codes.add(ch.codePointAt(0)!);

  const faces = (await collectFontFaces()).filter(
    (f) => families.has(f.family) && (!f.ranges || f.ranges.some(([a, b]) => [...codes].some((c) => c >= a && c <= b))),
  );
  const blocks = await Promise.all(
    faces.map(async (f) => {
      try {
        const abs = new URL(f.url, f.base).href;
        return f.css.replace(f.url, await toDataUrl(abs));
      } catch {
        return '';
      }
    }),
  );
  return blocks.join('\n');
}

// ── 2. SVG 색 ───────────────────────────────────────────────

function inlineSvgStyles(target: HTMLElement): () => void {
  const saved: [Element, string | null][] = [];
  target.querySelectorAll('svg *').forEach((el) => {
    const cs = getComputedStyle(el);
    saved.push([el, el.getAttribute('style')]);
    const extra = SVG_PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';');
    el.setAttribute('style', `${el.getAttribute('style') ?? ''};${extra}`);
  });
  return () =>
    saved.forEach(([el, style]) => (style === null ? el.removeAttribute('style') : el.setAttribute('style', style)));
}

// ── 3. 이미지 만들기 ────────────────────────────────────────

const PAD = 28; // 결과 영역 바깥 여백 (CSS px)
const FOOTER = 52; // 아래 사이트 이름 영역

export async function captureElement(target: HTMLElement): Promise<Blob> {
  const { toCanvas } = await import('html-to-image'); // 버튼을 눌렀을 때만 불러옴
  await document.fonts?.ready;

  const ratio = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  const bg = cssVar('--color-bg');
  const filter = (node: HTMLElement) => !(node instanceof HTMLElement && node.dataset.downloadIgnore !== undefined);

  let fontEmbedCSS = '';
  try {
    fontEmbedCSS = await buildFontCss(target);
  } catch {
    // 글꼴을 못 넣어도 저장은 되게 (기본 글꼴로 나옴)
  }

  const restore = inlineSvgStyles(target);
  let shot: HTMLCanvasElement;
  try {
    shot = await toCanvas(target, {
      pixelRatio: ratio,
      backgroundColor: bg,
      style: { margin: '0' },
      filter,
      ...(fontEmbedCSS ? { fontEmbedCSS } : { skipFonts: true }),
    });
  } finally {
    restore();
  }

  // 여백 + 아래쪽 사이트 이름을 붙여서 최종 이미지로
  const out = document.createElement('canvas');
  out.width = shot.width + PAD * 2 * ratio;
  out.height = shot.height + (PAD * 2 + FOOTER) * ratio;
  const ctx = out.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(shot, PAD * ratio, PAD * ratio);

  const y = out.height - (PAD / 2 + FOOTER / 2) * ratio;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = cssVar('--color-gold');
  ctx.font = `700 ${15 * ratio}px ${cssVar('--font-display') || 'serif'}`;
  ctx.fillText('운세연구소', out.width / 2, y - 8 * ratio);
  ctx.fillStyle = cssVar('--color-sub');
  ctx.font = `${11 * ratio}px ${cssVar('--font') || 'sans-serif'}`;
  ctx.fillText('hyukson.github.io/fortune-lab · 엔터테인먼트 목적의 콘텐츠입니다', out.width / 2, y + 12 * ratio);

  return new Promise((resolve, reject) =>
    out.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  );
}
