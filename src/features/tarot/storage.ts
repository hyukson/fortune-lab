// 담당: 장진영
// 타로 진행 상황(세션)을 localStorage에 저장/불러오기 → 새로고침해도 이어서 진행 가능
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 함수 단위로 작성했습니다. (AI 사용 비율: 약 100%)

import { DECK_SIZE } from './deck';

export type Topic = 'love' | 'money' | 'career';

export const TOPIC_LABELS: Record<Topic, string> = {
  love: '연애',
  money: '금전',
  career: '진로',
};

/** 카드가 놓이는 3개의 자리 */
export const POSITION_LABELS = ['과거', '현재', '미래'] as const;

/**
 * 진행 단계
 * - shuffle: 카드를 섞는 중 (아직 순서가 정해지지 않음)
 * - pick:    섞기 완료 → 순서·정역방향 확정, 3장 고르는 중
 * - reveal:  3장 다 골랐고, 한 장씩 뒤집는 중
 * - done:    3장 모두 뒤집음 → 해석 결과 화면(TarotResult.tsx)을 볼 수 있음
 */
export type Phase = 'shuffle' | 'pick' | 'reveal' | 'done';

/** 저장되는 리딩 1회분의 모든 정보 */
export type TarotSession = {
  version: 1;
  id: string; // 리딩마다 다른 고유값 (새로 시작하면 바뀜)
  createdAt: string; // 시작 시각 (ISO 문자열)
  topic: Topic;
  question: string; // 사용자가 적은 고민 (선택)
  phase: Phase;
  order: number[]; // 섞인 카드 순서 (카드 id 78개). shuffle 단계에서는 빈 배열
  reversed: boolean[]; // 카드 id별 역방향 여부 (78개). shuffle 단계에서는 빈 배열
  picked: number[]; // 고른 카드 id (최대 3개, 고른 순서 = 과거·현재·미래)
  flipped: boolean[]; // 자리별 뒤집힘 여부 [과거, 현재, 미래]
};

const STORAGE_KEY = 'fortune-lab:tarot:session';

/**
 * 새 리딩 세션을 만드는 함수 (아직 섞기 전 상태)
 * [AI 도움: Claude] 함수 작성
 */
export function createSession(topic: Topic, question: string): TarotSession {
  return {
    version: 1,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    topic,
    question: question.trim(),
    phase: 'shuffle',
    order: [],
    reversed: [],
    picked: [],
    flipped: [false, false, false],
  };
}

/**
 * 세션을 localStorage에 저장하는 함수.
 * 사생활 보호 모드 등에서 저장이 막히면 조용히 무시합니다(앱은 계속 동작).
 * [AI 도움: Claude] 함수 작성
 */
export function saveSession(session: TarotSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* 저장 불가 환경 → 무시 */
  }
}

/**
 * 저장된 세션을 불러오는 함수.
 * 저장된 값이 깨졌거나 형식이 다르면 null을 돌려줍니다 (잘못된 데이터로 화면이 고장나지 않게).
 * [AI 도움: Claude] 검증 로직 작성
 */
export function loadSession(): TarotSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as TarotSession;
    return isValidSession(s) ? s : null;
  } catch {
    return null;
  }
}

/** 저장된 세션 삭제 ("새로 시작"할 때 사용) */
export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* 무시 */
  }
}

/**
 * 불러온 데이터가 올바른 세션 모양인지 검사하는 함수.
 * [AI 도움: Claude] 함수 작성
 */
function isValidSession(s: TarotSession): boolean {
  if (!s || s.version !== 1 || !(s.topic in TOPIC_LABELS)) return false;
  if (!['shuffle', 'pick', 'reveal', 'done'].includes(s.phase)) return false;
  if (!Array.isArray(s.picked) || !Array.isArray(s.flipped) || s.flipped.length !== 3) return false;
  if (s.phase === 'shuffle') return true;
  // 섞기가 끝난 세션이면 순서·정역방향이 78장 모두 있어야 함
  if (s.order?.length !== DECK_SIZE || s.reversed?.length !== DECK_SIZE) return false;
  // 고른 카드가 실제 덱에 있는 서로 다른 카드인지 확인
  const unique = new Set(s.picked);
  return s.picked.length <= 3 && unique.size === s.picked.length && s.picked.every((id) => s.order.includes(id));
}
