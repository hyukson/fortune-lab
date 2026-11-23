import { useEffect, useRef } from 'react';

// 사이트 공통 배경: 반짝이는 별 + 천천히 나타났다 사라지는 별자리 + 가끔 별똥별
// - 메인 페이지: <StarField />  (별자리까지 전부)
// - 기능 페이지: <StarField subtle />  (PageLayout이 자동으로 깔아줌. 별만 더 희미하게)
// p5는 용량이 커서(약 1MB) 브라우저 기본 캔버스로만 그립니다.
// 색은 theme.css 변수를 읽어서 씁니다 (HEX 직접 사용 X).

type RGB = [number, number, number];
type Star = { x: number; y: number; r: number; base: number; speed: number; phase: number; depth: number; gold: boolean };
type Constellation = { pts: [number, number][]; lines: [number, number][]; x: number; y: number; scale: number; start: number };
type Meteor = { x: number; y: number; vx: number; vy: number; life: number };

// 실제 별자리 모양 (0~1 좌표)
const SHAPES: Pick<Constellation, 'pts' | 'lines'>[] = [
  // 북두칠성
  { pts: [[0, 0.3], [0.17, 0.25], [0.32, 0.3], [0.45, 0.4], [0.5, 0.65], [0.75, 0.7], [0.8, 0.42]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
  // 카시오페이아
  { pts: [[0, 0.2], [0.22, 0.55], [0.45, 0.3], [0.68, 0.6], [0.9, 0.15]], lines: [[0, 1], [1, 2], [2, 3], [3, 4]] },
  // 오리온
  { pts: [[0.2, 0], [0.75, 0.08], [0.4, 0.45], [0.48, 0.48], [0.56, 0.51], [0.15, 0.95], [0.8, 0.9]], lines: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]] },
  // 백조자리
  { pts: [[0.5, 0], [0.5, 0.35], [0.5, 0.65], [0.5, 1], [0.1, 0.3], [0.9, 0.42]], lines: [[0, 1], [1, 2], [2, 3], [4, 1], [1, 5]] },
  // 사자자리
  { pts: [[0.1, 0.1], [0.25, 0.05], [0.35, 0.2], [0.3, 0.45], [0.55, 0.55], [0.9, 0.5], [0.75, 0.85], [0.3, 0.8]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 3]] },
];
const CONST_LIFE = 14000; // 별자리 하나가 나타났다 사라지는 시간(ms)

function cssColor(name: string, fallback: RGB): RGB {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const m = /^#?([0-9a-f]{6})$/i.exec(v);
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgba = ([r, g, b]: RGB, a: number) => `rgba(${r},${g},${b},${a})`;

export default function StarField({ subtle = false }: { subtle?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const TEXT = cssColor('--color-text', [247, 238, 223]);
    const GOLD = cssColor('--color-gold', [235, 196, 123]);
    const SUB = cssColor('--color-sub', [201, 181, 211]);
    const dim = subtle ? 0.55 : 1; // 기능 페이지에서는 내용이 잘 보이게 희미하게

    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let constellations: Constellation[] = [];
    let meteor: Meteor | null = null;
    let nextMeteor = performance.now() + 4000;
    let shapeIdx = Math.floor(Math.random() * SHAPES.length);
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let raf = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((w * h) / (subtle ? 8000 : 5000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() ** 3 * 1.4 + 0.3,
        base: Math.random() * 0.5 + 0.2,
        speed: Math.random() * 1.5 + 0.5,
        phase: Math.random() * Math.PI * 2,
        depth: Math.random() * 0.8 + 0.2,
        gold: Math.random() < 0.12,
      }));
    }

    function spawnConstellation(now: number) {
      const shape = SHAPES[shapeIdx++ % SHAPES.length];
      const scale = Math.min(w, h) * (0.18 + Math.random() * 0.08);
      // 가운데(로고·카드)를 피해서 가장자리 쪽에 배치
      const side = Math.random() < 0.5;
      const x = side ? Math.random() * (w * 0.22) : w * 0.78 - scale + Math.random() * (w * 0.22);
      const y = Math.random() * Math.max(1, h - scale);
      constellations.push({ ...shape, x: Math.max(8, x), y, scale, start: now });
    }

    function draw(now: number) {
      ctx.clearRect(0, 0, w, h);
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      const t = now / 1000;

      // 별
      for (const s of stars) {
        const tw = reduced ? 1 : 0.6 + 0.4 * Math.sin(t * s.speed + s.phase);
        const x = s.x + mouse.x * s.depth * 14;
        const y = s.y + mouse.y * s.depth * 14;
        ctx.fillStyle = rgba(s.gold ? GOLD : TEXT, s.base * tw * dim);
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.r > 1.2) {
          ctx.fillStyle = rgba(s.gold ? GOLD : TEXT, 0.06 * tw * dim);
          ctx.beginPath();
          ctx.arc(x, y, s.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 별자리: 선이 그어지며 나타났다가 서서히 사라짐
      constellations = constellations.filter((c) => now - c.start < CONST_LIFE);
      if (!subtle && constellations.length < 2 && (constellations.length === 0 || now - constellations[0].start > CONST_LIFE / 2)) {
        spawnConstellation(now);
      }
      for (const c of constellations) {
        const k = (now - c.start) / CONST_LIFE;
        const alpha = Math.min(1, k * 5, (1 - k) * 4);
        const drawn = Math.min(1, k * 3); // 선이 그어지는 진행도
        const ox = c.x + mouse.x * 6;
        const oy = c.y + mouse.y * 6;
        const P = c.pts.map(([px, py]) => [ox + px * c.scale, oy + py * c.scale]);
        ctx.strokeStyle = rgba(SUB, 0.22 * alpha);
        ctx.lineWidth = 0.8;
        c.lines.forEach(([a, b], i) => {
          const seg = Math.max(0, Math.min(1, drawn * c.lines.length - i));
          if (seg <= 0) return;
          ctx.beginPath();
          ctx.moveTo(P[a][0], P[a][1]);
          ctx.lineTo(P[a][0] + (P[b][0] - P[a][0]) * seg, P[a][1] + (P[b][1] - P[a][1]) * seg);
          ctx.stroke();
        });
        for (const [px, py] of P) {
          ctx.fillStyle = rgba(GOLD, 0.12 * alpha);
          ctx.beginPath();
          ctx.arc(px, py, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = rgba(GOLD, 0.75 * alpha);
          ctx.beginPath();
          ctx.arc(px, py, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 별똥별 (6~14초마다)
      if (!meteor && now > nextMeteor) {
        const speed = 9 + Math.random() * 5;
        const ang = Math.PI * (0.15 + Math.random() * 0.15);
        meteor = { x: Math.random() * w * 0.8, y: Math.random() * h * 0.3, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, life: 1 };
        nextMeteor = now + (subtle ? 14000 : 6000) + Math.random() * 8000;
      }
      if (meteor) {
        const m = meteor;
        const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 10, m.y - m.vy * 10);
        grad.addColorStop(0, rgba(TEXT, 0.8 * m.life * dim));
        grad.addColorStop(1, rgba(TEXT, 0));
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * 10, m.y - m.vy * 10);
        ctx.stroke();
        m.x += m.vx;
        m.y += m.vy;
        m.life -= 0.018;
        if (m.life <= 0 || m.x > w + 100 || m.y > h + 100) meteor = null;
      }

      if (!reduced) raf = requestAnimationFrame(draw);
    }

    const onMove = (e: PointerEvent) => {
      mouse.tx = e.clientX / w - 0.5;
      mouse.ty = e.clientY / h - 0.5;
    };
    const onResize = () => {
      resize();
      if (reduced) draw(performance.now());
    };

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return <canvas ref={ref} className="site-stars" aria-hidden="true" />;
}
