import { useMemo, useState, type ChangeEvent } from 'react';
import PageLayout from '../../components/PageLayout';
import P5Canvas from '../../components/P5Canvas';
import DownloadButton from '../download/DownloadButton';
import { analyzePalm, AnalyzeError, fileToCanvas, type PalmResult } from './analyzePalm';
import CameraCapture from './CameraCapture';
import { GENTLE_CURVE, LENGTH_LONG, LENGTH_SHORT, LINE_INFO, STRAIGHT_LINE } from './config';
import {
  CONTINUITY_LABEL,
  CURVE_LABEL,
  LENGTH_LABEL,
  LINE_MEANING,
  lineReading,
  typeTitle,
} from './reading';
import { createResultSketch } from './resultSketch';
import './palm.css';

// 담당: 오예은
// 산출 방식: MediaPipe Hands(21개 특징점) + 손금 분할 모델(ONNX)
//   → 생명선·두뇌선·감정선의 길이(손바닥 너비 대비 비율)·곡률·연속성 계산 → 손금 풀이 규칙 적용

type Stage = 'select' | 'camera' | 'analyzing' | 'result' | 'error';

export default function PalmPage() {
  const [stage, setStage] = useState<Stage>('select');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<PalmResult | null>(null);

  const run = async (image: HTMLCanvasElement) => {
    setStage('analyzing');
    try {
      const r = await analyzePalm(image, setMessage);
      setResult(r);
      setStage('result');
    } catch (e) {
      console.error(e);
      setMessage(e instanceof AnalyzeError ? e.message : '분석 중 문제가 생겼어요. 다른 사진으로 다시 시도해 주세요.');
      setStage('error');
    }
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 사진을 다시 골라도 동작하게
    if (!file) return;
    try {
      await run(await fileToCanvas(file));
    } catch {
      setMessage('사진을 열 수 없어요. JPG·PNG 사진으로 다시 시도해 주세요.');
      setStage('error');
    }
  };

  const reset = () => {
    setResult(null);
    setMessage('');
    setStage('select');
  };

  // 결과가 바뀔 때만 p5 스케치를 새로 만듦 (렌더링마다 새로 만들면 캔버스가 계속 생김)
  const sketch = useMemo(() => {
    if (!result) return null;
    const width = Math.min(560, window.innerWidth - 48);
    return createResultSketch({
      image: result.image,
      width,
      lines: result.lines.filter((l) => l.found).map((l) => ({ key: l.key, paths: l.paths })),
      palmA: result.hand.points[5],
      palmB: result.hand.points[17],
    });
  }, [result]);

  const cats = result
    ? Object.fromEntries(result.lines.filter((l) => l.cats).map((l) => [l.key, l.cats!]))
    : {};

  return (
    <PageLayout title="손금" desc="손바닥 사진으로 보는 손금 풀이">
      {stage === 'select' && (
        <section className="palm-card">
          <h2 className="palm-card-title">손바닥 사진을 준비해 주세요</h2>
          <ul className="palm-tips">
            <li>밝은 곳에서 손바닥 전체가 나오게</li>
            <li>손가락을 붙이지 말고 쭉 펴서</li>
            <li>주로 쓰는 손으로 (오른손잡이라면 오른손)</li>
          </ul>
          <div className="palm-actions">
            <label className="btn palm-upload">
              사진 올리기
              <input type="file" accept="image/*" onChange={onFile} />
            </label>
            <button className="btn palm-btn-sub" onClick={() => setStage('camera')}>
              카메라로 찍기
            </button>
          </div>
          <p className="palm-sub-text">사진은 서버로 보내지 않고, 이 브라우저 안에서만 분석해요.</p>
        </section>
      )}

      {stage === 'camera' && <CameraCapture onCapture={run} onCancel={reset} />}

      {stage === 'analyzing' && (
        <section className="palm-card palm-status">
          <div className="palm-spinner" aria-hidden="true" />
          <p>{message}</p>
          <p className="palm-sub-text">처음에는 모델을 내려받느라 시간이 조금 걸릴 수 있어요.</p>
        </section>
      )}

      {stage === 'error' && (
        <section className="palm-card palm-status">
          <p className="palm-error-text">{message}</p>
          <div className="palm-actions">
            <button className="btn" onClick={reset}>
              다시 하기
            </button>
          </div>
        </section>
      )}

      {stage === 'result' && result && sketch && (
        <>
          <section id="palm-result" className="palm-result">
            <p className="palm-kicker">나의 손금 유형</p>
            <h2 className="palm-type">{typeTitle(cats)}</h2>

            <div className="palm-result-grid">
              <div className="palm-canvas">
                <P5Canvas sketch={sketch} />
              </div>

              <div className="palm-lines">
                {result.lines.map((line) => (
                  <article key={line.key} className="palm-line-card">
                    <h3>
                      <span className={`palm-dot palm-dot--${line.key}`} aria-hidden="true" />
                      {LINE_INFO[line.key].name}
                      <small>{LINE_MEANING[line.key]}</small>
                    </h3>
                    {line.cats ? (
                      <>
                        <div className="palm-badges">
                          <span className="palm-badge">길이 {LENGTH_LABEL[line.cats.length]}</span>
                          <span className="palm-badge">{CURVE_LABEL[line.cats.curve]}</span>
                          <span className="palm-badge">{CONTINUITY_LABEL[line.cats.continuity]}</span>
                        </div>
                        <p>{lineReading(line.key, line.cats)}</p>
                      </>
                    ) : (
                      <p className="palm-sub-text">
                        사진에서 이 선을 찾지 못했어요. 밝은 곳에서 손바닥을 평평하게 펴고 다시 찍어 보세요.
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>

            <details className="palm-method">
              <summary>어떻게 계산했나요?</summary>
              <ol>
                <li>MediaPipe Hands로 손 특징점 21개를 찾고, 검지 뿌리~새끼 뿌리 거리를 <b>손바닥 너비</b>(기준)로 잡아요.</li>
                <li>손금 분할 모델(YOLO, ONNX)이 사진에서 생명선 · 두뇌선 · 감정선 영역을 찾아요.</li>
                <li>찾은 영역을 1픽셀 두께로 깎아(세선화) 중심선을 만든 뒤 길이 · 직선도 · 조각 수를 재요.</li>
                <li>아래 기준표로 판정하고, 판정에 맞는 풀이 문장을 조합해요.</li>
              </ol>
              <div className="palm-table-wrap">
                <table className="palm-table">
                  <thead>
                    <tr>
                      <th>선</th>
                      <th>길이 비율</th>
                      <th>직선도</th>
                      <th>조각 수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.lines.map((line) => (
                      <tr key={line.key}>
                        <td>{LINE_INFO[line.key].name}</td>
                        <td>{line.found ? line.ratio.toFixed(2) : '-'}</td>
                        <td>{line.found ? line.straightness.toFixed(2) : '-'}</td>
                        <td>{line.found ? line.pieces : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="palm-sub-text">
                길이 비율 = 선 길이 ÷ 손바닥 너비 ({LENGTH_SHORT} 미만 짧음 / {LENGTH_SHORT}~{LENGTH_LONG} 보통 /{' '}
                {LENGTH_LONG} 초과 김) · 직선도 = 양 끝 직선거리 ÷ 선 길이 ({STRAIGHT_LINE} 이상 직선형 / {GENTLE_CURVE}{' '}
                이상 완만한 곡선 / 그 미만 깊은 곡선) · 조각 수 1개 끊김 없음, 2개 한 번 끊김, 3개 이상 여러 번 끊김
              </p>
            </details>

            <p className="palm-note">엔터테인먼트 목적의 콘텐츠입니다. 재미로 봐 주세요.</p>
            <p className="palm-credit">
              손금 검출 모델 학습 데이터: palmistry Dataset (Nikhil Singh&apos;s Workspace, Roboflow Universe) · CC BY 4.0
            </p>
          </section>

          <div className="palm-actions">
            <button className="btn palm-btn-sub" onClick={reset}>
              다시 하기
            </button>
            <DownloadButton targetId="palm-result" />
          </div>
        </>
      )}
    </PageLayout>
  );
}
