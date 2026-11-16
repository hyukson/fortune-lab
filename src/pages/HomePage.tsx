import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import './HomePage.css';

// 메인 페이지: 헤더 없이 기능 카드 4개만 배치
// TODO: 카드 아이콘/일러스트, 애니메이션 등은 디자인 확정 후 추가
const MENUS = [
  { to: '/palm', title: '손금', desc: '손바닥 사진으로 보는 손금 풀이' }, // TODO(오예은): 손금 페이지 구현
  { to: '/face', title: '관상', desc: '얼굴 특징점으로 보는 관상 풀이' }, // TODO(장혁수): 관상 페이지 구현
  { to: '/zodiac', title: '별자리 운세', desc: '생년월일로 보는 오늘의 별자리 운세' }, // TODO(김예진): 별자리 페이지 구현
  { to: '/tarot', title: '타로', desc: '카드 3장으로 보는 타로 리딩' }, // TODO(장진영): 타로 페이지 구현
];

export default function HomePage() {
  return (
    <main className="home">
      <h1 className="home-logo">
        <img src={logo} alt="운세연구소" />
      </h1>
      <div className="home-grid">
        {MENUS.map((menu) => (
          <Link key={menu.to} to={menu.to} className="home-card">
            <h2>{menu.title}</h2>
            <p>{menu.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
