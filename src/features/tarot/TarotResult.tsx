// 담당: 장진영
// 타로 결과 화면: 종합 한 줄 + 카드 3장(그림·키워드·해석) + 미래 카드의 행동 제안
// 결과 영역에는 id="tarot-result"가 붙어 있어서, 나중에 공용 다운로드 버튼을 연결하기 쉽습니다.
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 함수 단위로 작성했습니다. (AI 사용 비율: 약 100%)

import { useMemo } from 'react';
import type p5 from 'p5';
import P5Canvas from '../../components/P5Canvas';
import { drawCardFront } from './drawCard';
import { ACTION_TITLE, type CardReading, type TarotReading } from './interpret';
import { CANVAS_FONT, PALETTE } from './palette';

const CARD_W = 132;
const CARD_H = Math.round(CARD_W * 1.62);

/**
 * 카드 한 장의 앞면을 한 번만 그리는 작은 p5 스케치를 만드는 함수 (움직임이 없어서 noLoop)
 * [AI 도움: Claude]
 */
function createCardImageSketch(c: CardReading) {
  return (p: p5) => {
    p.setup = () => {
      p.createCanvas(CARD_W + 8, CARD_H + 8);
      p.textFont(CANVAS_FONT);
      p.noLoop();
    };
    p.draw = () => {
      p.background(...PALETTE.card);
      p.translate(p.width / 2, p.height / 2);
      drawCardFront(p, c.card, CARD_W, CARD_H, c.reversed);
    };
  };
}

/**
 * 카드 한 장의 해석 칸 (왼쪽 카드 그림, 오른쪽 글)
 * [AI 도움: Claude]
 */
function ResultCard({ reading, topic }: { reading: CardReading; topic: TarotReading['topic'] }) {
  // 카드가 바뀔 때만 스케치를 새로 만듦 (매번 만들면 캔버스가 계속 다시 생김)
  const sketch = useMemo(() => createCardImageSketch(reading), [reading]);
  return (
    <article className="tarot-result-card">
      <div className="tarot-result-art">
        <P5Canvas sketch={sketch} />
      </div>
      <div className="tarot-result-body">
        <p className="tarot-result-pos">{reading.position}</p>
        <h3>
          {reading.card.nameKo}
          <span className={reading.reversed ? 'is-rev' : 'is-up'}>{reading.reversed ? '역방향' : '정방향'}</span>
        </h3>
        <ul className="tarot-result-keywords">
          {reading.keywords.map((k) => (
            <li key={k}>#{k}</li>
          ))}
        </ul>
        <p>{reading.text}</p>
        {reading.action && (
          <div className="tarot-result-action">
            <strong>💡 {ACTION_TITLE[topic]}</strong>
            <p>{reading.action}</p>
          </div>
        )}
      </div>
    </article>
  );
}

type Props = {
  reading: TarotReading;
  onBackToCards: () => void; // 카드 화면으로 돌아가기
  onNewReading: () => void; // 처음(주제 선택)으로
};

/**
 * 결과 화면 전체
 * [AI 도움: Claude]
 */
export default function TarotResult({ reading, onBackToCards, onNewReading }: Props) {
  return (
    <>
      <section id="tarot-result" className="tarot-result">
        <header className="tarot-result-head">
          <p className="tarot-result-topic">
            {reading.topicLabel} 리딩 · 과거 · 현재 · 미래
          </p>
          {reading.question && <p className="tarot-result-question">“{reading.question}”</p>}
          <h2>{reading.summary}</h2>
          <ul className="tarot-result-notes">
            {reading.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </header>

        {reading.cards.map((c) => (
          <ResultCard key={c.position} reading={c} topic={reading.topic} />
        ))}

        <p className="tarot-note">엔터테인먼트 목적의 콘텐츠입니다. 카드 의미와 정해진 규칙으로 만든 해석이에요.</p>
      </section>

      <div className="tarot-result-actions">
        <button type="button" className="tarot-ghost-btn" onClick={onBackToCards}>
          카드 다시 보기
        </button>
        <button type="button" className="btn" onClick={onNewReading}>
          새 리딩 시작하기
        </button>
      </div>
    </>
  );
}
