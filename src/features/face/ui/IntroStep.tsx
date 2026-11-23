import { useEffect, useRef, useState } from 'react';
import { loadLandmarker } from '../core/landmarker';
import type { Sex } from '../types';

// 첫 화면: 안내 + 성별(선택) + 촬영/업로드 선택
type Props = {
  onFile: (file: File) => void;
  onCamera: () => void;
  sex: Sex;
  onSex: (sex: Sex) => void;
  notice?: string; // 카메라를 못 쓸 때 등 안내
};

const TIPS = ['정면을 보고', '편안한 무표정', '밝은 곳에서', '한 사람만'];
const SEXES: { value: Sex; label: string }[] = [
  { value: 'any', label: '선택 안 함' },
  { value: 'female', label: '여성' },
  { value: 'male', label: '남성' },
];

export default function IntroStep({ onFile, onCamera, sex, onSex, notice }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  // 사용자가 안내를 읽는 동안 모델과 p5를 미리 불러와 대기 시간을 줄임
  useEffect(() => {
    loadLandmarker().catch(() => {});
    import('p5').catch(() => {});
  }, []);

  return (
    <section className="face-step face-intro">
      <div
        className={`face-frame face-drop${dragging ? ' is-dragging' : ''}`}
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
        <FaceGuide />
        <p className="face-drop-hint">사진을 여기에 끌어다 놓아도 돼요</p>
      </div>

      <h2 className="face-headline">얼굴에 담긴 이야기를 읽어드려요</h2>
      <p className="face-sub">
        478개의 얼굴 특징점을 측정하고,
        <br />그 비율을 전통 관상 풀이로 이어 드립니다.
      </p>

      <ul className="face-tips">
        {TIPS.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>

      <fieldset className="face-sex">
        <legend>성별 (선택)</legend>
        <div className="face-segment">
          {SEXES.map((s) => (
            <label key={s.value} className={sex === s.value ? 'is-on' : ''}>
              <input type="radio" name="face-sex" value={s.value} checked={sex === s.value} onChange={() => onSex(s.value)} />
              {s.label}
            </label>
          ))}
        </div>
        <p className="face-fineprint">얼굴 비율의 평균이 성별마다 달라서, 고르면 같은 성별 기준으로 비교해요.</p>
      </fieldset>

      {notice && <p className="face-notice" role="status">{notice}</p>}

      <div className="face-actions">
        <button className="btn" onClick={onCamera}>카메라로 촬영하기</button>
        <button className="face-btn-ghost" onClick={() => inputRef.current?.click()}>사진 올리기</button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = ''; // 같은 파일을 다시 고를 수 있게
        }}
      />
      <p className="face-fineprint">사진은 서버로 전송되지 않고 내 기기 안에서만 분석돼요.</p>
    </section>
  );
}

// 얼굴 가이드 그림 (삼정 구분선이 있는 얼굴 윤곽)
function FaceGuide() {
  return (
    <svg className="face-guide-art" viewBox="0 0 240 300" aria-hidden="true">
      <ellipse className="face-guide-oval" cx="120" cy="150" rx="74" ry="98" />
      <path className="face-guide-line" d="M34 112h172M34 176h172" />
      <path className="face-guide-feature" d="M82 132q14-9 28 0M130 132q14-9 28 0M120 140v32q-8 6-12 2M100 208q20 12 40 0" />
      <g className="face-guide-stars">
        <path d="M36 54l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
        <path d="M204 76l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
        <path d="M196 236l2.5 7 7 2.5-7 2.5-2.5 7-2.5-7-7-2.5 7-2.5z" />
      </g>
    </svg>
  );
}
