import { useMemo } from 'react';
import P5Canvas from '../../components/P5Canvas';
import { getSkyGuide } from './skyGuide';
import { createNightSkySketch } from './skySketch';
import type { ZodiacSign } from './signs';

// 담당: 김예진
// 결과 위에 "밤하늘에서 빛나는 내 별자리" + 어느 방향 하늘에서 볼 수 있는지 보여주는 컴포넌트
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 작성했습니다. (AI 사용 비율: 약 100%)

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function ZodiacSky({ sign, date }: { sign: ZodiacSign; date: string }) {
  // 별자리가 바뀔 때만 스케치를 새로 만듦 (P5Canvas 규칙: 렌더링마다 새로 만들면 안 됨)
  const sketch = useMemo(() => createNightSkySketch(sign.id, prefersReducedMotion()), [sign.id]);
  const guide = getSkyGuide(sign.id, date);

  return (
    <figure className="zodiac-sky">
      <div className="zodiac-sky-canvas" role="img" aria-label={`밤하늘에서 빛나는 ${sign.name}`}>
        <P5Canvas sketch={sketch} />
      </div>
      <figcaption className="zodiac-sky-caption">
        <span className="zodiac-eyebrow">{sign.latin}</span>
        <strong>{sign.symbol} {sign.name}</strong>
        {guide && <span className="zodiac-sky-guide">🧭 {guide}</span>}
      </figcaption>
    </figure>
  );
}
