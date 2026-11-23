// 결과 화면: 대표 유형 → 손금 그림 + 운세 지표 → 손 모양 → 3대 손금 → 손가락 → 유형 도감 → 계산 방법
import { useMemo } from 'react';
import P5Canvas from '../../../components/P5Canvas';
import type { PalmResult } from '../analyzePalm';
import {
  FINGER_LONG_RATIO,
  GENTLE_CURVE,
  INDEX_RING_HIGH,
  INDEX_RING_LOW,
  LENGTH_LONG,
  LENGTH_SHORT,
  LINE_INFO,
  PALM_LONG_RATIO,
  STRAIGHT_LINE,
  THUMB_LONG,
  THUMB_SHORT,
} from '../config';
import {
  DOMINANT_LABEL,
  HAND_TYPES,
  INDEX_RING_INFO,
  readingFrame,
  SIDE_LABEL,
  THUMB_INFO,
  type HandChoice,
} from '../handReading';
import { CONTINUITY_LABEL, CURVE_LABEL, LENGTH_LABEL, LINE_MEANING, lineReading, typeTitle } from '../reading';
import { createResultSketch } from '../resultSketch';
import { SCORE_INFO, topScore } from '../scores';
import Gauge from './Gauge';
import RadarChart from './RadarChart';
import SaveImageButton from './SaveImageButton';
import TypeAtlas from './TypeAtlas';

type Props = { result: PalmResult; choice: HandChoice; onRetry: () => void };

const MAX_SKETCH_W = 440;
const MAX_SKETCH_H = 460; // 세로로 긴 사진도 화면을 다 차지하지 않게

export default function ResultStep({ result, choice, onRetry }: Props) {
  const { image, lines, handCats, handMetrics, scores } = result;
  const frame = readingFrame(choice);
  const isDominant = choice.side === choice.dominant;
  const handInfo = HAND_TYPES[handCats.type];
  const best = topScore(scores);
  const lineCats = Object.fromEntries(lines.filter((l) => l.cats).map((l) => [l.key, l.cats!]));
  const lineTitle = typeTitle(lineCats);

  // 결과가 바뀔 때만 p5 스케치를 새로 만듦 (렌더링마다 새로 만들면 캔버스가 계속 생김)
  const sketch = useMemo(() => {
    const width = Math.round(
      Math.min(MAX_SKETCH_W, window.innerWidth - 64, (MAX_SKETCH_H * image.width) / image.height),
    );
    return createResultSketch({
      image,
      width,
      lines: lines.filter((l) => l.found).map((l) => ({ key: l.key, paths: l.paths })),
      palmA: result.hand.points[5],
      palmB: result.hand.points[17],
    });
  }, [result, image, lines]);

  return (
    <>
      <section id="palm-result" className="palm-result">
        <header className="palm-hero">
          <p className="palm-kicker">
            {SIDE_LABEL[choice.side]} · {frame.title}
          </p>
          <h2 className="palm-type">
            <span className="palm-type-symbol" aria-hidden="true">
              {handInfo.symbol}
            </span>
            {handInfo.name}
          </h2>
          <p className="palm-type-sub">{lineTitle}</p>
          <p className="palm-type-best">
            {SCORE_INFO[best.key].name}이 가장 돋보이는 손이에요
          </p>
          <p className="palm-frame-note">
            {DOMINANT_LABEL[choice.dominant]}의 {SIDE_LABEL[choice.side]}({isDominant ? '주로 쓰는 손' : '반대쪽 손'}) ·{' '}
            {frame.short} — {frame.desc}
          </p>
        </header>

        <div className="palm-hero-grid">
          <div className="palm-card palm-canvas-card">
            <div className="palm-canvas">
              <P5Canvas sketch={sketch} />
            </div>
            <ul className="palm-legend">
              {lines.map((l) => (
                <li key={l.key} className={l.found ? '' : 'is-missing'}>
                  <span className={`palm-dot palm-dot--${l.key}`} aria-hidden="true" />
                  {LINE_INFO[l.key].name}
                </li>
              ))}
            </ul>
          </div>

          <div className="palm-card">
            <h3 className="palm-card-title">운세 지표</h3>
            <RadarChart scores={scores} />
            <ul className="palm-scores">
              {scores.map((s) => (
                <li key={s.key}>
                  <span className="palm-score-name">{SCORE_INFO[s.key].name}</span>
                  <span className="palm-score-bar">
                    <span style={{ width: `${s.value}%` }} />
                  </span>
                  <b>{s.value}</b>
                  <small>{s.reasons.length ? s.reasons.slice(0, 2).join(' · ') : '기본 점수'}</small>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="palm-card">
          <h3 className="palm-card-title">손 모양 유형</h3>
          <div className="palm-handtype">
            <span className="palm-handtype-symbol" aria-hidden="true">
              {handInfo.symbol}
            </span>
            <div>
              <h4>
                {handInfo.name} <small>{handInfo.palm} · {handInfo.fingers}</small>
              </h4>
              <ul className="palm-chips">
                {handInfo.keywords.map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
            </div>
          </div>
          <p>{handInfo.reading}</p>
          <div className="palm-gauges">
            <Gauge
              caption="손바닥 길이 ÷ 너비"
              value={handMetrics.palmRatio}
              cuts={[PALM_LONG_RATIO]}
              labels={['네모난 손바닥', '긴 손바닥']}
              active={handCats.palm === 'long' ? 1 : 0}
            />
            <Gauge
              caption="중지 길이 ÷ 손바닥 길이"
              value={handMetrics.fingerRatio}
              cuts={[FINGER_LONG_RATIO]}
              labels={['짧은 손가락', '긴 손가락']}
              active={handCats.fingers === 'long' ? 1 : 0}
            />
          </div>
        </div>

        <div className="palm-card">
          <h3 className="palm-card-title">3대 손금</h3>
          <div className="palm-lines">
            {lines.map((line) => (
              <article key={line.key} className="palm-line-card">
                <h4>
                  <span className={`palm-dot palm-dot--${line.key}`} aria-hidden="true" />
                  {LINE_INFO[line.key].name}
                  <small>{LINE_MEANING[line.key]}</small>
                </h4>
                {line.cats ? (
                  <>
                    <ul className="palm-chips">
                      <li>길이 {LENGTH_LABEL[line.cats.length]}</li>
                      <li>{CURVE_LABEL[line.cats.curve]}</li>
                      <li>{CONTINUITY_LABEL[line.cats.continuity]}</li>
                    </ul>
                    <p>{lineReading(line.key, line.cats)}</p>
                  </>
                ) : (
                  <p className="palm-sub">
                    사진에서 이 선을 찾지 못했어요. 밝은 곳에서 손바닥을 평평하게 펴고 다시 찍어 보세요.
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>

        <div className="palm-card">
          <h3 className="palm-card-title">손가락 비율</h3>
          <div className="palm-finger-grid">
            <div>
              <h4>{INDEX_RING_INFO[handCats.indexRing].name}</h4>
              <Gauge
                caption="검지 ÷ 약지"
                value={handMetrics.indexRing}
                cuts={[INDEX_RING_LOW, INDEX_RING_HIGH]}
                labels={['약지가 김', '균형', '검지가 김']}
                active={handCats.indexRing === 'ring' ? 0 : handCats.indexRing === 'even' ? 1 : 2}
              />
              <p>{INDEX_RING_INFO[handCats.indexRing].reading}</p>
            </div>
            <div>
              <h4>{THUMB_INFO[handCats.thumb].name}</h4>
              <Gauge
                caption="엄지 ÷ 검지"
                value={handMetrics.thumbRatio}
                cuts={[THUMB_SHORT, THUMB_LONG]}
                labels={['짧음', '보통', '김']}
                active={handCats.thumb === 'short' ? 0 : handCats.thumb === 'normal' ? 1 : 2}
              />
              <p>{THUMB_INFO[handCats.thumb].reading}</p>
            </div>
          </div>
        </div>

        <div className="palm-card">
          <h3 className="palm-card-title">손금 유형 도감</h3>
          <TypeAtlas hand={handCats} lines={lineCats} />
        </div>

        <details className="palm-method">
          <summary>어떻게 계산했나요?</summary>
          <ol>
            <li>
              전통 손금 기준에 따라 주로 쓰는 손은 <b>지금과 앞으로(후천운)</b>, 반대쪽 손은 <b>타고난 성향(선천운)</b>으로
              읽어요. 사진만으로는 왼손·오른손 구분이 정확하지 않아 직접 고른 값을 써요.
            </li>
            <li>MediaPipe Hands로 손 특징점 21개를 찾고, 검지 뿌리~새끼 뿌리 거리를 <b>손바닥 너비</b>(기준)로 잡아요.</li>
            <li>특징점 사이 거리로 손바닥 모양 · 손가락 길이 · 검지와 약지 · 엄지 비율을 재요.</li>
            <li>손금 분할 모델(YOLO, ONNX)이 사진에서 생명선 · 두뇌선 · 감정선 영역을 찾아요.</li>
            <li>찾은 영역을 1픽셀 두께로 깎아(세선화) 중심선을 만든 뒤 길이 · 직선도 · 조각 수를 재요.</li>
            <li>기준표로 판정하고, 판정마다 정해진 점수를 더해 운세 지표를 계산해요. 같은 사진이면 항상 같은 결과가 나와요.</li>
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
                {lines.map((line) => (
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
          <p className="palm-fineprint">
            길이 비율 = 선 길이 ÷ 손바닥 너비 ({LENGTH_SHORT} 미만 짧음 / {LENGTH_SHORT}~{LENGTH_LONG} 보통 / {LENGTH_LONG}{' '}
            초과 김) · 직선도 = 양 끝 직선거리 ÷ 선 길이 ({STRAIGHT_LINE} 이상 직선형 / {GENTLE_CURVE} 이상 완만한 곡선 / 그
            미만 깊은 곡선) · 조각 수 1개 끊김 없음, 2개 한 번 끊김, 3개 이상 여러 번 끊김
          </p>
          <p className="palm-fineprint">
            손 모양 = 손바닥 길이 ÷ 너비 {PALM_LONG_RATIO} 이상 긴 손바닥 · 중지 ÷ 손바닥 길이 {FINGER_LONG_RATIO} 이상 긴
            손가락 → 네모·짧음 흙 / 네모·긺 바람 / 긴·짧음 불 / 긴·긺 물
          </p>
        </details>

        <p className="palm-note">엔터테인먼트 목적의 콘텐츠입니다. 재미로 봐 주세요.</p>
        <p className="palm-credit">
          손금 검출 모델 학습 데이터: palmistry Dataset (Nikhil Singh&apos;s Workspace, Roboflow Universe) · CC BY 4.0
        </p>
      </section>

      <div className="palm-actions palm-actions--center">
        <button className="btn palm-btn-sub" onClick={onRetry}>
          다시 하기
        </button>
        <SaveImageButton result={result} choice={choice} />
      </div>
    </>
  );
}
