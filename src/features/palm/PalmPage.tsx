import PageLayout from '../../components/PageLayout';

// 담당: 오예은
// 산출 방식: MediaPipe Hands(21개 특징점) + 손금 분할 모델(ONNX)
//   → 생명선·두뇌선·감정선의 길이(손바닥 너비 대비 비율)·곡률·연속성 계산 → 손금 풀이 규칙 적용
// TODO(오예은): 기능 구현 — src/features/palm/ 폴더 안에서 작업해주세요.
export default function PalmPage() {
  return (
    <PageLayout title="손금" desc="손바닥 사진으로 보는 손금 풀이">
      <p>🚧 준비 중입니다.</p>
    </PageLayout>
  );
}
