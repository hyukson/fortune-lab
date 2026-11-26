// 담당: 장진영
// 타로 해석 만들기: 카드 해석 데이터 + 주제·자리 문장 틀 + 종합 규칙 → 결과 문장
//
// 산출 방식 (AI가 운세를 "맞히는" 것이 아니라, 정해진 데이터와 규칙으로 문장을 조립합니다)
//   ① 카드 의미: meaningsMajor.ts / meaningsMinor.ts 에 카드마다 정·역방향으로 저장
//   ② 문장 틀: 주제(연애·금전·진로) × 자리(과거·현재·미래) = 9개 틀에 ①의 의미 구절을 끼워 넣음
//   ③ 행동 제안: 미래 카드의 action 문장 (칸 제목은 주제별로 다름: ACTION_TITLE)
//   ④ 종합 한 줄: 세 카드의 키워드로 흐름 문장을 만들고, 카드 구성(역방향 수·메이저 수·슈트)에 따라 설명을 덧붙임
//   → 같은 카드·같은 방향·같은 주제면 항상 같은 결과가 나옵니다.
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 함수 단위로 작성했습니다. (AI 사용 비율: 약 100%)

import { DECK, SUIT_NAMES, type Suit, type TarotCard } from './deck';
import { MAJOR_MEANINGS, type MeaningSide } from './meaningsMajor';
import { MINOR_MEANINGS } from './meaningsMinor';
import { POSITION_LABELS, TOPIC_LABELS, type TarotSession, type Topic } from './storage';

/** 결과 화면에 보여 줄 카드 한 장의 해석 */
export type CardReading = {
  position: (typeof POSITION_LABELS)[number]; // '과거' | '현재' | '미래'
  card: TarotCard;
  reversed: boolean;
  keywords: string[];
  text: string; // 자리·주제에 맞춘 해석 문장
  action?: string; // 미래 자리에만 있는 행동 제안
};

/** 리딩 전체의 해석 결과 (다른 팀원 코드에서도 이 형식으로 가져다 쓸 수 있음) */
export type TarotReading = {
  topic: Topic;
  topicLabel: string;
  question: string;
  cards: CardReading[]; // [과거, 현재, 미래]
  summary: string; // 종합 한 줄
  notes: string[]; // 종합 한 줄 아래 덧붙이는 설명 1~2개
};

/**
 * 카드 id와 방향으로 해석 데이터 한 쪽(정 또는 역)을 꺼내는 함수
 * [AI 도움: Claude]
 */
export function getMeaning(cardId: number, reversed: boolean): MeaningSide {
  const c = DECK[cardId];
  const m = c.arcana === 'major' ? MAJOR_MEANINGS[c.number] : MINOR_MEANINGS[c.suit!][c.number - 1];
  return reversed ? m.rev : m.up;
}

/**
 * 주제 × 자리 문장 틀 9개. {m} 자리에 카드의 meaning 구절("~는")이 들어갑니다.
 * 예) 연애·과거 + 바보 정방향 → "지난 연애와 관계에는 두려움 없이 새로운 길로 첫발을 내딛는 시간이 있었어요."
 */
const TEMPLATES: Record<Topic, [string, string, string]> = {
  love: [
    '지난 연애와 관계에는 {m} 시간이 있었어요. 그 경험이 지금 마음의 바탕이 되었어요.',
    '지금 당신의 연애는 {m} 흐름 속에 있어요.',
    '앞으로 마음의 흐름은 {m} 쪽으로 움직일 가능성이 커요.',
  ],
  money: [
    '지금까지 돈과 관련해서는 {m} 시기를 지나왔어요. 그때의 습관이 지금의 재정에 남아 있어요.',
    '현재 금전 상황은 {m} 흐름 속에 있어요.',
    '앞으로 금전운은 {m} 쪽으로 흘러갈 가능성이 커요.',
  ],
  career: [
    '지금까지의 공부와 일에는 {m} 시간이 있었어요. 그 경험이 지금의 실력이 되었어요.',
    '지금 진로 앞에서 당신은 {m} 흐름 속에 있어요.',
    '앞으로의 진로는 {m} 쪽으로 열릴 가능성이 커요.',
  ],
};

/** 행동 제안 칸의 주제별 제목 (결과 화면에서 사용) */
export const ACTION_TITLE: Record<Topic, string> = {
  love: '좋은 관계를 위해 이렇게 해 보세요',
  money: '돈의 흐름을 위해 이렇게 해 보세요',
  career: '진로를 위해 이렇게 해 보세요',
};

/** 슈트별로 고민의 중심이 되는 주제 (같은 슈트가 2장 이상 나오면 종합에 덧붙임) */
const SUIT_THEME: Record<Suit, string> = {
  wands: '열정과 행동',
  cups: '감정과 관계',
  swords: '생각과 결정',
  pentacles: '돈과 현실',
};

/**
 * 단어 끝 글자에 받침이 있는지에 따라 "으로/로"를 골라 주는 함수
 * (받침이 없거나 'ㄹ' 받침이면 "로", 그 외 받침이면 "으로")
 * [AI 도움: Claude]
 */
function withRo(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return `${word}로`; // 한글이 아니면 "로"
  const jong = code % 28; // 받침 번호 (0 = 받침 없음, 8 = ㄹ)
  return jong === 0 || jong === 8 ? `${word}로` : `${word}으로`;
}

/**
 * 세 카드를 모두 반영한 종합 한 줄 + 덧붙임 설명을 만드는 함수
 * - 한 줄: "{과거 키워드}에서 {현재 키워드}로 이어진 흐름이 {미래 키워드}로 향하고 있어요."
 * - 설명(최대 2개): 메이저 2장 이상 / 같은 슈트 2장 이상 / 역방향 개수 / 미래 카드 방향 순으로 골라 붙임
 * [AI 도움: Claude] 규칙 설계·작성
 */
function buildSummary(ids: number[], reversed: boolean[], sides: MeaningSide[]) {
  const [past, now, future] = sides.map((s) => s.keywords[0]);
  const summary = `${past}에서 ${withRo(now)} 이어진 흐름이 ${withRo(future)} 향하고 있어요.`;

  const notes: string[] = [];
  const cards = ids.map((id) => DECK[id]);
  const majors = cards.filter((c) => c.arcana === 'major').length;
  const revCount = reversed.filter(Boolean).length;

  // ① 메이저 아르카나가 많으면 "큰 흐름"
  if (majors >= 2) notes.push(`메이저 아르카나가 ${majors}장 나와, 삶에서 중요한 흐름이 움직이는 시기예요.`);

  // ② 같은 슈트가 2장 이상이면 그 슈트의 주제가 고민의 중심
  const suitCount = new Map<Suit, number>();
  for (const c of cards) if (c.suit) suitCount.set(c.suit, (suitCount.get(c.suit) ?? 0) + 1);
  for (const [suit, n] of suitCount) {
    if (n >= 2) notes.push(`${SUIT_NAMES[suit][0]} 카드가 ${n}장이라, 이번 고민은 '${SUIT_THEME[suit]}'에 무게가 실려 있어요.`);
  }

  // ③ 역방향 개수
  if (revCount >= 2) notes.push('역방향 카드가 많아, 서두르기보다 멈춰서 점검하고 정리하면 좋은 때예요.');
  else if (revCount === 0) notes.push('세 장 모두 정방향이라 전체 흐름이 순조로운 편이에요.');

  // ④ 미래 카드 방향
  notes.push(
    reversed[2]
      ? '미래 카드가 역방향이지만, 아래 행동 제안을 실천하면 흐름을 충분히 바꿀 수 있어요.'
      : '미래 카드가 정방향이라 지금처럼 나아가면 밝은 쪽으로 이어질 가능성이 커요.',
  );

  return { summary, notes: notes.slice(0, 2) };
}

/**
 * 세션(고른 카드 3장 + 정역방향 + 주제)으로 리딩 전체의 해석을 만드는 함수.
 * 3장을 다 고르지 않았으면 null을 돌려줍니다.
 * [AI 도움: Claude]
 */
export function interpretReading(session: TarotSession): TarotReading | null {
  if (session.picked.length < 3 || session.reversed.length === 0) return null;
  const ids = session.picked.slice(0, 3);
  const reversed = ids.map((id) => session.reversed[id]);
  const sides = ids.map((id, k) => getMeaning(id, reversed[k]));
  const templates = TEMPLATES[session.topic];

  const cards: CardReading[] = ids.map((id, k) => ({
    position: POSITION_LABELS[k],
    card: DECK[id],
    reversed: reversed[k],
    keywords: sides[k].keywords,
    text: templates[k].replace('{m}', sides[k].meaning),
    action: k === 2 ? sides[k].action : undefined,
  }));

  return {
    topic: session.topic,
    topicLabel: TOPIC_LABELS[session.topic],
    question: session.question,
    cards,
    ...buildSummary(ids, reversed, sides),
  };
}
