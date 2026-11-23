// 담당: 장진영
// 타로 페이지: ① 주제 선택(HTML) → ② 섞기·고르기·뒤집기(p5 전체화면 캔버스)
// 산출 방식: 78장 덱에서 비복원 무작위 3장 + 정/역방향 → 위치(과거·현재·조언)별 해석 (해석은 2차에서 추가)
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 함수 단위로 작성했습니다. (AI 사용 비율: 약 100%)

import { useEffect, useMemo, useRef, useState } from 'react';
import PageLayout from '../../components/PageLayout';
import P5Canvas from '../../components/P5Canvas';
import { saveTarotResult } from '../chatbot/adapters/saveTarot';
import { DECK } from './deck';
import {
  POSITION_LABELS,
  TOPIC_LABELS,
  clearSession,
  createSession,
  loadSession,
  saveSession,
  type TarotSession,
  type Topic,
} from './storage';
import { createTarotSketch } from './tarotSketch';
import './TarotPage.css';

const TOPICS: { value: Topic; desc: string }[] = [
  { value: 'love', desc: '관계와 마음의 흐름' },
  { value: 'money', desc: '재물과 소비의 흐름' },
  { value: 'career', desc: '일과 진로의 방향' },
];

/**
 * 저장된 세션이 어디까지 진행됐는지 한 줄로 설명하는 함수 (이어하기 안내용)
 * [AI 도움: Claude]
 */
function describeProgress(s: TarotSession): string {
  if (s.phase === 'shuffle') return '카드 섞기 전';
  if (s.phase === 'pick') return `카드 ${s.picked.length}/3장 고름`;
  if (s.phase === 'reveal') return `카드 뒤집는 중 (${s.flipped.filter(Boolean).length}/3)`;
  return '3장 모두 확인함';
}

/** 사용자가 "동작 줄이기" 설정을 켰는지 확인 */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 브라우저 전체화면 켜기 (아이폰 사파리처럼 지원 안 하면 조용히 넘어감) */
function enterFullscreen() {
  if (document.fullscreenEnabled && !document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
}

/** 브라우저 전체화면 끄기 */
function exitFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

export default function TarotPage() {
  // 저장된 진행 상황이 있으면 불러와서 시작 (없으면 null)
  const [session, setSession] = useState<TarotSession | null>(() => loadSession());
  const [view, setView] = useState<'select' | 'ritual'>('select'); // select=주제 선택 화면, ritual=카드 화면
  const [topic, setTopic] = useState<Topic>(session?.topic ?? 'love');
  const [question, setQuestion] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // p5 스케치가 "최신 세션"을 읽을 수 있도록 ref에 항상 담아 둠
  const sessionRef = useRef(session);
  sessionRef.current = session;

  /**
   * p5 스케치는 한 번만 만듭니다 (매번 새로 만들면 캔버스가 계속 다시 생김).
   * - getInitial: 캔버스가 새로 열릴 때마다 최신 세션에서 시작 (이어하기)
   * - onChange: 카드를 고르거나 뒤집을 때마다 localStorage에 저장
   * [AI 도움: Claude]
   */
  const sketch = useMemo(
    () =>
      createTarotSketch({
        getInitial: () => sessionRef.current!,
        onChange: (next) => {
          saveSession(next);
          if (next.phase === 'done') saveTarotResult(next); // AI 운세 상담에서 쓰도록 결과 저장 (김예진 추가, src/features/chatbot 참고)
          setSession(next);
        },
        reducedMotion: prefersReducedMotion(),
      }),
    [],
  );

  // 전체화면 상태가 바뀌면(ESC 키 포함) 버튼 글자를 맞춤
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // 카드 화면에서는 뒤쪽 페이지가 스크롤되지 않게 막음
  useEffect(() => {
    if (view !== 'ritual') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [view]);

  // 페이지를 떠나면 전체화면 해제
  useEffect(() => exitFullscreen, []);

  /**
   * 새 리딩 시작: 새 세션을 만들어 저장하고 카드 화면으로 이동.
   * 버튼을 누른 순간(사용자 동작)에만 전체화면을 요청할 수 있어서 여기서 같이 켭니다.
   * [AI 도움: Claude]
   */
  function startNew(t: Topic, q: string) {
    const s = createSession(t, q);
    saveSession(s);
    setSession(s);
    setView('ritual');
    enterFullscreen();
  }

  /** 저장된 리딩 이어하기 */
  function resume() {
    setView('ritual');
    enterFullscreen();
  }

  /** 카드 화면 → 주제 선택 화면 (진행 상황은 저장된 채로 남음) */
  function leave() {
    exitFullscreen();
    setView('select');
  }

  /** 같은 주제로 처음부터 다시 섞기 */
  function restart() {
    if (!session) return;
    if (!window.confirm('지금 리딩을 지우고 처음부터 다시 섞을까요?')) return;
    startNew(session.topic, session.question);
  }

  /** 저장된 리딩 지우기 */
  function discard() {
    clearSession();
    setSession(null);
  }

  // ── ② 카드 화면 (p5 전체화면 캔버스 + 위쪽 버튼 줄) ──
  if (view === 'ritual' && session) {
    return (
      <div className="tarot-stage">
        {/* key가 바뀌면(=새 리딩) 캔버스를 새로 만듦 */}
        <P5Canvas key={session.id} sketch={sketch} />
        <div className="tarot-topbar">
          <button type="button" className="tarot-ghost-btn" onClick={leave}>
            ← 나가기
          </button>
          <p className="tarot-topbar-title">
            <strong>{TOPIC_LABELS[session.topic]}</strong>
            {session.question && <span> · {session.question}</span>}
          </p>
          <div className="tarot-topbar-actions">
            <button type="button" className="tarot-ghost-btn" onClick={restart}>
              다시 섞기
            </button>
            {document.fullscreenEnabled && (
              <button
                type="button"
                className="tarot-ghost-btn"
                onClick={isFullscreen ? exitFullscreen : enterFullscreen}
              >
                {isFullscreen ? '전체화면 끄기' : '전체화면'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── ① 주제 선택 화면 ──
  return (
    <PageLayout title="타로" desc="카드 3장으로 보는 타로 리딩">
      {session && (
        <section className="tarot-resume">
          <h2>진행 중인 리딩이 있어요</h2>
          <p>
            주제: <strong>{TOPIC_LABELS[session.topic]}</strong>
            {session.question && ` · "${session.question}"`} — {describeProgress(session)}
          </p>
          {session.phase === 'done' && (
            <ul className="tarot-resume-cards">
              {session.picked.map((id, k) => (
                <li key={id}>
                  {POSITION_LABELS[k]}: {DECK[id].nameKo} ({session.reversed[id] ? '역방향' : '정방향'})
                </li>
              ))}
            </ul>
          )}
          <div className="tarot-resume-actions">
            <button type="button" className="btn" onClick={resume}>
              이어서 하기
            </button>
            <button type="button" className="tarot-ghost-btn" onClick={discard}>
              기록 지우기
            </button>
          </div>
        </section>
      )}

      <section className="tarot-select">
        <h2>어떤 고민이 있나요?</h2>
        <div className="tarot-topics" role="radiogroup" aria-label="고민 주제">
          {TOPICS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={topic === t.value}
              className={`tarot-topic${topic === t.value ? ' is-active' : ''}`}
              onClick={() => setTopic(t.value)}
            >
              <strong>{TOPIC_LABELS[t.value]}</strong>
              <span>{t.desc}</span>
            </button>
          ))}
        </div>

        <label className="tarot-question">
          <span>고민을 한 줄로 적어보세요 (선택)</span>
          <input
            type="text"
            maxLength={60}
            placeholder="예) 이번 달에 이직을 준비해도 될까?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </label>

        <button type="button" className="btn" onClick={() => startNew(topic, question)}>
          {session ? '새로 시작하기' : '카드 섞으러 가기'}
        </button>
        {session && <p className="tarot-note">새로 시작하면 진행 중인 리딩은 사라져요.</p>}
      </section>

      <p className="tarot-note">엔터테인먼트 목적의 콘텐츠입니다.</p>
    </PageLayout>
  );
}
