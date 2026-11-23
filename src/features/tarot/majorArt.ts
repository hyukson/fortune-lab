// 담당: 장진영
// 메이저 아르카나 22장의 "상징 장면" 그림 목록
// 실제 그림 코드: majorScenes1.ts(0~10번), majorScenes2.ts(11~21번), 공통 부품: artParts.ts
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 함수 단위로 작성했습니다. (AI 사용 비율: 약 100%)

import type p5 from 'p5';
import { SCENES_0_TO_10 } from './majorScenes1';
import { SCENES_11_TO_21 } from './majorScenes2';

/** 카드 번호 → 그리는 함수 (22장 전체) */
const MAJOR_ART: Record<number, (p: p5, w: number, h: number) => void> = {
  ...SCENES_0_TO_10,
  ...SCENES_11_TO_21,
};

/** 이 메이저 카드(번호)에 전용 그림이 있는지 */
export function hasMajorArt(number: number): boolean {
  return number in MAJOR_ART;
}

/**
 * 메이저 카드 전용 그림을 그리는 함수 (그림 창 안을 잘라내기(clip)한 상태에서 호출됨)
 * [AI 도움: Claude]
 */
export function drawMajorArt(p: p5, number: number, w: number, h: number): void {
  p.push();
  MAJOR_ART[number]?.(p, w, h);
  p.pop();
}
