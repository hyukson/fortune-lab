import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import StarField from './StarField';

// 기능 페이지 공통 틀. 모든 기능 페이지는 이 컴포넌트로 감싸주세요.
type Props = {
  title: string;
  desc?: string;
  children?: ReactNode;
};

export default function PageLayout({ title, desc, children }: Props) {
  return (
    <>
      <StarField subtle />
      <main className="page">
        <Link to="/" className="back-link">← 메인으로</Link>
        <h1 className="page-title">{title}</h1>
        {desc && <p className="page-desc">{desc}</p>}
        {children}
      </main>
    </>
  );
}
