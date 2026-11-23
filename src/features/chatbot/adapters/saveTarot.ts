// 담당: 김예진 (타로 담당 장진영님 코드의 결과를 "읽기만" 함)
// 타로 세션(3장 모두 뒤집은 상태) → AI 운세 상담 결과 보관함 형식으로 변환해서 저장
// TarotPage.tsx의 onChange에서 phase가 'done'이 되면 saveTarotResult(next)를 부름
//
// ⚠️ 아직 카드별 해석 데이터가 없어서 "고른 카드 + 정/역방향"만 저장합니다.
//    해석 데이터가 생기면 아래 adviceText()의 문장만 해석 문장으로 바꾸면 됩니다.
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 작성했습니다. (AI 사용 비율: 약 100%)

import { DECK } from '../../tarot/deck';
import { POSITION_LABELS, TOPIC_LABELS as TAROT_TOPICS, type TarotSession, type Topic } from '../../tarot/storage';
import { saveFortuneResult, type FortuneTopic } from '../resultStore';

const TOPIC_OF: Record<Topic, FortuneTopic> = { love: 'love', money: 'money', career: 'career' };

const cardName = (s: TarotSession, id: number) => `${DECK[id].nameKo}(${s.reversed[id] ? '역방향' : '정방향'})`;

function adviceText(s: TarotSession): string {
  const adviceId = s.picked[2];
  const reversed = s.reversed[adviceId];
  return reversed
    ? `조언 자리에 ${cardName(s, adviceId)} 카드가 나왔어요. 역방향은 막혀 있는 부분을 먼저 돌아보고 천천히 풀어 가라는 신호예요.`
    : `조언 자리에 ${cardName(s, adviceId)} 카드가 나왔어요. 정방향은 이 카드의 기운을 자연스럽게 받아들이고 그대로 나아가라는 신호예요.`;
}

export function saveTarotResult(s: TarotSession) {
  if (s.phase !== 'done' || s.picked.length < 3) return;

  const cards = s.picked.map((id, i) => `${POSITION_LABELS[i]}: ${cardName(s, id)}`);
  const majors = s.picked.filter((id) => DECK[id].arcana === 'major').length;
  const question = s.question ? `"${s.question}"에 대해 ` : '';

  saveFortuneResult({
    kind: 'tarot',
    title: `${TAROT_TOPICS[s.topic]} 리딩 · ${s.picked.map((id) => DECK[id].nameKo).join(' / ')}`,
    summary: `${question}${cards.join(', ')} 카드를 뽑았어요.${majors >= 2 ? ' 메이저 아르카나가 많이 나와 중요한 흐름이 걸린 시기예요.' : ''}`,
    topics: { [TOPIC_OF[s.topic]]: adviceText(s) },
  });
}
