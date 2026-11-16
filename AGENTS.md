# 운세연구소 — 팀 공용 개발 규칙

> 이 문서는 **팀원 + AI 도구(Codex, Claude 등) 모두**가 따르는 규칙입니다.
> AI에게 작업을 시킬 때도 이 문서를 먼저 읽게 하세요. (Codex는 `AGENTS.md`, Claude는 `CLAUDE.md`를 자동으로 읽습니다.)

## 0. 작업 전 필수 체크리스트

```bash
git pull origin main   # ① 작업 시작 전 무조건 최신 코드 받기
npm install            # ② 다른 사람이 라이브러리를 추가했을 수 있으니 실행
npm run dev            # ③ 로컬 실행 → 터미널에 나오는 주소로 접속
```

작업이 끝나면:

```bash
npm run build          # ④ 에러 없이 빌드되는지 확인 (에러 나면 올리지 말 것)
git pull origin main   # ⑤ 올리기 직전에 한 번 더 pull
git add .
git commit -m "feat(palm): 손바닥 사진 업로드 추가"
git push origin main
```

- 충돌(conflict)이 나면 **혼자 해결하지 말고 팀 채팅에 먼저 공유**하세요.
- 다른 사람 폴더의 파일은 수정하지 마세요. 꼭 필요하면 담당자에게 먼저 말하기.

## 1. 프로젝트 정보

| 항목 | 내용 |
|---|---|
| 사이트명 | **운세연구소** |
| 기술 | React + TypeScript + Vite, (선택) p5.js, MediaPipe, ONNX Runtime Web |
| 라우팅 | `react-router-dom`의 **HashRouter** (주소가 `#/palm` 형태) |
| 배포 | GitHub Pages — `main`에 push하면 자동 배포 (`.github/workflows/deploy.yml`) |
| 주소 | https://hyukson.github.io/fortune-lab/ |
| 서버 | 없음. **모든 계산은 브라우저에서** 실행 |

## 2. 담당 및 폴더

| 기능 | 담당 | 작업 폴더 | 주소 |
|---|---|---|---|
| 손금 | 오예은 | `src/features/palm/` | `#/palm` |
| 관상 | 장혁수 | `src/features/face/` | `#/face` |
| 별자리 운세 | 김예진 | `src/features/zodiac/` | `#/zodiac` |
| 타로 | 장진영 | `src/features/tarot/` | `#/tarot` |
| 결과 다운로드 | 장진영 | `src/features/download/` | (결과 화면 공통 버튼) |

**자기 기능은 자기 폴더 안에서만** 만드세요. 이미지·데이터·컴포넌트·CSS도 전부 그 폴더 안에 넣으면 충돌이 거의 안 납니다.

```
src/
├─ App.tsx              # 라우트(주소) 등록 — 수정 시 팀에 공유
├─ main.tsx
├─ pages/HomePage.tsx   # 메인 (헤더 없이 카드 4개)
├─ components/          # 공통 컴포넌트 (PageLayout, P5Canvas)
├─ styles/theme.css     # ⭐ 공식 색상 변수
└─ features/
   ├─ palm/  face/  zodiac/  tarot/  download/
```

## 3. 디자인 규칙 (반드시 지키기)

색상은 `src/styles/theme.css`의 변수만 사용합니다. **HEX 값(#xxxxxx)을 직접 쓰지 마세요.**

| 용도 | 변수 | 값 |
|---|---|---|
| 전체 배경 | `var(--color-bg)` | #100C18 |
| 메뉴 카드 배경 | `var(--color-card)` | #24182E |
| 사이트 제목 · 시작하기 버튼 | `var(--color-gold)` | #EBC47B |
| 버튼 hover | `var(--color-gold-hover)` | #F6D99B |
| 본문 글자 | `var(--color-text)` | #F7EEDF |
| 짧은 설명 · 보조 메뉴 | `var(--color-sub)` | #C9B5D3 |

- 버튼은 공통 클래스 `className="btn"` 사용.
- 기능 페이지는 `PageLayout` 컴포넌트로 감싸기 (뒤로가기·제목 통일).
- CSS 클래스명은 기능 이름으로 시작 (예: `.palm-upload`, `.tarot-card`) → 다른 사람 스타일과 안 겹치게.
- p5.js 캔버스 안에서는 CSS 변수를 못 쓰니 같은 색 값을 사용하세요 (예: `p.background(16, 12, 24)` = #100C18).

## 4. 코딩 규칙

- **무거운 라이브러리는 그 기능 페이지 안에서만 import** 하세요 (MediaPipe, onnxruntime-web 등). 페이지는 `App.tsx`에서 lazy 로딩되므로 메인 페이지가 느려지지 않습니다.
- 라이브러리 설치는 `npm install 이름` → `package.json`, `package-lock.json` 둘 다 커밋. 설치 후 팀에 공유.
- p5.js는 필수는 아니지만 쓰면 좋습니다. 쓸 때는 `src/components/P5Canvas.tsx` 사용 (사용 예시가 파일 안에 있음). `import p5 from 'p5'`로 전역 모드 쓰지 마세요.
- 이미지·모델 파일 경로: 자기 폴더에 두고 import 하거나, `public/models/<기능>/`에 두고 `import.meta.env.BASE_URL + 'models/...'`로 불러오기 (GitHub Pages 하위 경로 때문에 `/models/...`로 쓰면 깨짐).
- 사진은 **서버로 보내지 않고 브라우저에서만** 처리합니다.

## 5. 운세 산출 방식 (교수님 피드백 반영, 확정)

> 원칙: "AI가 운세를 맞힌다"가 아니라 **"AI가 특징을 추출하고, 정해진 규칙/알고리즘이 결과를 산출한다"**.
> 결과 화면에 "엔터테인먼트 목적의 콘텐츠입니다" 문구를 넣어주세요.

| 기능 | 입력 | 산출 방법 |
|---|---|---|
| 손금 | 손바닥 사진 | MediaPipe Hands → 손금 분할 모델(ONNX)로 3대 선 검출 → 길이(손바닥 너비 대비 비율: <0.8 짧음 / 0.8~1.3 보통 / >1.3 김)·곡률·연속성 → 풀이 규칙 |
| 관상 | 얼굴 사진 | MediaPipe Face Landmarker(478점) → 얼굴 세로/가로 비율, 눈 사이 거리, 입 너비 등 → 풀이 규칙 |
| 별자리 운세 | 생년월일, 조회 날짜 | 생일 → 별자리 판별, `Seed = Hash(생일 + 날짜 + 사용자ID)` → 같은 날 같은 결과 |
| 타로 | 고민 주제, 카드 선택 | 78장 중 비복원 무작위 3장 + 정/역방향 → 위치(과거·현재·조언)별 해석 데이터 |
| 결과 다운로드 | 결과 화면 | 결과 영역을 이미지로 저장 |

## 6. AI 도구 사용 시 주의 (Codex / Claude에게 적용)

- 요청받은 기능 폴더 밖의 파일은 수정하지 말 것. 꼭 필요하면 먼저 사용자에게 물어볼 것.
- `src/styles/theme.css`의 색상 변수를 사용하고 새 색을 임의로 만들지 말 것.
- 프레임워크/라우터/빌드 도구를 바꾸지 말 것 (React + Vite + HashRouter 유지).
- 작업 후 `npm run build`가 통과하는지 확인할 것.
- 설명은 개발 초보도 이해할 수 있게 한국어로.
