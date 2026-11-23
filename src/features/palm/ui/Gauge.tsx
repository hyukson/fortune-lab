// 측정값이 기준표의 어느 구간에 있는지 보여 주는 막대 (예: 짧음 | 보통 | 김)
type Props = {
  value: number;
  cuts: number[];   // 구간 경계값 (오름차순)
  labels: string[]; // 구간 이름 (cuts.length + 1개)
  active: number;   // 내 값이 속한 구간 번호
  caption: string;  // 막대 위 설명 (예: "손바닥 길이 ÷ 너비")
};

export default function Gauge({ value, cuts, labels, active, caption }: Props) {
  // 양 끝 여유: 경계값 사이 간격만큼 바깥으로
  const span = cuts.length > 1 ? cuts[cuts.length - 1] - cuts[0] : cuts[0] * 0.25;
  const min = cuts[0] - span;
  const max = cuts[cuts.length - 1] + span;
  const pos = (v: number) => Math.max(0, Math.min(1, (v - min) / (max - min))) * 100;
  const edges = [0, ...cuts.map(pos), 100];
  const zoneStyle = (i: number) => ({ left: `${edges[i]}%`, width: `${edges[i + 1] - edges[i]}%` });

  return (
    <div className="palm-gauge" role="img" aria-label={`${caption} ${value.toFixed(2)}, ${labels[active]}`}>
      <div className="palm-gauge-head">
        <span>{caption}</span>
        <b>{value.toFixed(2)}</b>
      </div>
      <div className="palm-gauge-bar">
        {labels.map((label, i) => (
          <span key={label} className={`palm-gauge-zone${i === active ? ' is-on' : ''}`} style={zoneStyle(i)} />
        ))}
        <span className="palm-gauge-marker" style={{ left: `${pos(value)}%` }} />
      </div>
      <div className="palm-gauge-labels">
        {labels.map((label, i) => (
          <span key={label} className={i === active ? 'is-on' : ''} style={zoneStyle(i)}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
