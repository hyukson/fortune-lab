import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { getReply, greeting, suggestions, type ChatMessage } from './replies';
import {
  KIND_LABELS,
  KIND_PATHS,
  RESULTS_CHANGED,
  clearFortuneResults,
  loadFortuneResults,
  saveFortuneResult,
  type FortuneKind,
  type FortuneResult,
} from './resultStore';
import './chatbot.css';

// 담당: 김예진
// 메인 페이지 맨 아래 "AI 운세 상담" 채팅 칸
//  - 사용자가 본 테스트 결과(손금·관상·별자리·타로)를 보관함에서 불러와 상담에 사용
//  - 답변 로직은 replies.ts의 getReply() 하나에 모여 있음 → AI 연결 시 그 함수만 교체
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 작성했습니다. (AI 사용 비율: 약 100%)

const TYPING_DELAY = 600; // 답변 전 "입력 중..." 표시 시간(ms)
const KINDS: FortuneKind[] = ['palm', 'face', 'zodiac', 'tarot'];

export default function ChatbotSection() {
  const [results, setResults] = useState<FortuneResult[]>(() => loadFortuneResults());
  const [messages, setMessages] = useState<ChatMessage[]>(() => [greeting(loadFortuneResults())]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // 다른 탭에서 테스트를 보고 오거나 결과가 바뀌면 다시 불러옴
  useEffect(() => {
    const reload = () => {
      const next = loadFortuneResults();
      setResults(next);
      // 아직 대화를 시작하지 않았다면 인사말도 새 결과에 맞게 바꿈
      setMessages((prev) => (prev.length === 1 ? [greeting(next)] : prev));
    };
    window.addEventListener(RESULTS_CHANGED, reload);
    window.addEventListener('storage', reload);
    window.addEventListener('focus', reload);
    return () => {
      window.removeEventListener(RESULTS_CHANGED, reload);
      window.removeEventListener('storage', reload);
      window.removeEventListener('focus', reload);
    };
  }, []);

  // 새 메시지가 오면 채팅창 안에서만 맨 아래로 스크롤 (페이지 전체는 움직이지 않음)
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, typing]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || typing) return;
    const next: ChatMessage[] = [...messages, { role: 'user', text: question }];
    setMessages(next);
    setInput('');
    setTyping(true);
    try {
      const [reply] = await Promise.all([getReply(next, results), new Promise((r) => setTimeout(r, TYPING_DELAY))]);
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', text: '앗, 답변을 만드는 중에 문제가 생겼어요. 다시 한 번 물어봐 주세요.' }]);
    } finally {
      setTyping(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  function handleClear() {
    clearFortuneResults();
    setMessages([greeting([])]);
  }

  return (
    <section className="chatbot" aria-labelledby="chatbot-title">
      <header className="chatbot-head">
        <h2 id="chatbot-title">AI 운세 상담</h2>
        <span className="chatbot-badge">베타</span>
      </header>

      {/* 불러온 테스트 결과 현황 — 안 본 테스트는 누르면 그 페이지로 이동 */}
      <div className="chatbot-status">
        <span className="chatbot-status-label">불러온 결과</span>
        {KINDS.map((kind) => {
          const done = results.find((r) => r.kind === kind);
          return done ? (
            <span key={kind} className="chatbot-chip is-done" title={done.title}>
              ✓ {KIND_LABELS[kind]}
            </span>
          ) : (
            <Link key={kind} to={KIND_PATHS[kind]} className="chatbot-chip">
              + {KIND_LABELS[kind]}
            </Link>
          );
        })}
        {results.length > 0 && (
          <button type="button" className="chatbot-clear" onClick={handleClear}>
            결과 지우기
          </button>
        )}
        {import.meta.env.DEV && <DemoButton />}
      </div>

      <div className="chatbot-list" ref={listRef} aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`chatbot-msg is-${m.role}`}>
            <p>{m.text}</p>
            {m.link && (
              <Link to={m.link.to} className="chatbot-link">
                {m.link.label} →
              </Link>
            )}
          </div>
        ))}
        {typing && (
          <div className="chatbot-msg is-bot chatbot-typing" aria-label="답변 입력 중">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>

      <div className="chatbot-suggestions">
        {suggestions(results).map((s) => (
          <button key={s} type="button" onClick={() => send(s)} disabled={typing}>
            {s}
          </button>
        ))}
      </div>

      <form className="chatbot-form" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="고민을 물어보세요 (예: 이번 시험 잘 볼 수 있을까?)"
          aria-label="상담 메시지 입력"
          maxLength={200}
        />
        <button className="btn" type="submit" disabled={!input.trim() || typing}>
          보내기
        </button>
      </form>
      <p className="chatbot-note">본 테스트 결과를 모아 정해진 규칙으로 답하는 베타 버전이에요 · 엔터테인먼트 목적의 콘텐츠입니다</p>
    </section>
  );
}

/**
 * [개발용] 아직 결과 저장을 연결하지 않은 기능(손금·관상·타로)을 미리 시험해 보기 위한 예시 데이터 버튼
 * npm run dev 에서만 보이고, 배포된 사이트(npm run build)에는 나타나지 않음
 */
function DemoButton() {
  function fill() {
    saveFortuneResult({
      kind: 'palm',
      title: '[예시] 차분한 탐구형 손금',
      summary: '[예시] 생명선이 길고 또렷해 체력이 좋고, 두뇌선이 완만해 생각이 깊은 편이에요.',
      topics: {
        love: '[예시] 감정선이 길어 한 번 마음을 주면 오래 가는 타입이에요.',
        career: '[예시] 두뇌선이 완만한 곡선이라 창의적인 일에 강해요.',
        health: '[예시] 생명선이 끊김 없이 이어져 회복력이 좋아요.',
      },
    });
    saveFortuneResult({
      kind: 'face',
      title: '[예시] 균형 잡힌 중정형 관상',
      summary: '[예시] 이마·코·턱의 비율이 고르게 잡혀 있어 대인운이 좋은 얼굴이에요.',
      topics: {
        love: '[예시] 눈매가 부드러워 첫인상에서 호감을 주기 쉬워요.',
        money: '[예시] 콧방울이 단단해 재물을 지키는 힘이 있어요.',
        career: '[예시] 턱선이 안정적이라 맡은 일을 끝까지 해내는 편이에요.',
      },
      scores: { love: 4, money: 4, career: 3 },
    });
    saveFortuneResult({
      kind: 'tarot',
      title: '[예시] 연애 리딩 · 컵 2 / 별 / 완드 에이스',
      summary: '[예시] 과거의 인연(컵 2), 현재의 희망(별), 조언은 새로운 시작(완드 에이스)이에요.',
      topics: { love: '[예시] 지금은 희망이 피어나는 시기, 먼저 용기 내어 시작해 보라는 카드가 나왔어요.' },
    });
  }
  return (
    <button type="button" className="chatbot-clear" onClick={fill} title="개발 중에만 보이는 버튼">
      [개발용] 예시 결과 넣기
    </button>
  );
}
