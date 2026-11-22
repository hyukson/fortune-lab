// 담당: 김예진
// 브라우저(localStorage)에 사용자ID · 마지막 생년월일 · 조회 기록 저장
// 서버가 없으므로 기록은 "이 브라우저"에만 남습니다.
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 작성했습니다. (AI 사용 비율: 약 100%)

const KEY_USER = 'zodiac-user-id';
const KEY_BIRTH = 'zodiac-last-birth';
const KEY_HISTORY = 'zodiac-history';
const MAX_HISTORY = 30;

export type ZodiacRecord = {
  date: string; // 조회 날짜
  birth: string; // 생년월일
  signId: string;
  rank: number;
};

/** localStorage는 시크릿 창 등에서 막혀 있을 수 있어서 try로 감쌈 */
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 저장이 안 돼도 운세 보기는 그대로 동작
  }
}

/** 사용자ID: 처음 방문 시 무작위로 만들고 계속 같은 값을 사용 (로그인이 없어서 브라우저별 ID) */
export function getUserId(): string {
  let id = read(KEY_USER);
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    write(KEY_USER, id);
  }
  return id;
}

export function loadLastBirth(): string {
  return read(KEY_BIRTH) ?? '';
}

export function saveLastBirth(birth: string) {
  write(KEY_BIRTH, birth);
}

/** 최신 기록이 앞에 오도록 정렬된 목록 */
export function loadHistory(): ZodiacRecord[] {
  try {
    const list = JSON.parse(read(KEY_HISTORY) ?? '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** 기록 저장 (같은 생일·같은 날짜는 하나만 남김) → 저장 후 목록을 돌려줌 */
export function saveRecord(record: ZodiacRecord): ZodiacRecord[] {
  const others = loadHistory().filter((r) => !(r.date === record.date && r.birth === record.birth));
  const next = [record, ...others]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_HISTORY);
  write(KEY_HISTORY, JSON.stringify(next));
  return next;
}

/** 같은 생일로 본 기록 중, 이번 조회 날짜보다 이전의 가장 최근 기록 */
export function findPrevious(history: ZodiacRecord[], birth: string, date: string): ZodiacRecord | undefined {
  return history.find((r) => r.birth === birth && r.date < date);
}

export function clearHistory() {
  write(KEY_HISTORY, '[]');
}
