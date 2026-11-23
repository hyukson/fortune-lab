// 분석 중 화면: 사진 위로 스캔 빛이 지나가고, 단계별 체크리스트가 채워짐
import { useMemo } from 'react';
import { ANALYZE_STAGES } from '../analyzePalm';
import PalmGuide from './PalmGuide';

type Props = {
  image: HTMLCanvasElement | null; // 사진을 읽는 중이면 null
  stage: number;                   // 지금 진행 중인 단계 (ANALYZE_STAGES 번호, 끝나면 길이와 같음)
};

export default function ScanStep({ image, stage }: Props) {
  // 캔버스 → 이미지 주소 (사진이 바뀔 때만 다시 만듦)
  const src = useMemo(() => (image ? image.toDataURL('image/jpeg', 0.85) : ''), [image]);

  return (
    <section className="palm-step palm-scan">
      <div className="palm-frame palm-scan-frame">
        {src ? <img className="palm-photo" src={src} alt="분석 중인 손바닥 사진" /> : <PalmGuide className="palm-scan-guide" />}
        <div className="palm-scan-beam" aria-hidden="true" />
      </div>

      <h2 className="palm-headline">손금을 읽고 있어요</h2>
      <ol className="palm-checklist" aria-live="polite">
        {ANALYZE_STAGES.map((label, i) => (
          <li key={label} className={i < stage ? 'is-done' : i === stage ? 'is-now' : ''}>
            <span className="palm-check" aria-hidden="true" />
            {label}
          </li>
        ))}
      </ol>
      <p className="palm-fineprint">처음에는 모델을 내려받느라 10초쯤 걸릴 수 있어요.</p>
    </section>
  );
}
