import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';

// 기능 페이지는 lazy 로딩 → 무거운 라이브러리(MediaPipe, ONNX, p5)가
// 해당 페이지에 들어갈 때만 다운로드됩니다. 새 페이지도 이 방식으로 추가하세요.
const PalmPage = lazy(() => import('./features/palm/PalmPage'));
const FacePage = lazy(() => import('./features/face/FacePage'));
const ZodiacPage = lazy(() => import('./features/zodiac/ZodiacPage'));
const TarotPage = lazy(() => import('./features/tarot/TarotPage'));

// GitHub Pages는 새로고침 시 404가 나기 때문에 HashRouter(#/palm 형태)를 사용합니다.
export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<p className="page">불러오는 중...</p>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/palm" element={<PalmPage />} />
          <Route path="/face" element={<FacePage />} />
          <Route path="/zodiac" element={<ZodiacPage />} />
          <Route path="/tarot" element={<TarotPage />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
