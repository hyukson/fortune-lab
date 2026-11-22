// 담당: 김예진
// "같은 입력 → 항상 같은 결과"를 만들기 위한 해시 + 난수 함수
//
// Math.random()은 새로고침할 때마다 결과가 바뀌기 때문에 쓰지 않습니다.
// 대신 문자열(예: "2026-11-22")을 숫자(시드)로 바꾸고, 그 시드로 난수를 만들면
// 같은 날에는 몇 번을 다시 봐도 같은 결과가 나옵니다.
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 작성했습니다. (AI 사용 비율: 약 100%)

/** 문자열 → 32비트 정수 (FNV-1a 해시) */
export function hashString(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** 시드로 0 이상 1 미만의 난수를 계속 만들어 주는 함수를 돌려줌 (mulberry32 알고리즘) */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 문자열에서 바로 난수 함수 만들기 */
export function randomFrom(text: string): () => number {
  return createRandom(hashString(text));
}

/** 배열에서 하나 고르기 */
export function pick<T>(random: () => number, list: readonly T[]): T {
  return list[Math.floor(random() * list.length)];
}

/** 배열 섞기 (Fisher-Yates) — 원본은 그대로 두고 새 배열을 돌려줌 */
export function shuffle<T>(random: () => number, list: readonly T[]): T[] {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
