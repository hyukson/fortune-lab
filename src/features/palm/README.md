# 손금 (palm) — 담당: 오예은

손바닥 사진에서 **생명선 · 두뇌선 · 감정선**을 찾아 길이 · 곡률 · 연속성을 재고, 기준표에 따라 풀이합니다.
사진은 서버로 보내지 않고 브라우저 안에서만 처리합니다.

## 산출 방식 (AGENTS.md 5번)

| 단계 | 하는 일 | 파일 |
|---|---|---|
| ① 손 찾기 | MediaPipe Hands로 손 특징점 21개 → **손바닥 너비**(검지 뿌리~새끼 뿌리)를 길이 기준으로 사용 | `handDetector.ts` |
| ② 손금 찾기 | 손금 분할 모델(YOLO11 분할, ONNX)을 onnxruntime-web으로 실행 → 선별 영역(마스크) | `lineSegmenter.ts`, `yoloDecode.ts` |
| ③ 측정 | 영역을 1픽셀 두께로 깎아(세선화) 중심선 → 길이 · 직선도 · 조각 수 | `lineMetrics.ts` |
| ④ 판정 · 풀이 | 기준표로 판정 → 풀이 문장 조합 | `reading.ts`, `config.ts` |
| ⑤ 결과 화면 | p5.js로 사진 위에 손금을 한 획씩 그리기 | `resultSketch.ts`, `PalmPage.tsx` |

**판정 기준** (`config.ts`에서 숫자만 바꾸면 됨)

| 항목 | 계산 | 기준 |
|---|---|---|
| 길이 | 선 길이 ÷ 손바닥 너비 | 0.8 미만 짧음 / 0.8~1.3 보통 / 1.3 초과 김 |
| 곡률 | 직선도 = 양 끝 직선거리 ÷ 선 길이 | 0.95 이상 직선형 / 0.85 이상 완만한 곡선 / 미만 깊은 곡선 |
| 연속성 | 조각 수 (작은 잡음 조각 제외) | 1개 끊김 없음 / 2개 한 번 끊김 / 3개 이상 여러 번 끊김 |

## 모델 파일 넣기

1. 코랩 노트북(`palm_line_training.ipynb`)을 위에서부터 실행 → `palm-lines.onnx`, `palm-lines.json` 다운로드
2. 두 파일을 **`public/models/palm/`** 폴더에 넣기
3. `git add` → `commit` → `push` 하면 자동 배포

모델 파일이 없으면 손금 페이지에서 "손금 검출 모델 파일이 아직 준비되지 않았어요" 안내가 나옵니다. (사이트 빌드는 정상)

## 파일 구성

| 파일 | 역할 |
|---|---|
| `PalmPage.tsx` | 화면 (사진 선택 → 분석 중 → 결과) |
| `CameraCapture.tsx` | 노트북 웹캠으로 찍기 |
| `analyzePalm.ts` | 전체 분석 흐름 |
| `config.ts` | 경로 · 기준값 · 선 색상 |
| `handDetector.ts` | MediaPipe 손 특징점 |
| `lineSegmenter.ts` | ONNX 모델 실행 |
| `yoloDecode.ts` | 모델 출력 해석 · 마스크 계산 |
| `lineMetrics.ts` | 길이 · 직선도 · 조각 수 계산 |
| `reading.ts` | 판정 규칙 · 풀이 문장 |
| `resultSketch.ts` | p5.js 결과 그림 |
| `palm.css` | 손금 페이지 스타일 (`palm-` 클래스, theme.css 색만 사용) |

## 추가한 라이브러리

- `onnxruntime-web` — 손금 분할 모델 실행
- `@mediapipe/tasks-vision` — 손 특징점 (관상 기능도 같은 라이브러리를 쓰게 됨)

두 라이브러리 모두 손금 페이지 안에서만 불러오므로 메인 페이지 속도에는 영향이 없습니다.

## 데이터 출처

손금 분할 모델 학습 데이터: **palmistry Dataset** — Nikhil Singh's Workspace, Roboflow Universe, **CC BY 4.0**
https://universe.roboflow.com/nikhil-singh-s-workspace-k0mu1/palmistry-zbcbn-9sz9z
