# 손금 (palm) — 담당: 오예은

손바닥 사진에서 **생명선 · 두뇌선 · 감정선**과 **손 모양 · 손가락 비율**을 재고, 기준표와 점수표에 따라 풀이합니다.
사진은 서버로 보내지 않고 브라우저 안에서만 처리합니다.

## 화면 흐름

```
안내(IntroStep) — 손바닥 그림 · 촬영 팁 · 손 선택(찍을 손 / 주로 쓰는 손)
  ├─ 카메라 촬영(CameraStep): 휴대폰은 뒷면 카메라, 손 특징점 21개 · 뼈대를 실시간 표시,
  │     위치·크기·움직임 안내 → 자리가 잡히면 그 장면에서 손금을 먼저 찾아 보고 2개 이상 보이면 자동 촬영
  └─ 사진 올리기 / 끌어다 놓기
        ↓
스캔(ScanStep) ── 성공 ──→ 결과(ResultStep)
       └──────── 실패 ──→ 다시 찍기 안내(RetryStep)
```

## 산출 방식 (AGENTS.md 5번)

| 단계 | 하는 일 | 파일 |
|---|---|---|
| ① 손 찾기 | MediaPipe Hands로 손 특징점 21개 → **손바닥 너비**(검지 뿌리~새끼 뿌리)를 길이 기준으로 사용 | `handDetector.ts` |
| ② 손 모양 | 특징점 거리로 손바닥 길이÷너비, 중지÷손바닥, 검지÷약지, 엄지÷검지 | `handShape.ts` |
| ③ 손금 찾기 | 특징점으로 **손바닥만 크게 잘라 손가락이 위로 가게 세운 뒤** 손금 분할 모델(YOLO11 분할, ONNX) 실행 → 선별 영역(마스크). 못 찾은 선은 사진 전체로 한 번 더 찾음 | `palmCrop.ts`, `lineSegmenter.ts`, `yoloDecode.ts` |
| ④ 측정 | 영역을 1픽셀 두께로 깎아(세선화) 중심선 → 길이 · 직선도 · 조각 수 | `lineMetrics.ts` |
| ⑤ 판정 · 풀이 | 기준표로 판정 → 풀이 문장 조합 | `reading.ts`, `handReading.ts`, `config.ts` |
| ⑥ 운세 지표 | 판정마다 정해진 점수를 더해 애정·재물·건강·성취·대인 점수 | `scores.ts` |

무작위 요소가 없어서 같은 사진이면 항상 같은 결과가 나옵니다.

**왼손 · 오른손**: 전통 손금 기준으로 주로 쓰는 손은 지금과 앞으로(후천운), 반대쪽 손은 타고난 성향(선천운)으로 읽습니다.
사진만으로는 왼손/오른손 구분이 정확하지 않아서(셀카 좌우 반전 등) 안내 화면에서 사용자가 직접 고르고, 카메라 가이드 그림도 고른 손에 맞춰 좌우가 바뀝니다.

**판정 기준** (`config.ts`에서 숫자만 바꾸면 됨)

| 항목 | 계산 | 기준 |
|---|---|---|
| 손금 길이 | 선 길이 ÷ 손바닥 너비 | 0.8 미만 짧음 / 0.8~1.3 보통 / 1.3 초과 김 |
| 손금 곡률 | 직선도 = 양 끝 직선거리 ÷ 선 길이 | 0.95 이상 직선형 / 0.85 이상 완만한 곡선 / 미만 깊은 곡선 |
| 손금 연속성 | 조각 수 (작은 잡음 조각 제외) | 1개 끊김 없음 / 2개 한 번 끊김 / 3개 이상 여러 번 끊김 |
| 손바닥 모양 | 손목~중지 뿌리 ÷ 손바닥 너비 | 1.55 이상 긴 손바닥 / 미만 네모난 손바닥 |
| 손가락 길이 | 중지 길이 ÷ 손바닥 길이 | 1.05 이상 긴 손가락 / 미만 짧은 손가락 |
| 손 유형 | 손바닥 × 손가락 | 네모·짧음 흙 / 네모·긺 바람 / 긴·짧음 불 / 긴·긺 물 |
| 검지·약지 | 검지 ÷ 약지 | 0.95 미만 약지가 김 / 0.99 초과 검지가 김 / 사이 균형 |
| 엄지 | 엄지 ÷ 검지 | 0.66 미만 짧음 / 0.78 초과 김 |

> ⚠️ 손 모양 · 손가락 기준값은 처음 정한 값이에요. 실제 손 사진 여러 장으로 확인하며 조정하세요.
> `npm run dev`로 켠 뒤 브라우저 콘솔에서 `__palmDev.analyzeFile(파일)`을 실행하면 측정값을 볼 수 있어요.

## 모델 파일

- `public/models/palm/palm-lines.onnx`, `palm-lines.json` — 코랩 노트북(`training/palm_line_training.ipynb`)으로 학습 (마스크 mAP50 0.865)
- 다시 학습하려면 노트북을 위에서부터 실행 → 두 파일을 같은 자리에 덮어쓰기

## 파일 구성

| 파일 | 역할 |
|---|---|
| `PalmPage.tsx` | 화면 단계 전환 (안내 → 카메라 → 스캔 → 결과 / 다시 찍기) |
| `analyzePalm.ts` | 전체 분석 흐름 |
| `config.ts` | ⭐ 경로 · 기준값 · 카메라 자동 촬영 기준 · 선 색상 |
| `handDetector.ts` | MediaPipe 손 특징점 (사진 · 카메라 공용) |
| `handShape.ts` | 손 모양 · 손가락 비율 계산과 판정 |
| `lineSegmenter.ts` / `yoloDecode.ts` | ONNX 모델 실행 · 출력 해석 |
| `lineMetrics.ts` | 길이 · 직선도 · 조각 수 계산 |
| `reading.ts` | 손금 판정 규칙 · 풀이 문장 |
| `handReading.ts` | 손 유형 · 손가락 풀이 문장, 유형 도감 데이터 |
| `scores.ts` | 운세 지표 점수표 |
| `resultSketch.ts` | p5.js 결과 그림 (사진 위에 손금 그리기) |
| `resultCard.ts` | 결과 저장용 카드 이미지(1080×1620 PNG) 그리기 — 색은 theme.css 변수에서 읽음 |
| `ui/` | 화면 컴포넌트 (IntroStep, CameraStep, ScanStep, RetryStep, ResultStep, RadarChart, Gauge, TypeAtlas, PalmGuide, SaveImageButton) |

> 결과 저장: 공통 버튼(`src/features/download/DownloadButton`, 장진영 담당)이 준비 중이라 손금 전용 `ui/SaveImageButton.tsx`를 사용합니다.
> 휴대폰은 공유 창(사진 앱 저장), PC는 PNG 파일로 내려받습니다. 공통 버튼이 완성되면 바꿔 달아도 됩니다.
| `palm.css` | 손금 페이지 스타일 (`palm-` 클래스, theme.css 색만 사용) |

## 추가한 라이브러리

- `onnxruntime-web` — 손금 분할 모델 실행
- `@mediapipe/tasks-vision` — 손 특징점

두 라이브러리 모두 손금 페이지 안에서만 불러오므로 메인 페이지 속도에는 영향이 없습니다.

## 데이터 출처

손금 분할 모델 학습 데이터: **palmistry Dataset** — Nikhil Singh's Workspace, Roboflow Universe, **CC BY 4.0**
https://universe.roboflow.com/nikhil-singh-s-workspace-k0mu1/palmistry-zbcbn-9sz9z
