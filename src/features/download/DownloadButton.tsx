// 담당: 장진영
// 결과 다운로드 공통 버튼 — 손금/관상/별자리/타로 결과 화면에서 같이 사용할 예정
// TODO(장진영): 결과 영역을 이미지로 저장하는 기능 구현 (예: html-to-image 라이브러리)
type Props = {
  targetId: string; // 저장할 결과 영역 요소의 id
};

export default function DownloadButton({ targetId }: Props) {
  return (
    <button className="btn" disabled title={`#${targetId} 저장 (준비 중)`}>
      결과 저장하기 (준비 중)
    </button>
  );
}
