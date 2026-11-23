// 담당: 김예진
// AI 운세 상담 — 답변 만들기
//
// 사용자가 본 테스트 결과(resultStore.ts의 보관함)를 불러와서, 질문 주제에 맞는 풀이를 모아 답합니다.
//   예) "연애운 어때?" → 별자리의 애정운 별점 + 관상의 애정 풀이 + 손금 감정선 풀이 + 타로(연애) 리딩 → 종합 조언
//
// ⚠️ 현재는 "규칙 기반" 답변입니다. 나중에 진짜 AI(언어 모델)를 연결할 때는 getReply()의 안쪽만 바꾸면 됩니다.
//   - resultsToContext(results)로 만든 글을 AI에게 "사용자의 운세 결과"로 함께 보내면 됨
//   - AI API 키는 브라우저 코드에 넣으면 누구나 볼 수 있으므로 반드시 별도 서버(프록시)를 거쳐야 함
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 작성했습니다. (AI 사용 비율: 약 100%)

import { formatDate, getDailyRanking, todayString } from '../zodiac/fortune';
import { getSign } from '../zodiac/signs';
import {
  KIND_LABELS,
  KIND_PATHS,
  TOPIC_LABELS,
  type FortuneKind,
  type FortuneResult,
  type FortuneTopic,
} from './resultStore';

export type ChatMessage = {
  role: 'user' | 'bot';
  text: string;
  link?: { to: string; label: string }; // 답변 아래 바로가기 버튼
};

const ALL_KINDS: FortuneKind[] = ['palm', 'face', 'zodiac', 'tarot'];

/** 질문 주제를 알아내기 위한 단어 목록 */
const TOPIC_WORDS: Record<FortuneTopic, string[]> = {
  love: ['연애', '사랑', '썸', '짝사랑', '애인', '남친', '여친', '남자친구', '여자친구', '이별', '고백', '궁합', '결혼', '애정', '데이트', '재회'],
  money: ['돈', '금전', '재물', '용돈', '월급', '투자', '저축', '알바', '소비', '부자', '재테크', '주식', '복권'],
  career: ['진로', '취업', '공부', '시험', '학업', '회사', '면접', '직장', '성적', '합격', '과제', '전공', '이직', '꿈', '자격증'],
  health: ['건강', '컨디션', '피곤', '잠', '운동', '다이어트', '아파', '아픈', '몸', '스트레스'],
};
const OVERALL_WORDS = ['종합', '전체', '전반', '총운', '오늘 운세', '오늘의 운세', '내 운세', '운세 어때', '결과 정리', '요약'];

const TOPIC_ICONS: Record<FortuneTopic, string> = { love: '💌', money: '💰', career: '📚', health: '🍀' };

/** 주제별 마무리 조언 [좋을 때, 보통일 때, 조심할 때] */
const TOPIC_ADVICE: Record<FortuneTopic, [string, string, string]> = {
  love: [
    '전체적으로 흐름이 좋아요. 마음에 담아 둔 말이 있다면 먼저 다가가 보세요.',
    '서두르기보다 상대의 속도를 살피면 자연스럽게 가까워질 거예요.',
    '지금은 감정을 바로 표현하기보다 한 템포 쉬면서 내 마음을 먼저 챙겨 보세요.',
  ],
  money: [
    '금전 흐름이 좋은 편이에요. 다만 기분에 따른 큰 지출보다 조금은 모아 두세요.',
    '꼭 필요한 것만 사는 습관이 운을 지켜 줘요.',
    '충동구매와 돈 거래는 잠시 미뤄 두는 게 좋겠어요.',
  ],
  career: [
    '노력한 만큼 결과가 따라오는 흐름이에요. 미뤄 둔 일을 시작해 보세요.',
    '큰 목표보다 오늘 할 일 세 가지를 정해서 하나씩 끝내 보세요.',
    '집중이 흐트러지기 쉬우니 짧게 끊어서 하고, 실수는 한 번 더 확인하세요.',
  ],
  health: [
    '에너지가 좋은 편이에요. 가벼운 운동으로 좋은 흐름을 이어 가세요.',
    '수면 리듬만 잘 지켜도 컨디션이 안정될 거예요.',
    '피로가 쌓였을 수 있어요. 오늘은 무리하지 말고 일찍 쉬세요.',
  ],
};

// ---------------------------------------------------------------------------
// 작은 도우미 함수들
// ---------------------------------------------------------------------------

const has = (text: string, words: string[]) => words.some((w) => text.includes(w));
const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

function findTopic(text: string): FortuneTopic | null {
  return (Object.keys(TOPIC_WORDS) as FortuneTopic[]).find((t) => has(text, TOPIC_WORDS[t])) ?? null;
}

function findKind(text: string): FortuneKind | null {
  if (has(text, ['손금', '손바닥'])) return 'palm';
  if (has(text, ['관상', '얼굴'])) return 'face';
  if (has(text, ['별자리'])) return 'zodiac';
  if (has(text, ['타로', '카드'])) return 'tarot';
  return null;
}

/** "3월 5일", "2004-03-05", "2004.3.5" 같은 표현에서 월·일 찾기 */
function findBirthday(text: string): [number, number] | null {
  const patterns = [/(\d{1,2})\s*월\s*(\d{1,2})\s*일/, /\d{4}\s*[-./년]\s*(\d{1,2})\s*[-./월]\s*(\d{1,2})/];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const month = Number(m[1]);
      const day = Number(m[2]);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) return [month, day];
    }
  }
  return null;
}

/** 아직 안 본 테스트 중 첫 번째로 안내 */
function missingHint(results: FortuneResult[]): { text: string; link?: ChatMessage['link'] } {
  const missing = ALL_KINDS.filter((k) => !results.some((r) => r.kind === k));
  if (missing.length === 0) return { text: '' };
  return {
    text: `\n\n${missing.map((k) => KIND_LABELS[k]).join('·')} 테스트도 보면 더 자세히 상담해 드릴 수 있어요.`,
    link: { to: KIND_PATHS[missing[0]], label: `${KIND_LABELS[missing[0]]} 보러 가기` },
  };
}

// ---------------------------------------------------------------------------
// 답변 종류별 함수
// ---------------------------------------------------------------------------

/** 처음 인사 — 불러온 결과에 따라 달라짐 */
export function greeting(results: FortuneResult[]): ChatMessage {
  if (results.length === 0) {
    return {
      role: 'bot',
      text: '안녕하세요! 운세연구소 상담봇이에요 🔮\n손금·관상·별자리·타로 테스트를 보고 오면, 그 결과를 모아서 고민을 상담해 드려요.\n먼저 아무 테스트나 하나 해 보세요!',
      link: { to: '/zodiac', label: '별자리 운세부터 보기' },
    };
  }
  const names = results.map((r) => KIND_LABELS[r.kind]).join(', ');
  return {
    role: 'bot',
    text: `안녕하세요! ${names} 결과를 불러왔어요 🔮\n연애·금전·진로·건강 중 궁금한 걸 편하게 물어보세요. 본 테스트 결과를 모아서 풀어 드릴게요.`,
  };
}

/** 생일만 말했을 때 → 오늘의 별자리 순위 */
function zodiacQuick(month: number, day: number): ChatMessage {
  const sign = getSign(month, day);
  const today = todayString();
  const row = getDailyRanking(today).find((r) => r.sign.id === sign.id)!;
  const change =
    row.change > 0 ? `어제보다 ${row.change}계단 올랐어요` : row.change < 0 ? `어제보다 ${-row.change}계단 내려갔어요` : '어제와 같은 순위예요';
  return {
    role: 'bot',
    text: `${month}월 ${day}일생은 ${sign.symbol} ${sign.name}예요.\n${formatDate(today)} 순위는 12개 별자리 중 ${row.rank}위! (${change})\n별자리 운세에서 결과를 보고 오면 분야별로 더 자세히 상담해 드릴게요.`,
    link: { to: '/zodiac', label: '별자리 운세 자세히 보기' },
  };
}

/** 특정 테스트 결과를 다시 보여 주기 */
function resultRecap(kind: FortuneKind, results: FortuneResult[]): ChatMessage {
  const r = results.find((x) => x.kind === kind);
  if (!r) {
    return {
      role: 'bot',
      text: `아직 ${KIND_LABELS[kind]} 결과가 없어요. 테스트를 보고 오면 그 결과로 상담해 드릴게요!`,
      link: { to: KIND_PATHS[kind], label: `${KIND_LABELS[kind]} 보러 가기` },
    };
  }
  const lines = [`${KIND_LABELS[kind]} 결과를 다시 정리해 드릴게요.`, `「${r.title}」`, r.summary];
  for (const [topic, text] of Object.entries(r.topics ?? {})) {
    const score = r.scores?.[topic as FortuneTopic];
    lines.push(`· ${TOPIC_LABELS[topic as FortuneTopic]}${score ? ` ${stars(score)}` : ''}: ${text}`);
  }
  return { role: 'bot', text: lines.join('\n') };
}

/** 주제 상담: 본 테스트들에서 그 주제 풀이를 모아 종합 */
function topicConsult(topic: FortuneTopic, question: string, results: FortuneResult[]): ChatMessage {
  const label = TOPIC_LABELS[topic];
  if (results.length === 0) {
    return {
      role: 'bot',
      text: `${TOPIC_ICONS[topic]} ${label} 고민이군요. 아직 본 테스트가 없어서 일반적인 조언만 드릴게요.\n${TOPIC_ADVICE[topic][1]}\n\n테스트를 보고 오면 결과를 바탕으로 더 구체적으로 봐 드릴게요!`,
      link: { to: topic === 'health' ? '/palm' : '/tarot', label: topic === 'health' ? '손금 보러 가기' : '타로 보러 가기' },
    };
  }

  // 그 주제 풀이가 있는 결과만 모음 (없으면 요약으로 대신)
  const related = results.filter((r) => r.topics?.[topic]);
  const used = related.length > 0 ? related : results;
  const lines = [`${TOPIC_ICONS[topic]} "${question}" — ${label}으로 볼게요.`, `지금까지 본 ${used.length}개 테스트를 바탕으로 풀어 드려요.`, ''];
  for (const r of used) {
    const score = r.scores?.[topic];
    lines.push(`· ${KIND_LABELS[r.kind]}${score ? ` ${stars(score)}` : ''}: ${r.topics?.[topic] ?? r.summary}`);
  }

  // 점수가 있으면 평균으로 분위기 판단, 없으면 보통
  const scores = used.map((r) => r.scores?.[topic]).filter((s): s is number => typeof s === 'number');
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 3;
  const advice = TOPIC_ADVICE[topic][avg >= 4 ? 0 : avg >= 3 ? 1 : 2];
  lines.push('', `✨ 종합하면: ${advice}`);

  const hint = missingHint(results);
  return { role: 'bot', text: lines.join('\n') + hint.text, link: hint.link };
}

/** 종합 운세: 본 테스트 결과를 한 줄씩 요약 */
function overallConsult(results: FortuneResult[]): ChatMessage {
  if (results.length === 0) return greeting(results);
  const lines = ['지금까지 본 테스트를 한눈에 정리해 드릴게요 🔮', ''];
  for (const r of results) lines.push(`· ${KIND_LABELS[r.kind]} 「${r.title}」\n  ${r.summary}`);
  lines.push('', '연애·금전·진로·건강 중 하나를 물어보시면 그 분야만 모아서 자세히 풀어 드릴게요.');
  const hint = missingHint(results);
  return { role: 'bot', text: lines.join('\n') + hint.text, link: hint.link };
}

// ---------------------------------------------------------------------------
// 메인: 대화 목록 + 저장된 결과 → 다음 답변
// ---------------------------------------------------------------------------

/**
 * async로 만들어 두어, 나중에 서버(AI)를 부르는 코드로 바꿔도 화면 코드는 그대로 쓸 수 있습니다.
 */
export async function getReply(history: ChatMessage[], results: FortuneResult[]): Promise<ChatMessage> {
  const question = (history[history.length - 1]?.text ?? '').trim();

  const topic = findTopic(question);
  if (topic) return topicConsult(topic, question, results);

  const kind = findKind(question);
  if (kind) return resultRecap(kind, results);

  const birthday = findBirthday(question);
  if (birthday) return zodiacQuick(...birthday);

  if (has(question, OVERALL_WORDS) || question.includes('운세')) return overallConsult(results);

  if (has(question, ['테스트', '기능', '뭐 있', '뭐가 있'])) {
    const done = ALL_KINDS.map((k) => `${results.some((r) => r.kind === k) ? '✅' : '⬜'} ${KIND_LABELS[k]}`).join('   ');
    const hint = missingHint(results);
    return {
      role: 'bot',
      text: `운세연구소에는 손금·관상·별자리 운세·타로 4가지 테스트가 있어요.\n${done}${hint.text || '\n4가지를 모두 보셨네요! 궁금한 걸 물어보세요.'}`,
      link: hint.link,
    };
  }
  if (has(question, ['고마', '감사', '땡큐'])) return { role: 'bot', text: '천만에요! 오늘도 좋은 기운이 함께하길 바라요 ✨' };
  if (has(question, ['안녕', '하이', '반가'])) return greeting(results);

  return {
    role: 'bot',
    text:
      results.length > 0
        ? '조금 더 구체적으로 물어봐 주시겠어요? 🥲\n예) "연애운 어때?", "시험 잘 볼 수 있을까?", "돈 관리 조언해 줘", "손금 결과 다시 보여 줘"'
        : '아직 본 테스트가 없어서 답하기가 어려워요 🥲\n테스트를 하나 보고 오거나, 생일(예: 3월 5일)을 알려 주세요!',
  };
}

/** 입력창 위 추천 질문 (본 테스트에 따라 달라짐) */
export function suggestions(results: FortuneResult[]): string[] {
  if (results.length === 0) return ['3월 5일생 오늘 운세는?', '연애운이 궁금해요', '어떤 테스트가 있어요?'];
  return ['내 결과 종합해 줘', '연애운 어때?', '시험 잘 볼 수 있을까?', '돈 관리 조언해 줘'];
}
