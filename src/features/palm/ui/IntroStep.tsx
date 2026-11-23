// 첫 화면: 손바닥 그림 + 안내 + 손 선택(왼손/오른손) + 촬영/업로드 선택
import { useEffect, useRef, useState } from 'react';
import { loadHandLandmarker } from '../handDetector';
import { DOMINANT_LABEL, readingFrame, SIDE_LABEL, type HandChoice, type HandSide } from '../handReading';
import PalmGuide from './PalmGuide';

type Props = {
  choice: HandChoice;
  onChoice: (choice: HandChoice) => void;
  onFile: (file: File) => void;
  onCamera: () => void;
  notice?: string; // 카메라를 못 쓸 때 등 안내
};

const TIPS = ['밝은 곳에서', '손가락을 쭉 펴고', '손바닥 전체가 보이게'];
const SIDES: HandSide[] = ['right', 'left'];

export default function IntroStep({ choice, onChoice, onFile, onCamera, notice }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const frame = readingFrame(choice);

  // 안내를 읽는 동안 손 인식 모델과 p5를 미리 불러와 대기 시간을 줄임
  useEffect(() => {
    loadHandLandmarker().catch(() => {});
    import('p5').catch(() => {});
  }, []);

  return (
    <section className="palm-step palm-intro">
      <div
        className={`palm-frame palm-drop${dragging ? ' is-dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) onFile(file);
        }}
      >
        <span className="palm-sparkle palm-sparkle--a" aria-hidden="true">✦</span>
        <span className="palm-sparkle palm-sparkle--b" aria-hidden="true">✦</span>
        <span className="palm-sparkle palm-sparkle--c" aria-hidden="true">✦</span>
        {/* 고른 손에 맞춰 그림 좌우를 바꿈 (key로 다시 그려서 선 애니메이션도 다시 재생) */}
        <PalmGuide key={choice.side} lines flip={choice.side === 'left'} className="palm-intro-guide" />
        <p className="palm-drop-hint">사진을 여기에 끌어다 놓아도 돼요</p>
      </div>

      <h2 className="palm-headline">손바닥에 새겨진 이야기를 읽어드려요</h2>
      <p className="palm-sub">
        손 특징점 21개와 손금 3대 선을 측정하고,
        <br />그 모양을 전통 손금 풀이로 이어 드립니다.
      </p>

      <ul className="palm-tips">
        {TIPS.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>

      <fieldset className="palm-choice">
        <legend>어느 손을 볼까요?</legend>
        <Segment
          name="palm-side"
          value={choice.side}
          labels={SIDE_LABEL}
          onChange={(side) => onChoice({ ...choice, side })}
        />
        <Segment
          name="palm-dominant"
          value={choice.dominant}
          labels={DOMINANT_LABEL}
          onChange={(dominant) => onChoice({ ...choice, dominant })}
        />
        <p className="palm-choice-result">
          <b>{frame.title}</b>을 보는 손이에요 <span>({frame.short})</span>
        </p>
        <p className="palm-fineprint">{frame.desc}</p>
      </fieldset>

      {notice && (
        <p className="palm-notice" role="status">
          {notice}
        </p>
      )}

      <div className="palm-actions">
        <button className="btn" onClick={onCamera}>
          카메라로 촬영하기
        </button>
        <button className="btn palm-btn-sub" onClick={() => inputRef.current?.click()}>
          사진 올리기
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = ''; // 같은 사진을 다시 골라도 동작하게
            if (file) onFile(file);
          }}
        />
      </div>
      <p className="palm-fineprint">사진은 서버로 보내지 않고, 이 브라우저 안에서만 분석해요.</p>
    </section>
  );
}

function Segment({
  name,
  value,
  labels,
  onChange,
}: {
  name: string;
  value: HandSide;
  labels: Record<HandSide, string>;
  onChange: (v: HandSide) => void;
}) {
  return (
    <div className="palm-segment">
      {SIDES.map((s) => (
        <label key={s} className={value === s ? 'is-on' : ''}>
          <input type="radio" name={name} value={s} checked={value === s} onChange={() => onChange(s)} />
          {labels[s]}
        </label>
      ))}
    </div>
  );
}
