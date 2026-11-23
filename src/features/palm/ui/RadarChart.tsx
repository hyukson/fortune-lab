// 운세 지표 레이더 차트 (SVG — 색은 palm.css에서 theme.css 변수로 지정)
import { SCORE_INFO, type Score } from '../scores';

type Props = { scores: Score[] };

const SIZE = 260;
const C = SIZE / 2;
const R = 88; // 100점일 때 반지름

function point(i: number, n: number, r: number) {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n; // 12시 방향부터 시계 방향
  return { x: C + r * Math.cos(angle), y: C + r * Math.sin(angle) };
}

const toPoints = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

export default function RadarChart({ scores }: Props) {
  const n = scores.length;
  const label = scores.map((s) => `${SCORE_INFO[s.key].name} ${s.value}점`).join(', ');

  return (
    <svg className="palm-radar" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`운세 지표: ${label}`}>
      {[25, 50, 75, 100].map((v) => (
        <polygon
          key={v}
          className="palm-radar-ring"
          points={toPoints(scores.map((_, i) => point(i, n, (R * v) / 100)))}
        />
      ))}
      {scores.map((_, i) => {
        const p = point(i, n, R);
        return <line key={i} className="palm-radar-axis" x1={C} y1={C} x2={p.x} y2={p.y} />;
      })}
      <polygon className="palm-radar-shape" points={toPoints(scores.map((s, i) => point(i, n, (R * s.value) / 100)))} />
      {scores.map((s, i) => {
        const p = point(i, n, (R * s.value) / 100);
        return <circle key={s.key} className="palm-radar-dot" cx={p.x} cy={p.y} r={3.5} />;
      })}
      {scores.map((s, i) => {
        const p = point(i, n, R + 24);
        return (
          <text key={s.key} className="palm-radar-label" x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle">
            <tspan x={p.x} dy="-0.5em">{SCORE_INFO[s.key].short}</tspan>
            <tspan x={p.x} dy="1.2em" className="palm-radar-value">{s.value}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
