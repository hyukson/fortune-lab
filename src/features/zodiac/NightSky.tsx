import { useMemo } from 'react';
import P5Canvas from '../../components/P5Canvas';
import { createNightSkySketch } from './skySketch';
import type { ZodiacSign } from './signs';

// 담당: 김예진
// 결과 아래에 "밤하늘에서 빛나는 내 별자리"를 보여주는 컴포넌트
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 작성했습니다. (AI 사용 비율: 약 100%)

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function NightSky({ sign }: { sign: ZodiacSign }) {
  // 별자리가 바뀔 때만 스케치를 새로 만듦 (P5Canvas 규칙: 렌더링마다 새로 만들면 안 됨)
  const sketch = useMemo(() => createNightSkySketch(sign.id, prefersReducedMotion()), [sign.id]);

  return (
    <figure className="zodiac-sky">
      <div className="zodiac-sky-canvas" role="img" aria-label={`밤하늘에서 빛나는 ${sign.name}`}>
        <P5Canvas sketch={sketch} />
      </div>
      <figcaption className="zodiac-sky-caption">
        <span className="zodiac-eyebrow">{sign.latin}</span>
        <strong>{sign.symbol} 오늘 밤, 당신의 {sign.name}가 빛나고 있어요</strong>
      </figcaption>
    </figure>
  );
}
