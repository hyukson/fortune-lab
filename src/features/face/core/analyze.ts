import type { Analysis, Sex } from '../types';
import { toPixels } from './geometry';
import { findHairline } from './hairline';
import { loadLandmarker } from './landmarker';
import { measureFace } from './measure';
import { buildReading } from './reading';
import { validateFace } from './validate';

// 관상 분석 전체 흐름
//   얼굴 검출 → 사진 품질 검사 → 머리카락 경계 찾기 → 비율 측정 → 규칙으로 풀이
// image: fileToCanvas 또는 toAnalysisCanvas로 만든 분석용 캔버스
// sex: 사용자가 고른 성별 (기준 범위 선택용, 'any'면 구분 없이)
export async function analyzeFace(image: HTMLCanvasElement, sex: Sex = 'any'): Promise<Analysis> {
  let loaded;
  let result;
  try {
    loaded = await loadLandmarker();
    result = loaded.landmarker.detect(image);
  } catch (e) {
    console.error(e);
    return { ok: false, issues: ['MODEL_LOAD_FAILED'] };
  }

  const first = result.faceLandmarks[0];
  const points = first ? toPixels(first, image.width, image.height) : null;

  const { issues, quality } = validateFace(result, points, image, false, loaded.detector);
  if (issues.length > 0 || !points || !quality) {
    // 개발 모드에서는 탈락한 사진의 측정값도 남겨 기준값 보정에 참고
    const debug =
      import.meta.env.DEV && points ? measureFace(points, findHairline(loaded.hair, image, points)) : undefined;
    return { ok: false, issues, quality, debug };
  }

  const hairline = findHairline(loaded.hair, image, points);
  const metrics = measureFace(points, hairline);
  return {
    ok: true,
    image,
    points,
    hairline,
    lines: loaded.lines,
    metrics,
    quality,
    reading: buildReading(metrics, sex, hairline.kind),
  };
}
