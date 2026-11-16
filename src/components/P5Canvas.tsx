import { useEffect, useRef } from 'react';
import type p5 from 'p5';

// React 안에서 p5.js를 쓰기 위한 공통 컴포넌트 (instance mode)
// 사용 예)
//   const sketch = (p: p5) => {
//     p.setup = () => { p.createCanvas(400, 400); };
//     p.draw = () => { p.background(36, 24, 46); };
//   };
//   <P5Canvas sketch={sketch} />
// ⚠️ sketch 함수는 컴포넌트 바깥에 선언하세요 (안에 두면 렌더링마다 캔버스가 새로 만들어집니다).
type Props = {
  sketch: (p: p5) => void;
};

export default function P5Canvas({ sketch }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let instance: p5 | undefined;
    let cancelled = false;

    // p5는 용량이 커서 필요할 때만 불러옵니다.
    import('p5').then(({ default: P5 }) => {
      if (cancelled || !containerRef.current) return;
      instance = new P5(sketch, containerRef.current);
    });

    return () => {
      cancelled = true;
      instance?.remove(); // 페이지 이동 시 캔버스 정리
    };
  }, [sketch]);

  return <div ref={containerRef} />;
}
