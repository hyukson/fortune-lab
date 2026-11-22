import { useState, type FormEvent } from 'react';
import PageLayout from '../../components/PageLayout';
import DownloadButton from '../download/DownloadButton';
import { formatDate, getDailyRanking, getFortune, todayString, type Fortune, type Scores } from './fortune';
import { getSignById } from './signs';
import {
  clearHistory,
  findPrevious,
  getUserId,
  loadHistory,
  loadLastBirth,
  saveLastBirth,
  saveRecord,
  type ZodiacRecord,
} from './storage';
import './zodiac.css';

// 담당: 김예진
// 별자리 운세 페이지: 생년월일 입력 → 내 별자리 순위(어제 대비 변동) + 전체·분야별 운세 + 조언·행운 정보
//                    + 12별자리 순위표 + 지난 조회 기록 비교
// 산출 방식은 fortune.ts 맨 위 설명 참고
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 작성했습니다. (AI 사용 비율: 약 100%)

const AREAS: { key: keyof Scores; label: string; icon: string }[] = [
  { key: 'love', label: '애정운', icon: '♡' },
  { key: 'money', label: '금전운', icon: '◎' },
  { key: 'study', label: '학업·일', icon: '✎' },
  { key: 'health', label: '건강운', icon: '✚' },
];

/** 1~5점 → ★★★☆☆ */
const stars = (score: number) => '★'.repeat(score) + '☆'.repeat(5 - score);

/** 순위 변동 배지: ▲3 / ▼2 / — */
function ChangeBadge({ change, long = false }: { change: number; long?: boolean }) {
  if (change > 0) return <span className="zodiac-change is-up">▲ {change}{long && '계단 상승'}</span>;
  if (change < 0) return <span className="zodiac-change is-down">▼ {-change}{long && '계단 하락'}</span>;
  return <span className="zodiac-change">—{long && ' 변동 없음'}</span>;
}

export default function ZodiacPage() {
  const today = todayString();
  const [birth, setBirth] = useState(() => loadLastBirth());
  const [date, setDate] = useState(today);
  const [fortune, setFortune] = useState<Fortune | null>(null);
  const [history, setHistory] = useState<ZodiacRecord[]>(() => loadHistory());
  const [previous, setPrevious] = useState<ZodiacRecord | undefined>();
  const [error, setError] = useState('');

  /** "운세 보기" 버튼 */
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!birth) return setError('생년월일을 입력해 주세요.');
    if (birth > today) return setError('생년월일이 미래 날짜예요.');
    if (birth < '1900-01-01') return setError('1900년 이후 날짜를 입력해 주세요.');
    setError('');

    const result = getFortune(birth, date, getUserId());
    // 저장하기 전에 "이전 기록"을 먼저 찾아 둠 (저장 후에 찾으면 방금 기록과 비교하게 됨)
    setPrevious(findPrevious(loadHistory(), birth, date));
    setHistory(saveRecord({ date, birth, signId: result.sign.id, rank: result.rank }));
    saveLastBirth(birth);
    setFortune(result);
  }

  function handleClearHistory() {
    clearHistory();
    setHistory([]);
    setPrevious(undefined);
  }

  const ranking = getDailyRanking(fortune?.date ?? date);

  return (
    <PageLayout title="별자리 운세" desc="생년월일로 보는 오늘의 별자리 운세">
      <form className="zodiac-form" onSubmit={handleSubmit}>
        <label className="zodiac-field">
          <span>생년월일</span>
          <input type="date" value={birth} max={today} min="1900-01-01" onChange={(e) => setBirth(e.target.value)} />
        </label>
        <label className="zodiac-field">
          <span>운세 볼 날짜</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value || today)} />
        </label>
        <button className="btn" type="submit">운세 보기</button>
        {error && <p className="zodiac-error">{error}</p>}
      </form>

      {fortune && (
        <>
          {/* 이 영역이 이미지로 저장됩니다 (DownloadButton targetId) */}
          <section id="zodiac-result" className="zodiac-result">
            <p className="zodiac-eyebrow">Today's Horoscope</p>
            <p className="zodiac-date">{formatDate(fortune.date)}</p>

            <div className="zodiac-hero">
              <span className="zodiac-symbol" aria-hidden="true">{fortune.sign.symbol}</span>
              <div>
                <p className="zodiac-sign-name">{fortune.sign.name}</p>
                <p className="zodiac-sign-period">{fortune.sign.period}</p>
              </div>
              <div className="zodiac-rank-box">
                <p className="zodiac-rank">
                  {fortune.rank}<small>위</small>
                </p>
                <p className="zodiac-yesterday">
                  어제 {fortune.yesterdayRank}위 <ChangeBadge change={fortune.change} long />
                </p>
              </div>
            </div>

            <h2 className="zodiac-headline">“{fortune.headline}”</h2>
            <p className="zodiac-message">{fortune.message}</p>

            <h3 className="zodiac-subtitle"><span>Fortune</span> 분야별 운세</h3>
            <ul className="zodiac-areas">
              {AREAS.map(({ key, label, icon }) => (
                <li key={key} className="zodiac-area">
                  <div className="zodiac-area-head">
                    <span className="zodiac-area-label"><span aria-hidden="true">{icon}</span> {label}</span>
                    <span className="zodiac-stars" aria-label={`5점 중 ${fortune.scores[key]}점`}>
                      {stars(fortune.scores[key])}
                    </span>
                  </div>
                  <p>{fortune.areaMessages[key]}</p>
                </li>
              ))}
            </ul>

            <h3 className="zodiac-subtitle"><span>Advice</span> 오늘의 조언</h3>
            <p className="zodiac-advice">{fortune.advice}</p>

            <h3 className="zodiac-subtitle"><span>Lucky</span> 오늘의 행운</h3>
            <div className="zodiac-lucky">
              <div className="zodiac-lucky-item">
                <span>행운의 색</span>
                <strong>{fortune.luckyColor.emoji} {fortune.luckyColor.name}</strong>
              </div>
              <div className="zodiac-lucky-item">
                <span>행운의 아이템</span>
                <strong>{fortune.luckyItem}</strong>
              </div>
              <div className="zodiac-lucky-item">
                <span>행운의 숫자</span>
                <strong>{fortune.luckyNumber}</strong>
              </div>
              <div className="zodiac-lucky-item">
                <span>오늘의 행동</span>
                <strong>{fortune.luckyAction}</strong>
              </div>
            </div>

            <p className="zodiac-notice">엔터테인먼트 목적의 콘텐츠입니다.</p>
          </section>

          <Comparison fortune={fortune} previous={previous} />

          <div className="zodiac-actions">
            <DownloadButton targetId="zodiac-result" />
          </div>
        </>
      )}

      <section className="zodiac-section">
        <p className="zodiac-eyebrow">Ranking</p>
        <h2 className="zodiac-section-title">{formatDate(fortune?.date ?? date)} 별자리 순위</h2>
        <ol className="zodiac-ranking">
          {ranking.map((row) => (
            <li key={row.sign.id} className={row.sign.id === fortune?.sign.id ? 'zodiac-row is-mine' : 'zodiac-row'}>
              <span className="zodiac-row-rank">{row.rank}</span>
              <span className="zodiac-row-symbol" aria-hidden="true">{row.sign.symbol}</span>
              <span className="zodiac-row-name">{row.sign.name}</span>
              <span className="zodiac-row-comment">{row.comment}</span>
              <span className="zodiac-row-change" title={`어제 ${row.yesterdayRank}위`}>
                <ChangeBadge change={row.change} />
              </span>
            </li>
          ))}
        </ol>
        <p className="zodiac-hint">▲▼ 는 어제 순위와 비교한 변동이에요.</p>
      </section>

      {history.length > 0 && (
        <section className="zodiac-section">
          <div className="zodiac-section-head">
            <div>
              <p className="zodiac-eyebrow">History</p>
              <h2 className="zodiac-section-title">내 조회 기록</h2>
            </div>
            <button type="button" className="zodiac-text-btn" onClick={handleClearHistory}>기록 지우기</button>
          </div>
          <ul className="zodiac-history">
            {history.map((r) => (
              <li key={`${r.date}|${r.birth}`}>
                <span>{formatDate(r.date)}</span>
                <span>{getSignById(r.signId)?.name}</span>
                <strong>{r.rank}위</strong>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageLayout>
  );
}

/** 지난번 조회 기록과 순위 비교 (어제가 아니라 "마지막으로 본 날"과 비교) */
function Comparison({ fortune, previous }: { fortune: Fortune; previous?: ZodiacRecord }) {
  if (!previous) {
    return <p className="zodiac-compare">첫 조회예요! 다음에 다시 보면 이번 순위와 비교해 드릴게요.</p>;
  }
  return (
    <p className="zodiac-compare">
      마지막 조회({formatDate(previous.date)}) <strong>{previous.rank}위</strong> → 이번 <strong>{fortune.rank}위</strong>{' '}
      <ChangeBadge change={previous.rank - fortune.rank} long />
    </p>
  );
}
