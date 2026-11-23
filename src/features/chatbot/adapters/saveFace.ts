// 담당: 김예진 (관상 담당 장혁수님 코드의 결과를 "읽기만" 함)
// 관상 결과(Reading) → AI 운세 상담 결과 보관함 형식으로 변환해서 저장
// FacePage.tsx에서 분석이 성공한 직후 saveFaceResult(analysis.reading)를 한 번 부름
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 작성했습니다. (AI 사용 비율: 약 100%)

import { SCORE_LIMIT } from '../../face/config';
import { FORTUNES } from '../../face/content/readings';
import type { FortuneKey, Reading } from '../../face/types';
import { saveFortuneResult, type FortuneTopic } from '../resultStore';

// 관상의 운 → 상담 주제
const TOPIC_OF: Partial<Record<FortuneKey, FortuneTopic>> = {
  love: 'love',
  wealth: 'money',
  career: 'career',
  vitality: 'health',
};

/** 관상 점수(52~98) → 1~5 */
function toFive(score: number): number {
  const ratio = (score - SCORE_LIMIT.min) / (SCORE_LIMIT.max - SCORE_LIMIT.min);
  return Math.min(5, Math.max(1, Math.round(1 + ratio * 4)));
}

/** 점수 구간별 한 줄 풀이 */
function levelText(label: string, five: number): string {
  if (five >= 5) return `${label}이 관상에서 특히 두드러지는 기운이에요.`;
  if (five >= 4) return `${label}을 든든하게 갖춘 얼굴이에요.`;
  if (five >= 3) return `${label}은 무난하게 고루 갖춘 편이에요.`;
  return `${label}은 다른 기운에 비해 조용한 편이라, 꾸준한 노력으로 채워 가면 좋아요.`;
}

export function saveFaceResult(reading: Reading) {
  const topics: Partial<Record<FortuneTopic, string>> = {};
  const scores: Partial<Record<FortuneTopic, number>> = {};

  for (const { key, label, score } of reading.scores) {
    const topic = TOPIC_OF[key];
    if (!topic) continue; // 대인운(social)은 상담 주제에 없어서 요약에만 반영
    const five = toFive(score);
    scores[topic] = five;
    // 대표 유형이면 그 유형 설명을, 아니면 점수 구간 풀이를 사용
    topics[topic] = key === reading.type.key ? FORTUNES[key].summary : levelText(label, five);
  }

  saveFortuneResult({
    kind: 'face',
    title: reading.type.title,
    summary: `${reading.type.summary} 얼굴의 세 구역은 「${reading.samjeong.title}」이에요.`,
    topics,
    scores,
  });
}
