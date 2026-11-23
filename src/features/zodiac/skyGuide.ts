// 담당: 김예진
// "몇 시에 어느 방향 하늘을 보면 내 별자리가 보이는지" 계산 (서울 기준)
//
// 방법 (천문 계산 공식 단순화)
//  1) 별자리 중심의 하늘 좌표(적경 RA, 적위 Dec)를 미리 넣어 둠
//  2) 날짜·시각 → 그 순간 서울에서 하늘이 얼마나 돌아갔는지(항성시)를 계산
//  3) 항성시와 적경으로 별자리의 높이(고도)와 방향(방위각)을 계산
//  4) 밤 9시 ~ 새벽 4시 중 (여름엔 밤 8시가 아직 밝아서 9시부터) 가장 높이 뜨는 시각을 골라 안내
//     → 그 시간대 내내 너무 낮으면(해와 가까운 계절) "몇 월에 잘 보이는지" 안내
//
// [AI 사용 표시] 이 파일의 코드는 Claude(AI)가 작성했습니다. (AI 사용 비율: 약 100%)

const LAT = 37.57; // 서울 위도
const LON = 126.98; // 서울 경도
const KST = 9; // 한국 시간 = 세계시 + 9시간
const MIN_ALT = 20; // 이보다 낮으면 건물·산에 가려 보기 어렵다고 판단 (도)

// 별자리 중심 좌표 [적경(시), 적위(도)] — 대략값
const CENTER: Record<string, [number, number]> = {
  aries: [2.6, 20],
  taurus: [4.7, 15],
  gemini: [7.1, 23],
  cancer: [8.6, 20],
  leo: [10.7, 15],
  virgo: [13.4, -4],
  libra: [15.2, -15],
  scorpio: [16.9, -27],
  sagittarius: [19.1, -28],
  capricorn: [21.0, -18],
  aquarius: [22.3, -11],
  pisces: [0.9, 12],
};

const DIRECTIONS = ['북쪽', '북동쪽', '동쪽', '남동쪽', '남쪽', '남서쪽', '서쪽', '북서쪽'];
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** 한국 시각(년, 월, 일, 시) → 서울에서 본 별자리의 고도·방위각(도) */
function position(signId: string, y: number, m: number, d: number, hourKst: number) {
  const [ra, dec] = CENTER[signId];
  const utc = Date.UTC(y, m - 1, d, 0, 0, 0) + (hourKst - KST) * 3600_000;
  const days = (utc - Date.UTC(2000, 0, 1, 12)) / 86400_000; // 2000년 1월 1일 정오부터 지난 날 수
  const gmst = 18.697374558 + 24.06570982441908 * days; // 그리니치 항성시(시)
  const lst = (((gmst + LON / 15) % 24) + 24) % 24; // 서울 항성시
  const hourAngle = rad((lst - ra) * 15);
  const lat = rad(LAT);
  const decR = rad(dec);

  const alt = Math.asin(Math.sin(lat) * Math.sin(decR) + Math.cos(lat) * Math.cos(decR) * Math.cos(hourAngle));
  const az = Math.atan2(
    -Math.cos(decR) * Math.sin(hourAngle),
    Math.sin(decR) * Math.cos(lat) - Math.cos(decR) * Math.sin(lat) * Math.cos(hourAngle),
  );
  return { alt: deg(alt), az: (deg(az) + 360) % 360 };
}

/** 20 → "밤 8시", 0 → "자정", 2 → "새벽 2시" */
function hourLabel(h: number): string {
  const hour = ((h % 24) + 24) % 24;
  if (hour === 0) return '자정';
  if (hour < 6) return `새벽 ${hour}시`;
  return `밤 ${hour - 12}시`;
}

/** 방위각 → 8방향 */
function directionLabel(az: number): string {
  return DIRECTIONS[Math.round(az / 45) % 8];
}

/** 밤 9시 ~ 새벽 4시 중 가장 높이 뜨는 시각 */
function bestOfNight(signId: string, y: number, m: number, d: number) {
  let best = { hour: 21, alt: -90, az: 0 };
  for (let h = 21; h <= 28; h++) {
    // 24시 이후는 다음 날 새벽 (Date.UTC가 날짜를 자동으로 넘겨 줌)
    const p = position(signId, y, m, d, h);
    if (p.alt > best.alt) best = { hour: h, ...p };
  }
  return best;
}

/** 화면에 보여줄 한 줄 안내 */
export function getSkyGuide(signId: string, date: string): string {
  if (!CENTER[signId]) return '';
  const [y, m, d] = date.split('-').map(Number);
  const best = bestOfNight(signId, y, m, d);

  if (best.alt >= MIN_ALT) {
    return `${hourLabel(best.hour)}쯤 ${directionLabel(best.az)} 하늘을 올려다보세요 (높이 약 ${Math.round(best.alt / 5) * 5}°, 서울 기준)`;
  }

  // 지금은 잘 안 보임 → 1년 중 밤 9시에 가장 높이 뜨는 달을 찾아서 안내
  let bestMonth = 1;
  let bestAlt = -90;
  for (let month = 1; month <= 12; month++) {
    const p = position(signId, y, month, 15, 21);
    if (p.alt > bestAlt) {
      bestAlt = p.alt;
      bestMonth = month;
    }
  }
  const p = position(signId, y, bestMonth, 15, 21);
  return `지금은 해와 가까워 보기 어려워요. ${bestMonth}월 밤 9시쯤 ${directionLabel(p.az)} 하늘에서 잘 보여요`;
}
