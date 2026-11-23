# AI 운세 상담 (chatbot) — 담당: 김예진

메인 페이지 맨 아래의 상담 칸입니다.
사용자가 본 **손금·관상·별자리·타로 결과를 모아서** 고민 질문(연애·금전·진로·건강)에 답합니다.

```
각 기능 결과 화면 ──save○○Result()──▶ 결과 보관함(localStorage) ──▶ AI 운세 상담
```

- 결과는 **이 브라우저에만** 저장됩니다. 서버로 보내지 않고, 사진도 저장하지 않습니다.
- 기능마다 **가장 최근 결과 1개**만 남습니다.

## 파일 구조

| 파일 | 역할 |
|---|---|
| `resultStore.ts` | 결과 보관함 (저장·불러오기·지우기) |
| `adapters/savePalm.ts` | 손금 결과 → 보관함 형식 변환 |
| `adapters/saveFace.ts` | 관상 결과 → 보관함 형식 변환 (점수 52~98 → 1~5) |
| `adapters/saveTarot.ts` | 타로 결과 → 보관함 형식 변환 |
| `replies.ts` | 질문 → 답변 (주제 분류 + 결과 모아서 종합) |
| `ChatbotSection.tsx`, `chatbot.css` | 상담 화면 |

## 🙋 각 기능 담당자께 — 이미 연결해 두었어요

각 페이지에 **2줄씩만** 추가했습니다 (불러오기 1줄 + 저장 호출 1줄, 주석에 "김예진 추가" 표시).
변환 코드는 모두 이 폴더(`adapters/`)에 있고, 여러분의 코드는 **읽기만** 합니다.

| 기능 | 추가한 위치 |
|---|---|
| 손금 | `PalmPage.tsx` — `analyzePalm()` 직후 `savePalmResult(r)` |
| 관상 | `FacePage.tsx` — 분석 성공(`analysis.ok`) 직후 `saveFaceResult(analysis.reading)` |
| 타로 | `TarotPage.tsx` — `onChange`에서 `phase === 'done'`일 때 `saveTarotResult(next)` |
| 별자리 | `ZodiacPage.tsx` — 운세 계산 직후 |

⚠️ 함수 이름·데이터 구조(`PalmResult`, `Reading`, `TarotSession` 등)를 바꾸면 `adapters/`도 같이 맞춰야 하니 알려 주세요. (`npm run build`에서 에러로 바로 보입니다)

### 타로 담당께
아직 카드 해석 데이터가 없어서 지금은 "고른 카드 + 정/역방향"만 저장합니다.
해석 데이터가 생기면 `adapters/saveTarot.ts`의 `adviceText()` 문장을 해석 문장으로 바꿔 주세요.

### 저장 형식 (직접 저장하고 싶을 때)

```ts
import { saveFortuneResult } from '../chatbot/resultStore';

saveFortuneResult({
  kind: 'palm',              // 'palm' | 'face' | 'zodiac' | 'tarot'
  title: '결과 한 줄 제목',
  summary: '전체 풀이 요약 1~3문장',
  topics: { love: '...', money: '...', career: '...', health: '...' }, // 분야별 한 줄 풀이 (있는 것만)
  scores: { love: 4 },       // (선택) 분야별 점수 1~5
});
```

## 개발할 때 테스트하는 법
`npm run dev`로 실행하면 상담 칸에 **[개발용] 예시 결과 넣기** 버튼이 보입니다.
누르면 손금·관상·타로 예시 결과가 들어가서 바로 상담을 시험해 볼 수 있습니다. (배포된 사이트에는 나타나지 않음)

## 나중에 진짜 AI를 연결하려면
- 답변은 `replies.ts`의 `getReply(대화, 결과)` 한 곳에서 만듭니다. 이 함수만 "서버에 물어보기"로 바꾸면 화면은 그대로 쓸 수 있습니다.
- `resultsToContext(results)`가 저장된 결과를 하나의 글로 정리해 줍니다. 이 글을 AI에게 "사용자의 운세 결과"로 함께 보내면 됩니다.
- ⚠️ **AI API 키를 브라우저 코드에 넣으면 안 됩니다.** GitHub Pages는 코드가 공개되므로 누구나 키를 볼 수 있습니다. 키를 보관하는 별도 서버(서버리스 함수 등)가 필요합니다.
