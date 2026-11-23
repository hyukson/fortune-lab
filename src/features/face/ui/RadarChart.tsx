import type { Reading } from '../types';

// 운세 지표 5각형 그래프 (SVG로 직접 그림)
type Props = { scores: Reading['scores'] };

const SIZE = 300;
const CENTER = SIZE / 2;
const RADIUS = 92;
const FLOOR = 40; // 이 점수를 그래프 중심으로 둬서 차이가 잘 보이게 함

export default function RadarChart({ scores }: Props) {
  const angle = (i: number) => (Math.PI * 2 * i) / scores.length - Math.PI / 2;
  const at = (i: number, r: number) => [CENTER + Math.cos(angle(i)) * r, CENTER + Math.sin(angle(i)) * r];
  const ring = (ratio: number) => scores.map((_, i) => at(i, RADIUS * ratio).join(',')).join(' ');
  const shape = scores
    .map((s, i) => at(i, (RADIUS * (s.score - FLOOR)) / (100 - FLOOR)).join(','))
    .join(' ');

  return (
    <svg className="face-radar" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="운세 지표 그래프">
      {[1, 0.66, 0.33].map((r) => (
        <polygon key={r} className="face-radar-ring" points={ring(r)} />
      ))}
      {scores.map((_, i) => {
        const [x, y] = at(i, RADIUS);
        return <line key={i} className="face-radar-ring" x1={CENTER} y1={CENTER} x2={x} y2={y} />;
      })}
      <polygon className="face-radar-shape" points={shape} />
      {scores.map((s, i) => {
        const [x, y] = at(i, (RADIUS * (s.score - FLOOR)) / (100 - FLOOR));
        const [lx, ly] = at(i, RADIUS + 30);
        return (
          <g key={s.key}>
            <circle className="face-radar-dot" cx={x} cy={y} r="3.5" />
            <text className="face-radar-label" x={lx} y={ly - 4} textAnchor="middle">{s.label}</text>
            <text className="face-radar-score" x={lx} y={ly + 14} textAnchor="middle">{s.score}</text>
          </g>
        );
      })}
    </svg>
  );
}
