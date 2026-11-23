// 담당: 김예진 (손금 담당 오예은님 코드의 결과를 "읽기만" 함)
// 손금 결과(PalmResult) → AI 운세 상담 결과 보관함 형식으로 변환해서 저장
// PalmPage.tsx에서 분석이 끝난 직후 savePalmResult(r)를 한 번 부름
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 작성했습니다. (AI 사용 비율: 약 100%)

import type { PalmResult } from '../../palm/analyzePalm';
import { LINE_INFO, type LineKey } from '../../palm/config';
import { CURVE_LABEL, LENGTH_LABEL, lineReading, typeTitle, type LineCategories } from '../../palm/reading';
import { saveFortuneResult } from '../resultStore';

export function savePalmResult(result: PalmResult) {
  const cats: Partial<Record<LineKey, LineCategories>> = Object.fromEntries(
    result.lines.filter((l) => l.cats).map((l) => [l.key, l.cats!]),
  );
  const found = (Object.keys(cats) as LineKey[]).filter((k) => cats[k]);
  if (found.length === 0) return; // 손금을 하나도 못 찾았으면 저장하지 않음

  const reading = (key: LineKey) => (cats[key] ? lineReading(key, cats[key]!) : undefined);
  const features = found
    .map((k) => `${LINE_INFO[k].name}(길이 ${LENGTH_LABEL[cats[k]!.length]}, ${CURVE_LABEL[cats[k]!.curve]})`)
    .join(', ');

  saveFortuneResult({
    kind: 'palm',
    title: typeTitle(cats),
    summary: `손금 특징 — ${features}.`,
    topics: {
      love: reading('heart'), // 감정선
      career: reading('head'), // 두뇌선
      health: reading('life'), // 생명선
    },
  });
}
