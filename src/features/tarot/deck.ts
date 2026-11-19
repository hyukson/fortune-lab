// 담당: 장진영
// 타로 덱(78장) 정의 + 섞기(Fisher–Yates) + 정/역방향 결정
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 함수 단위로 작성했습니다. (AI 사용 비율: 약 100%)
//   - 직접 수정한 부분이 생기면 해당 함수 주석에 "(수정: 장진영)"을 덧붙여 주세요.

/** 카드 종류: 메이저 아르카나 22장 / 마이너 아르카나 56장 */
export type Arcana = 'major' | 'minor';

/** 마이너 아르카나의 4가지 슈트(무늬) */
export type Suit = 'wands' | 'cups' | 'swords' | 'pentacles';

/** 카드 한 장의 기본 정보 (해석 문장은 2차에서 interpretations.ts에 추가 예정) */
export type TarotCard = {
  id: number; // 0~77 고유 번호. 저장할 때는 이 번호만 저장합니다.
  arcana: Arcana;
  nameKo: string;
  nameEn: string;
  number: number; // 메이저: 0~21, 마이너: 1(에이스)~14(왕)
  suit?: Suit; // 마이너 아르카나만 가짐
};

// 메이저 아르카나 22장 이름 [한국어, 영어]
const MAJOR_NAMES: [string, string][] = [
  ['바보', 'The Fool'],
  ['마법사', 'The Magician'],
  ['여사제', 'The High Priestess'],
  ['여황제', 'The Empress'],
  ['황제', 'The Emperor'],
  ['교황', 'The Hierophant'],
  ['연인', 'The Lovers'],
  ['전차', 'The Chariot'],
  ['힘', 'Strength'],
  ['은둔자', 'The Hermit'],
  ['운명의 수레바퀴', 'Wheel of Fortune'],
  ['정의', 'Justice'],
  ['매달린 사람', 'The Hanged Man'],
  ['죽음', 'Death'],
  ['절제', 'Temperance'],
  ['악마', 'The Devil'],
  ['탑', 'The Tower'],
  ['별', 'The Star'],
  ['달', 'The Moon'],
  ['태양', 'The Sun'],
  ['심판', 'Judgement'],
  ['세계', 'The World'],
];

/** 슈트 이름 [한국어, 영어] */
export const SUIT_NAMES: Record<Suit, [string, string]> = {
  wands: ['완드', 'Wands'],
  cups: ['컵', 'Cups'],
  swords: ['소드', 'Swords'],
  pentacles: ['펜타클', 'Pentacles'],
};

const SUIT_ORDER: Suit[] = ['wands', 'cups', 'swords', 'pentacles'];

// 마이너 아르카나 숫자(1~14) 이름 [한국어, 영어]
const RANK_NAMES: [string, string][] = [
  ['에이스', 'Ace'],
  ['2', 'Two'],
  ['3', 'Three'],
  ['4', 'Four'],
  ['5', 'Five'],
  ['6', 'Six'],
  ['7', 'Seven'],
  ['8', 'Eight'],
  ['9', 'Nine'],
  ['10', 'Ten'],
  ['시종', 'Page'],
  ['기사', 'Knight'],
  ['여왕', 'Queen'],
  ['왕', 'King'],
];

/**
 * 78장 덱을 만드는 함수.
 * - id 0~21: 메이저 아르카나 (바보 ~ 세계)
 * - id 22~77: 마이너 아르카나 (완드 → 컵 → 소드 → 펜타클 순, 각 14장)
 * [AI 도움: Claude] 카드 목록 생성 로직 작성
 */
function buildDeck(): TarotCard[] {
  const cards: TarotCard[] = MAJOR_NAMES.map(([ko, en], i) => ({
    id: i,
    arcana: 'major',
    nameKo: ko,
    nameEn: en,
    number: i,
  }));

  SUIT_ORDER.forEach((suit) => {
    const [suitKo, suitEn] = SUIT_NAMES[suit];
    RANK_NAMES.forEach(([rankKo, rankEn], r) => {
      cards.push({
        id: cards.length,
        arcana: 'minor',
        suit,
        number: r + 1,
        nameKo: `${suitKo} ${rankKo}`,
        nameEn: `${rankEn} of ${suitEn}`,
      });
    });
  });

  return cards;
}

/** 전체 78장 덱 (프로그램 실행 중 바뀌지 않음) */
export const DECK: TarotCard[] = buildDeck();
export const DECK_SIZE = DECK.length; // 78

/**
 * 0 이상 max 미만의 정수를 "고르게" 뽑는 함수.
 * Math.random 대신 브라우저의 암호학적 난수(crypto)를 써서 치우침을 줄였습니다.
 * (나머지 연산 때문에 생기는 미세한 치우침도 '거절 샘플링'으로 제거)
 * [AI 도움: Claude] 난수 함수 작성
 */
export function randomInt(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max; // max의 배수 중 2^32 이하 최댓값
  const buf = new Uint32Array(1);
  let x: number;
  do {
    crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return x % max;
}

/**
 * Fisher–Yates 셔플: 배열을 무작위로 섞은 "새 배열"을 돌려줍니다.
 * 뒤에서부터 한 칸씩, 자기 자신 포함 앞쪽의 아무 칸과 자리를 바꿉니다.
 * → 78! 가지 순서가 모두 같은 확률로 나오는 공정한 섞기 방법.
 * [AI 도움: Claude] 알고리즘 구현
 */
export function shuffle<T>(arr: readonly T[]): T[] {
  const result = arr.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1); // 0 ~ i 중 하나
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 섞기가 끝나는 순간 호출해서 "이번 리딩의 운명"을 확정하는 함수.
 * - order: 화면에 깔릴 카드 순서 (카드 id 배열, 78개)
 * - reversed: 카드 id별 역방향 여부 (true면 역방향, 50% 확률)
 * 이 결과를 그대로 저장하기 때문에 새로고침/이어하기를 해도 결과가 바뀌지 않습니다.
 * [AI 도움: Claude] 함수 작성
 */
export function createShuffledDeck(): { order: number[]; reversed: boolean[] } {
  const order = shuffle(DECK.map((c) => c.id));
  const reversed = DECK.map(() => randomInt(2) === 1);
  return { order, reversed };
}
