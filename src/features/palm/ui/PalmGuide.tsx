// 손바닥 그림 (안내 화면 일러스트 · 카메라 가이드 공용 SVG)
// 손가락·손바닥 도형을 겹친 뒤 바깥 테두리만 남기는 방식이라, 배경이 비쳐 보여도 테두리가 깔끔하게 나와요.
import { useId } from 'react';

type Props = {
  lines?: boolean;   // 손금 3대 선 표시 (안내 화면)
  flip?: boolean;    // 좌우 반전 (엄지가 왼쪽에 오게)
  className?: string;
};

// viewBox 0 0 200 260 기준 도형 (오른손 손바닥을 본 모습: 엄지가 오른쪽)
const SHAPES = (
  <>
    <rect x="50" y="108" width="106" height="118" rx="34" />
    <rect x="72" y="196" width="64" height="80" rx="20" />
    <rect x="53" y="62" width="19" height="74" rx="9.5" transform="rotate(-12 62 128)" />
    <rect x="75" y="36" width="22" height="96" rx="11" transform="rotate(-4 86 122)" />
    <rect x="101" y="28" width="22" height="102" rx="11" />
    <rect x="127" y="42" width="22" height="92" rx="11" transform="rotate(6 138 122)" />
    <rect x="144" y="128" width="26" height="80" rx="13" transform="rotate(24 157 208)" />
  </>
);

export default function PalmGuide({ lines = false, flip = false, className = '' }: Props) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={`palm-guide ${className}`} viewBox="0 0 200 260" aria-hidden="true">
      <g transform={flip ? 'translate(200 0) scale(-1 1)' : undefined}>
      <defs>
        <mask id={`palm-mask-${id}`} maskUnits="userSpaceOnUse" x="-20" y="-20" width="240" height="300">
          <rect x="-20" y="-20" width="240" height="300" fill="white" />
          <g fill="black">{SHAPES}</g>
        </mask>
      </defs>
      {/* 도형마다 굵은 테두리를 그린 뒤, 안쪽을 가려서 바깥 테두리만 남김 */}
      <g className="palm-guide-outline" mask={`url(#palm-mask-${id})`}>
        {SHAPES}
      </g>
      {lines && (
        <g className="palm-guide-lines">
          <path className="palm-guide-line palm-guide-line--heart" d="M56 146 Q92 128 132 128" pathLength={1} />
          <path className="palm-guide-line palm-guide-line--head" d="M150 152 Q112 158 70 176" pathLength={1} />
          <path className="palm-guide-line palm-guide-line--life" d="M148 154 Q108 186 118 238" pathLength={1} />
        </g>
      )}
      </g>
    </svg>
  );
}
