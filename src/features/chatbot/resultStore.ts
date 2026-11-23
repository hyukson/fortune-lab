// 담당: 김예진
// 운세 결과 보관함 — 손금·관상·별자리·타로 결과를 "같은 모양"으로 저장해서 AI 운세 상담이 불러다 씀
//
// 각 기능 담당자는 결과 화면이 나올 때 saveFortuneResult()를 한 번만 부르면 됩니다.
// 사용법·예시는 같은 폴더의 README.md 참고
// 결과는 이 브라우저(localStorage)에만 저장되고 서버로 보내지 않습니다. (사진도 저장하지 않음)
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 작성했습니다. (AI 사용 비율: 약 100%)

/** 테스트 종류 */
export type FortuneKind = 'palm' | 'face' | 'zodiac' | 'tarot';

/** 상담 주제 (질문을 이 4가지로 분류해서 답함) */
export type FortuneTopic = 'love' | 'money' | 'career' | 'health';

export type FortuneResult = {
  kind: FortuneKind;
  title: string; // 결과 한 줄 제목  예) "물고기자리 · 오늘 4위", "현재: 컵 3 (정방향)"
  summary: string; // 전체 풀이 요약 1~3문장
  topics?: Partial<Record<FortuneTopic, string>>; // 분야별 한 줄 풀이 (있는 것만)
  scores?: Partial<Record<FortuneTopic, number>>; // 분야별 점수 1~5 (있는 것만)
  savedAt?: string; // 저장 시각 — 자동으로 채워짐
};

export const KIND_LABELS: Record<FortuneKind, string> = {
  palm: '손금',
  face: '관상',
  zodiac: '별자리 운세',
  tarot: '타로',
};

export const KIND_PATHS: Record<FortuneKind, string> = {
  palm: '/palm',
  face: '/face',
  zodiac: '/zodiac',
  tarot: '/tarot',
};

export const TOPIC_LABELS: Record<FortuneTopic, string> = {
  love: '애정운',
  money: '금전운',
  career: '학업·진로운',
  health: '건강운',
};

const STORAGE_KEY = 'fortune-lab:results';
export const RESULTS_CHANGED = 'fortune-lab:results-changed'; // 같은 탭 안에서 변경 알림용 이벤트 이름

type Store = Partial<Record<FortuneKind, FortuneResult>>;

function readStore(): Store {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

/** 결과 저장 (종류별로 가장 최근 결과 1개만 남김) */
export function saveFortuneResult(result: FortuneResult) {
  try {
    const store = readStore();
    store[result.kind] = { ...result, savedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new Event(RESULTS_CHANGED));
  } catch {
    // 저장이 막혀 있어도(시크릿 창 등) 각 기능은 그대로 동작해야 하므로 조용히 넘어감
  }
}

/** 저장된 결과 전부 (테스트 순서대로) */
export function loadFortuneResults(): FortuneResult[] {
  const store = readStore();
  return (['palm', 'face', 'zodiac', 'tarot'] as FortuneKind[])
    .map((kind) => store[kind])
    .filter((r): r is FortuneResult => !!r && typeof r.summary === 'string');
}

export function clearFortuneResults() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(RESULTS_CHANGED));
  } catch {
    // 무시
  }
}

/**
 * 저장된 결과를 하나의 글로 정리 — 나중에 진짜 AI를 연결할 때 이 글을 AI에게 "사용자 정보"로 넘기면 됨
 */
export function resultsToContext(results: FortuneResult[]): string {
  return results
    .map((r) => {
      const lines = [`[${KIND_LABELS[r.kind]}] ${r.title}`, `요약: ${r.summary}`];
      for (const [topic, text] of Object.entries(r.topics ?? {})) {
        const score = r.scores?.[topic as FortuneTopic];
        lines.push(`- ${TOPIC_LABELS[topic as FortuneTopic]}${score ? ` (${score}/5)` : ''}: ${text}`);
      }
      return lines.join('\n');
    })
    .join('\n\n');
}
