// 분석할 수 없을 때: 이유와 다시 찍는 요령 안내
import { useMemo } from 'react';
import type { AnalyzeErrorCode } from '../analyzePalm';
import PalmGuide from './PalmGuide';

export type RetryReason = AnalyzeErrorCode | 'file';

type Props = {
  image: HTMLCanvasElement | null;
  reason: RetryReason;
  message?: string;
  onRetry: () => void;  // 처음 화면으로
  onCamera: () => void; // 바로 카메라로
};

const COPY: Record<RetryReason, { title: string; tips: string[] }> = {
  'no-hand': {
    title: '사진에서 손을 찾지 못했어요',
    tips: ['손바닥 전체가 화면 안에 들어오게', '밝은 곳에서, 그림자 없이', '배경은 단순할수록 좋아요'],
  },
  fingers: {
    title: '손가락이 접혀 있는 것 같아요',
    tips: ['손가락을 쭉 펴서', '손가락 사이를 살짝 벌리고', '손바닥이 카메라를 보게'],
  },
  file: {
    title: '사진을 열 수 없어요',
    tips: ['JPG · PNG 사진으로 다시 골라 주세요'],
  },
  'model-missing': {
    title: '손금 검출 모델이 아직 준비되지 않았어요',
    tips: ['public/models/palm/palm-lines.onnx 파일을 확인해 주세요'],
  },
  unknown: {
    title: '분석 중에 문제가 생겼어요',
    tips: ['인터넷 연결을 확인하고', '잠시 후 다시 시도해 주세요'],
  },
};

export default function RetryStep({ image, reason, message, onRetry, onCamera }: Props) {
  const src = useMemo(() => (image ? image.toDataURL('image/jpeg', 0.85) : ''), [image]);
  const copy = COPY[reason];

  return (
    <section className="palm-step palm-retry">
      <div className="palm-frame is-dimmed">
        {src ? <img className="palm-photo" src={src} alt="다시 찍어야 하는 사진" /> : <PalmGuide />}
      </div>

      <h2 className="palm-headline">{copy.title}</h2>
      {message && reason === 'unknown' && <p className="palm-sub">{message}</p>}
      <ul className="palm-tips">
        {copy.tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>

      <div className="palm-actions">
        <button className="btn" onClick={onCamera}>
          카메라로 다시 찍기
        </button>
        <button className="btn palm-btn-sub" onClick={onRetry}>
          다른 사진 고르기
        </button>
      </div>
    </section>
  );
}
