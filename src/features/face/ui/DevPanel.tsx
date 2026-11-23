import type { ReactNode } from 'react';

// 개발 모드(npm run dev)에서만 보이는 측정값 표 → config.ts 기준값을 보정할 때 사용
// 배포 버전에서는 자동으로 숨겨집니다.
type Props = { data: object; children?: ReactNode };

export default function DevPanel({ data, children }: Props) {
  if (!import.meta.env.DEV) return null;

  const rows: [string, number][] = [];
  const walk = (obj: object, prefix: string) => {
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'number') rows.push([prefix + k, v]);
      else if (v && typeof v === 'object') walk(v, `${prefix}${k}.`);
    }
  };
  walk(data, '');

  return (
    <details className="face-dev">
      <summary>개발용 측정값</summary>
      {children}
      <table>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td>{k}</td>
              <td>{v.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
