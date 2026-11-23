import { useState } from 'react';
import DownloadButton from '../../download/DownloadButton';
import type { Analysis, Reading } from '../types';
import DevPanel from './DevPanel';
import FaceCanvas from './FaceCanvas';
import RadarChart from './RadarChart';

// 결과 화면: 대표 유형 → 얼굴 측정 그림 → 운세 지표 → 삼정 → 부위별 풀이 → 계산 근거
type Props = { analysis: Extract<Analysis, { ok: true }>; onRetry: () => void };

export default function ResultStep({ analysis, onRetry }: Props) {
  const { reading } = analysis;
  const [showIndices, setShowIndices] = useState(false);

  return (
    <section className="face-step face-result">
      {/* id는 결과 저장(장진영 님 DownloadButton)이 저장할 영역을 찾는 데 사용 */}
      <div id="face-result" className="face-result-body">
        <header className="face-type">
          <p className="face-eyebrow">당신의 관상</p>
          <h2 className="face-type-title">{reading.type.title}</h2>
          <p className="face-sub">{reading.type.summary}</p>
        </header>

        <div className="face-frame">
          <FaceCanvas
            image={analysis.image}
            points={analysis.points}
            hairline={analysis.hairline.kind === 'found' ? analysis.hairline.point : null}
            lines={analysis.lines}
            showIndices={showIndices}
          />
        </div>

        <section className="face-card">
          <h3 className="face-card-title">운세 지표</h3>
          <RadarChart scores={reading.scores} />
        </section>

        <section className="face-card">
          <h3 className="face-card-title">삼정 · 인생의 흐름</h3>
          <Samjeong samjeong={reading.samjeong} />
        </section>

        <section className="face-card">
          <h3 className="face-card-title">부위별 풀이</h3>
          {reading.traits.map((trait) => (
            <article key={trait.key} className="face-trait">
              <p className="face-trait-part">{trait.part}</p>
              <h4 className="face-trait-title">{trait.title}</h4>
              <div className="face-gauge" role="img" aria-label={`${trait.part}: ${trait.measured}`}>
                <div className="face-gauge-track">
                  <span className="face-gauge-mark" style={{ left: `${trait.position}%` }} />
                </div>
                <div className="face-gauge-scale">
                  {trait.scale.map((name) => (
                    <span key={name}>{name}</span>
                  ))}
                </div>
              </div>
              <p className="face-trait-text">{trait.text}</p>
              <p className="face-trait-measured">측정 근거 · {trait.measured}</p>
            </article>
          ))}
        </section>
      </div>

      <details className="face-card face-method">
        <summary>어떻게 계산했나요?</summary>
        <ol>
          <li>MediaPipe Face Landmarker로 얼굴에서 478개의 특징점을 찾습니다.</li>
          <li>정면·무표정·밝기 등 사진 조건을 검사해 통과한 사진만 분석합니다.</li>
          <li>두 눈을 수평으로 맞춘 뒤 얼굴형·눈·코·입·턱의 비율과 삼정 길이를 잽니다.</li>
          <li>측정값을 미리 정해 둔 기준 범위와 비교해 풀이 문구와 지표 점수를 정합니다.</li>
        </ol>
        <p>
          같은 사진이면 언제나 같은 결과가 나옵니다. 풀이는 전통 관상 해석을 바탕으로 한 오락용 콘텐츠이며,
          실제 성격이나 미래를 예측하지 않습니다. (규칙 {reading.ruleVersion})
        </p>
      </details>

      <div className="face-actions">
        <DownloadButton targetId="face-result" />
        <button className="face-btn-ghost" onClick={onRetry}>다시 하기</button>
      </div>

      <DevPanel data={{ ...analysis.metrics, ...analysis.quality }}>
        <label className="face-dev-toggle">
          <input type="checkbox" checked={showIndices} onChange={(e) => setShowIndices(e.target.checked)} />
          점 번호 보기
        </label>
      </DevPanel>
    </section>
  );
}

// 상정(이마)을 어떻게 쟀는지 알려주는 문구
const SAMJEONG_NOTE: Record<Reading['samjeong']['hairline'], string> = {
  found: '측정 근거 · 머리카락이 시작되는 곳부터 미간, 코 밑, 턱 끝까지의 세로 길이 비율',
  covered: '앞머리가 이마를 덮고 있어 상정은 보이는 이마 위쪽까지로 재고, 같은 방식으로 잰 평균과 비교했어요.',
  notFound: '머리카락 경계가 보이지 않아 상정은 보이는 이마 위쪽까지로 재고, 같은 방식으로 잰 평균과 비교했어요.',
  unavailable: '머리카락 분석을 불러오지 못해 상정은 보이는 이마 위쪽까지로 재고, 같은 방식으로 잰 평균과 비교했어요.',
};

const PARTS = [
  { key: 'upper', name: '상정', era: '초년' },
  { key: 'middle', name: '중정', era: '중년' },
  { key: 'lower', name: '하정', era: '말년' },
] as const;

function Samjeong({ samjeong }: { samjeong: Reading['samjeong'] }) {
  return (
    <>
      <div className="face-samjeong">
        {PARTS.map((part) => (
          <div
            key={part.key}
            className={`face-samjeong-part${samjeong.key === part.key ? ' is-top' : ''}`}
            style={{ flexGrow: samjeong.ratios[part.key] }}
          >
            <strong>{part.name}</strong>
            <span>{part.era}</span>
            <em>{Math.round(samjeong.ratios[part.key] * 100)}%</em>
          </div>
        ))}
      </div>
      <h4 className="face-trait-title">{samjeong.title}</h4>
      <p className="face-trait-text">{samjeong.text}</p>
      <p className="face-trait-measured">{SAMJEONG_NOTE[samjeong.hairline]}</p>
    </>
  );
}
