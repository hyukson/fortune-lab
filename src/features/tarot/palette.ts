// 담당: 장진영
// p5 캔버스용 색상표
// p5 캔버스 안에서는 CSS 변수를 쓸 수 없어서 theme.css와 "같은 값"을 RGB로 적어 둡니다.
// (theme.css 색이 바뀌면 여기도 같이 바꿔주세요. 새 색은 만들지 않고, 투명도·섞기로만 변화를 줍니다)
//
// [AI 사용 표시] Claude(AI)가 작성 (AI 사용 비율: 약 100%)

export type RGB = [number, number, number];

export const PALETTE: Record<'bg' | 'card' | 'gold' | 'goldHover' | 'text' | 'sub', RGB> = {
  bg: [16, 12, 24], // --color-bg
  card: [36, 24, 46], // --color-card
  gold: [235, 196, 123], // --color-gold
  goldHover: [246, 217, 155], // --color-gold-hover
  text: [247, 238, 223], // --color-text
  sub: [201, 181, 211], // --color-sub
};

/**
 * 캔버스 글꼴. ⚠️ p5는 글꼴 이름에 띄어쓰기가 있으면 전체를 따옴표로 감싸서
 * 'A, "B C"' 같은 목록이 깨집니다(글자 크기까지 무시됨) → 띄어쓰기 없이 적어야 합니다.
 */
export const CANVAS_FONT = 'Pretendard,system-ui,sans-serif'; // 본문용 (고딕)
export const CANVAS_SERIF = 'Georgia,serif'; // 카드 번호·영어 이름용 (클래식한 세리프)

/** 두 색 a, b를 t(0~1) 비율로 섞은 색 */
export function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** 캔버스 2D API(drawingContext)에 넘길 'rgba(…)' 문자열 */
export function rgba(c: RGB, alpha: number): string {
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
}
