// YOLO 분할(segmentation) 모델의 출력 숫자를 '검출 결과 + 마스크'로 바꾸는 함수 모음
// (화면·라이브러리와 무관한 순수 계산이라 따로 분리)

export type TensorLike = { data: Float32Array; dims: readonly number[] };

export type Detection = {
  cls: number;   // 클래스 번호
  score: number; // 점수 (0~1)
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  coeffs: Float32Array; // 마스크 계수 (보통 32개)
};

/**
 * 검출 결과 풀기. 두 가지 출력 형태를 모두 지원합니다.
 *  - YOLO11 기본형: [1, 4+클래스수+마스크수, 후보수]  (cx, cy, w, h, 클래스 점수..., 마스크 계수...)
 *  - NMS 포함형(end2end): [1, 후보수, 6+마스크수]      (x1, y1, x2, y2, 점수, 클래스, 마스크 계수...)
 */
export function decodeDetections(
  det: TensorLike,
  numClasses: number,
  numMasks: number,
  confThreshold: number,
): Detection[] {
  const d = det.dims;
  const data = det.data;
  const channels = 4 + numClasses + numMasks;
  const out: Detection[] = [];

  if (d.length !== 3) throw new Error(`알 수 없는 모델 출력 형태: [${d.join(', ')}]`);

  if (d[1] === channels) {
    // [1, C, N] — 채널이 앞에 있는 형태 (Ultralytics YOLO11 기본 ONNX)
    const n = d[2];
    for (let i = 0; i < n; i++) {
      let best = -1;
      let bestScore = 0;
      for (let c = 0; c < numClasses; c++) {
        const s = data[(4 + c) * n + i];
        if (s > bestScore) {
          bestScore = s;
          best = c;
        }
      }
      if (best < 0 || bestScore < confThreshold) continue;
      const cx = data[i];
      const cy = data[n + i];
      const w = data[2 * n + i];
      const h = data[3 * n + i];
      const coeffs = new Float32Array(numMasks);
      for (let k = 0; k < numMasks; k++) coeffs[k] = data[(4 + numClasses + k) * n + i];
      out.push({ cls: best, score: bestScore, x1: cx - w / 2, y1: cy - h / 2, x2: cx + w / 2, y2: cy + h / 2, coeffs });
    }
    return out;
  }

  if (d[2] === channels) {
    // [1, N, C] — 위와 같은 내용이 행/열만 바뀐 형태
    const n = d[1];
    for (let i = 0; i < n; i++) {
      const row = i * channels;
      let best = -1;
      let bestScore = 0;
      for (let c = 0; c < numClasses; c++) {
        const s = data[row + 4 + c];
        if (s > bestScore) {
          bestScore = s;
          best = c;
        }
      }
      if (best < 0 || bestScore < confThreshold) continue;
      const cx = data[row];
      const cy = data[row + 1];
      const w = data[row + 2];
      const h = data[row + 3];
      const coeffs = data.slice(row + 4 + numClasses, row + channels);
      out.push({ cls: best, score: bestScore, x1: cx - w / 2, y1: cy - h / 2, x2: cx + w / 2, y2: cy + h / 2, coeffs });
    }
    return out;
  }

  if (d[2] === 6 + numMasks) {
    // [1, N, 6+마스크수] — 모델 안에서 이미 NMS가 끝난 형태
    const n = d[1];
    const stride = 6 + numMasks;
    for (let i = 0; i < n; i++) {
      const row = i * stride;
      const score = data[row + 4];
      if (score < confThreshold) continue;
      out.push({
        cls: Math.round(data[row + 5]),
        score,
        x1: data[row],
        y1: data[row + 1],
        x2: data[row + 2],
        y2: data[row + 3],
        coeffs: data.slice(row + 6, row + stride),
      });
    }
    return out;
  }

  throw new Error(`알 수 없는 모델 출력 형태: [${d.join(', ')}]`);
}

function iou(a: Detection, b: Detection): number {
  const ix = Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1));
  const iy = Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));
  const inter = ix * iy;
  const areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
  const areaB = (b.x2 - b.x1) * (b.y2 - b.y1);
  return inter / (areaA + areaB - inter + 1e-9);
}

/** 같은 클래스끼리 많이 겹치는 검출은 점수 높은 것 하나만 남기기 (NMS) */
export function nonMaxSuppression(dets: Detection[], iouThreshold: number): Detection[] {
  const sorted = [...dets].sort((a, b) => b.score - a.score);
  const kept: Detection[] = [];
  for (const det of sorted) {
    if (kept.every((k) => k.cls !== det.cls || iou(k, det) < iouThreshold)) kept.push(det);
  }
  return kept;
}

/**
 * 검출마다 마스크를 계산해서 클래스별로 합치기.
 * 결과: 클래스 수만큼의 size×size 배열 (1 = 선, 0 = 배경)
 */
export function buildClassMasks(
  dets: Detection[],
  proto: TensorLike,
  numClasses: number,
  size: number,
  maskThreshold: number,
): Uint8Array[] {
  const [, numMasks, ph, pw] = proto.dims;
  const masks = Array.from({ length: numClasses }, () => new Uint8Array(size * size));
  const sx = pw / size;
  const sy = ph / size;
  // sigmoid(v) > 기준  ⇔  v > log(기준 / (1 - 기준))
  const logitThreshold = Math.log(maskThreshold / (1 - maskThreshold));
  const plane = ph * pw;

  for (const det of dets) {
    if (det.cls < 0 || det.cls >= numClasses) continue;
    const bx1 = clampInt(Math.floor(det.x1), 0, size - 1);
    const by1 = clampInt(Math.floor(det.y1), 0, size - 1);
    const bx2 = clampInt(Math.ceil(det.x2), 0, size - 1);
    const by2 = clampInt(Math.ceil(det.y2), 0, size - 1);
    if (bx2 <= bx1 || by2 <= by1) continue;

    // 박스를 덮는 프로토타입 영역(작은 해상도)에서 마스크 값 계산
    const px1 = Math.max(0, Math.floor(bx1 * sx) - 1);
    const py1 = Math.max(0, Math.floor(by1 * sy) - 1);
    const px2 = Math.min(pw - 1, Math.ceil(bx2 * sx) + 1);
    const py2 = Math.min(ph - 1, Math.ceil(by2 * sy) + 1);
    const rw = px2 - px1 + 1;
    const rh = py2 - py1 + 1;
    const logits = new Float32Array(rw * rh);
    for (let py = py1; py <= py2; py++) {
      for (let px = px1; px <= px2; px++) {
        let v = 0;
        const offset = py * pw + px;
        for (let k = 0; k < numMasks; k++) v += det.coeffs[k] * proto.data[k * plane + offset];
        logits[(py - py1) * rw + (px - px1)] = v;
      }
    }

    // 원래 해상도(size)로 부드럽게 늘리면서(쌍선형 보간) 기준 넘는 픽셀만 표시
    const mask = masks[det.cls];
    for (let y = by1; y <= by2; y++) {
      const fy = clamp((y + 0.5) * sy - 0.5 - py1, 0, rh - 1);
      const y0 = Math.floor(fy);
      const y1 = Math.min(y0 + 1, rh - 1);
      const wy = fy - y0;
      for (let x = bx1; x <= bx2; x++) {
        const fx = clamp((x + 0.5) * sx - 0.5 - px1, 0, rw - 1);
        const x0 = Math.floor(fx);
        const x1 = Math.min(x0 + 1, rw - 1);
        const wx = fx - x0;
        const top = logits[y0 * rw + x0] * (1 - wx) + logits[y0 * rw + x1] * wx;
        const bottom = logits[y1 * rw + x0] * (1 - wx) + logits[y1 * rw + x1] * wx;
        if (top * (1 - wy) + bottom * wy > logitThreshold) mask[y * size + x] = 1;
      }
    }
  }
  return masks;
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function clampInt(v: number, lo: number, hi: number): number {
  return Math.round(clamp(v, lo, hi));
}
