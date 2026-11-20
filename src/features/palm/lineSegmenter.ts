// 손금 분할 모델(ONNX)을 브라우저에서 실행해 생명선 · 두뇌선 · 감정선 영역(마스크)을 찾습니다.
// 사진은 서버로 보내지 않고, onnxruntime-web으로 이 브라우저 안에서만 계산합니다.
import type * as Ort from 'onnxruntime-web/wasm';
import {
  CONF_THRESHOLD,
  DEFAULT_CLASS_NAMES,
  INPUT_SIZE,
  IOU_THRESHOLD,
  MASK_THRESHOLD,
  MODEL_INFO_URL,
  MODEL_URL,
  lineKeyFromClassName,
  type LineKey,
} from './config';
import { buildClassMasks, decodeDetections, nonMaxSuppression, type TensorLike } from './yoloDecode';

/** public/models/palm/palm-lines.onnx 파일이 아직 없을 때 */
export class ModelMissingError extends Error {}

export type SegmentResult = {
  masks: Partial<Record<LineKey, Uint8Array>>; // 선 종류별 마스크 (INPUT_SIZE × INPUT_SIZE)
  size: number;
  scale: number; // 원본 사진 → 모델 입력 배율
  padX: number;  // 모델 입력에서 사진이 시작하는 위치
  padY: number;
};

type LoadedModel = { ort: typeof Ort; session: Ort.InferenceSession; names: string[] };

let modelPromise: Promise<LoadedModel> | null = null;

function loadModel(): Promise<LoadedModel> {
  if (!modelPromise) {
    modelPromise = (async () => {
      const res = await fetch(MODEL_URL);
      // 파일이 없으면 GitHub Pages는 404, 개발 서버는 index.html(text/html)을 돌려줌
      const type = res.headers.get('content-type') ?? '';
      if (!res.ok || type.includes('text/html')) throw new ModelMissingError();
      const buffer = await res.arrayBuffer();

      const ort = await import('onnxruntime-web/wasm');
      const session = await ort.InferenceSession.create(new Uint8Array(buffer), {
        executionProviders: ['wasm'],
      });

      // 클래스 이름 (코랩에서 함께 내려받은 palm-lines.json, 없으면 기본값)
      let names = DEFAULT_CLASS_NAMES;
      try {
        const info = await fetch(MODEL_INFO_URL);
        if (info.ok && !(info.headers.get('content-type') ?? '').includes('text/html')) {
          const json = (await info.json()) as { names?: unknown };
          if (Array.isArray(json.names) && json.names.every((n) => typeof n === 'string')) {
            names = json.names as string[];
          }
        }
      } catch {
        // json이 없어도 기본값으로 진행
      }
      return { ort, session, names };
    })();
    modelPromise.catch(() => {
      modelPromise = null;
    });
  }
  return modelPromise;
}

export async function segmentPalmLines(image: HTMLCanvasElement): Promise<SegmentResult> {
  const { ort, session, names } = await loadModel();
  const size = INPUT_SIZE;

  // 1) 사진 비율을 유지한 채 640×640 안에 넣기 (남는 곳은 회색으로 채움 = letterbox)
  const scale = Math.min(size / image.width, size / image.height);
  const nw = Math.round(image.width * scale);
  const nh = Math.round(image.height * scale);
  const padX = Math.floor((size - nw) / 2);
  const padY = Math.floor((size - nh) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = 'rgb(114, 114, 114)';
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(image, padX, padY, nw, nh);

  // 2) 픽셀 → 모델 입력 숫자 [1, 3, 640, 640] (0~1 사이 값, RGB 순서)
  const { data } = ctx.getImageData(0, 0, size, size);
  const plane = size * size;
  const input = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    input[i] = data[i * 4] / 255;
    input[plane + i] = data[i * 4 + 1] / 255;
    input[2 * plane + i] = data[i * 4 + 2] / 255;
  }
  const tensor = new ort.Tensor('float32', input, [1, 3, size, size]);

  // 3) 모델 실행
  const outputs = await session.run({ [session.inputNames[0]]: tensor });
  let det: TensorLike | null = null;
  let proto: TensorLike | null = null;
  for (const name of session.outputNames) {
    const t = outputs[name];
    const like: TensorLike = { data: t.data as Float32Array, dims: t.dims };
    if (t.dims.length === 4) proto = like;
    else if (t.dims.length === 3) det = like;
  }
  if (!det || !proto) throw new Error('모델 출력 형식이 예상과 달라요. (분할 모델인지 확인)');

  // 4) 출력 해석 → 겹치는 검출 정리 → 클래스별 마스크
  const numMasks = proto.dims[1];
  const detections = nonMaxSuppression(
    decodeDetections(det, names.length, numMasks, CONF_THRESHOLD),
    IOU_THRESHOLD,
  );
  const classMasks = buildClassMasks(detections, proto, names.length, size, MASK_THRESHOLD);

  // 5) 클래스 이름 → 생명선/두뇌선/감정선
  const masks: Partial<Record<LineKey, Uint8Array>> = {};
  names.forEach((name, c) => {
    const key = lineKeyFromClassName(name);
    if (!key) return;
    const prev = masks[key];
    if (!prev) {
      masks[key] = classMasks[c];
    } else {
      for (let i = 0; i < prev.length; i++) if (classMasks[c][i]) prev[i] = 1;
    }
  });

  return { masks, size, scale, padX, padY };
}
