import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import StarField from '../components/StarField';
import ChatbotSection from '../features/chatbot/ChatbotSection'; // AI 운세 상담 (김예진)
import './HomePage.css';

// 메인 페이지: 헤더 없이 기능 카드 4개만 배치
// 아이콘은 선으로 그린 SVG (색은 CSS의 currentColor → 금색)

const ICONS: Record<string, ReactNode> = {
  // 손바닥 + 손금 세 줄
  palm: (
    <>
      <path d="M15 40c-4-4-7-9-7-15V18a2.5 2.5 0 0 1 5 0v6V10a2.5 2.5 0 0 1 5 0v12V8a2.5 2.5 0 0 1 5 0v14V10a2.5 2.5 0 0 1 5 0v15l3-5a2.6 2.6 0 0 1 4.4 2.6L33 33c-2 4-5 7-9 7z" />
      <path className="home-icon-thin" d="M14 27c4-2 9-2 13 1M15 32c3-1 7 0 10 3M22 39c-1-4-1-8 1-12" />
    </>
  ),
  // 얼굴 윤곽 + 측정선
  face: (
    <>
      <ellipse cx="24" cy="24" rx="12" ry="16" />
      <path className="home-icon-thin" d="M17 21h4M27 21h4M24 22v7l-2 1M20 34c2.5 1.5 5.5 1.5 8 0" />
      <path className="home-icon-dash" d="M6 16h36M6 30h36" />
    </>
  ),
  // 별자리: 점과 선
  zodiac: (
    <>
      <path className="home-icon-thin" d="M8 34l9-8 8 4 7-13 8 5" />
      <circle className="home-icon-dot" cx="8" cy="34" r="2" />
      <circle className="home-icon-dot" cx="17" cy="26" r="2" />
      <circle className="home-icon-dot" cx="25" cy="30" r="2" />
      <circle className="home-icon-dot" cx="32" cy="17" r="2.6" />
      <circle className="home-icon-dot" cx="40" cy="22" r="2" />
      <path d="M14 8l1.2 3.3L18.5 12.5l-3.3 1.2L14 17l-1.2-3.3L9.5 12.5l3.3-1.2z" />
    </>
  ),
  // 부채꼴로 펼친 카드 3장
  tarot: (
    <>
      <rect x="8" y="12" width="14" height="22" rx="2" transform="rotate(-14 15 23)" />
      <rect x="26" y="12" width="14" height="22" rx="2" transform="rotate(14 33 23)" />
      <rect className="home-icon-fill" x="17" y="9" width="14" height="24" rx="2" />
      <path d="M24 15l1.2 3.3 3.3 1.2-3.3 1.2L24 24l-1.2-3.3-3.3-1.2 3.3-1.2z" />
    </>
  ),
};

const MENUS = [
  { to: '/palm', icon: 'palm', title: '손금', desc: '손바닥 사진으로 보는 손금 풀이' },
  { to: '/face', icon: 'face', title: '관상', desc: '얼굴 특징점으로 보는 관상 풀이' },
  { to: '/zodiac', icon: 'zodiac', title: '별자리 운세', desc: '생년월일로 보는 오늘의 별자리 운세' },
  { to: '/tarot', icon: 'tarot', title: '타로', desc: '카드 3장으로 보는 타로 리딩' },
];

export default function HomePage() {
  return (
    <main className="home">
      <StarField />
      <h1 className="home-logo">
        <img src={logo} alt="운세연구소" />
      </h1>
      <div className="home-grid">
        {MENUS.map((menu, i) => (
          <Link key={menu.to} to={menu.to} className="home-card" style={{ animationDelay: `${0.15 + i * 0.08}s` }}>
            <span className="home-icon">
              <svg viewBox="0 0 48 48" aria-hidden="true">
                {ICONS[menu.icon]}
              </svg>
            </span>
            <span className="home-text">
              <h2>{menu.title}</h2>
              <p>{menu.desc}</p>
            </span>
            <span className="home-arrow" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
      <ChatbotSection />
      <p className="home-note">모든 분석은 브라우저 안에서만 이루어져요 · 엔터테인먼트 목적의 콘텐츠입니다</p>
    </main>
  );
}
