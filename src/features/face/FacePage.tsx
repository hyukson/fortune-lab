import PageLayout from '../../components/PageLayout';

// 담당: 장혁수
// 산출 방식: MediaPipe Face Landmarker(478개 특징점)
//   → 얼굴 세로/가로 비율, 눈 사이 거리, 입 너비 등 상대 비율 계산 → 관상 풀이 규칙 적용
// TODO(장혁수): 기능 구현 — src/features/face/ 폴더 안에서 작업해주세요.
export default function FacePage() {
  return (
    <PageLayout title="관상" desc="얼굴 특징점으로 보는 관상 풀이">
      <p>🚧 준비 중입니다.</p>
    </PageLayout>
  );
}
