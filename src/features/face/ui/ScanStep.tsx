import { useEffect, useState } from 'react';
import type { Analysis } from '../types';
import FaceCanvas, { SCAN_SECONDS } from './FaceCanvas';
import Photo from './Photo';

// 분석 중 화면
//  - analysis가 아직 없으면: 사진 위로 빛이 훑는 대기 연출
//  - analysis가 오면: 실제 검출된 특징점으로 스캔 연출을 재생한 뒤 onDone
type Props = {
  image: HTMLCanvasElement | null;
  analysis: Extract<Analysis, { ok: true }> | null;
  onDone: () => void;
};

const CAPTIONS = [
  '얼굴 윤곽을 읽고 있어요',
  '478개의 특징점을 찍고 있어요',
  '삼정의 균형을 재고 있어요',
  '눈·코·입의 비율을 재고 있어요',
  '풀이를 정리하고 있어요',
];

export default function ScanStep({ image, analysis, onDone }: Props) {
  const [caption, setCaption] = useState(0);

  // 스캔 연출이 진행되는 동안 안내 문구를 차례로 바꿈
  useEffect(() => {
    if (!analysis) return;
    const step = (SCAN_SECONDS * 1000) / CAPTIONS.length;
    const timer = window.setInterval(() => setCaption((c) => Math.min(c + 1, CAPTIONS.length - 1)), step);
    return () => window.clearInterval(timer);
  }, [analysis]);

  return (
    <section className="face-step face-scan">
      <div className="face-frame">
        {analysis ? (
          <FaceCanvas
            image={analysis.image}
            points={analysis.points}
            hairline={analysis.hairline.kind === 'found' ? analysis.hairline.point : null}
            lines={analysis.lines}
            animate
            onDone={onDone}
          />
        ) : (
          <>
            {image && <Photo image={image} />}
            <div className="face-sweep" />
          </>
        )}
      </div>

      <p className="face-hint" role="status" aria-live="polite">
        {analysis ? CAPTIONS[caption] : '얼굴을 찾고 있어요'}
      </p>
      <div className="face-dots" aria-hidden="true">
        {CAPTIONS.map((_, i) => (
          <span key={i} className={analysis && i <= caption ? 'is-on' : ''} />
        ))}
      </div>
    </section>
  );
}
