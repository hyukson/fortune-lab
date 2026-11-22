// 담당: 김예진
// 12별자리 정보 + 생년월일로 별자리를 판별하는 함수
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 작성했습니다. (AI 사용 비율: 약 100%)

export type ZodiacSign = {
  id: string; // 영어 이름 (저장·계산용)
  name: string; // 한국어 이름
  symbol: string; // 별자리 기호
  period: string; // 화면에 보여줄 기간
  start: [number, number]; // 시작 [월, 일]
};

// 순서: 양자리부터 시작 (start 날짜 순서대로 정렬되어 있어야 getSign이 올바르게 동작)
export const SIGNS: ZodiacSign[] = [
  { id: 'aries', name: '양자리', symbol: '♈', period: '3.21 ~ 4.19', start: [3, 21] },
  { id: 'taurus', name: '황소자리', symbol: '♉', period: '4.20 ~ 5.20', start: [4, 20] },
  { id: 'gemini', name: '쌍둥이자리', symbol: '♊', period: '5.21 ~ 6.21', start: [5, 21] },
  { id: 'cancer', name: '게자리', symbol: '♋', period: '6.22 ~ 7.22', start: [6, 22] },
  { id: 'leo', name: '사자자리', symbol: '♌', period: '7.23 ~ 8.22', start: [7, 23] },
  { id: 'virgo', name: '처녀자리', symbol: '♍', period: '8.23 ~ 9.22', start: [8, 23] },
  { id: 'libra', name: '천칭자리', symbol: '♎', period: '9.23 ~ 10.22', start: [9, 23] },
  { id: 'scorpio', name: '전갈자리', symbol: '♏', period: '10.23 ~ 11.21', start: [10, 23] },
  { id: 'sagittarius', name: '사수자리', symbol: '♐', period: '11.22 ~ 12.21', start: [11, 22] },
  { id: 'capricorn', name: '염소자리', symbol: '♑', period: '12.22 ~ 1.19', start: [12, 22] },
  { id: 'aquarius', name: '물병자리', symbol: '♒', period: '1.20 ~ 2.18', start: [1, 20] },
  { id: 'pisces', name: '물고기자리', symbol: '♓', period: '2.19 ~ 3.20', start: [2, 19] },
];

/**
 * 월·일로 별자리를 찾는 함수
 * 방법: 날짜를 "월*100+일" 숫자로 바꿔서(예: 3월 21일 → 321),
 *       시작일이 그 날짜보다 같거나 이른 별자리 중 가장 늦은 것을 고릅니다.
 *       1월 1일 ~ 1월 19일처럼 어느 시작일보다도 이른 날짜는 염소자리(12.22 시작)입니다.
 */
export function getSign(month: number, day: number): ZodiacSign {
  const value = month * 100 + day;
  let found: ZodiacSign | null = null;
  let foundStart = -1;
  for (const sign of SIGNS) {
    const start = sign.start[0] * 100 + sign.start[1];
    if (start <= value && start > foundStart) {
      found = sign;
      foundStart = start;
    }
  }
  return found ?? SIGNS.find((s) => s.id === 'capricorn')!;
}

export function getSignById(id: string): ZodiacSign | undefined {
  return SIGNS.find((s) => s.id === id);
}
