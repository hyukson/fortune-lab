import PageLayout from '../../components/PageLayout';

// 담당: 김예진
// 산출 방식: 생년월일 → 별자리 판별
//   + Seed = Hash(생일 + 조회 날짜 + 사용자 ID) 기반 난수 → 같은 날 같은 사람은 항상 같은 결과
// TODO(김예진): 기능 구현 — src/features/zodiac/ 폴더 안에서 작업해주세요.
export default function ZodiacPage() {
  return (
    <PageLayout title="별자리 운세" desc="생년월일로 보는 오늘의 별자리 운세">
      <p>🚧 준비 중입니다.</p>
    </PageLayout>
  );
}
