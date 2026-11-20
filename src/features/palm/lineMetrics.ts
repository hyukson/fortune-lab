// 손금 마스크(선 영역)에서 길이 · 곡률(직선도) · 연속성(조각 수)을 계산합니다.
// (화면·라이브러리와 무관한 순수 계산)

export type Pt = { x: number; y: number };

export type MaskMeasure = {
  pieces: number;       // 선이 몇 조각으로 나뉘었는지 (연속성)
  length: number;       // 모든 조각의 길이 합 (픽셀)
  straightness: number; // 가장 긴 조각의 직선도: 양 끝 직선거리 ÷ 선 길이 (1 = 일직선)
  paths: Pt[][];        // 조각별 중심선 좌표 (그리기용)
};

/**
 * 순서:
 *  1) 연결된 픽셀끼리 묶어서 조각 나누기 (너무 작은 조각은 잡음으로 보고 제외)
 *  2) 조각마다 두께를 1픽셀까지 깎기 (세선화, Zhang-Suen 알고리즘)
 *  3) 깎고 남은 중심선에서 가장 먼 두 끝을 잇는 경로를 찾아 길이 재기
 */
export function measureMask(mask: Uint8Array, size: number, minPiecePixels: number): MaskMeasure | null {
  const components = findComponents(mask, size).filter((c) => c.length >= minPiecePixels);
  if (components.length === 0) return null;

  const pieces: { path: Pt[]; length: number }[] = [];
  for (const comp of components) {
    // 픽셀 경로는 계단 모양이라 그대로 재면 길이가 부풀려짐 → 부드럽게 다듬은 뒤 측정
    const path = smoothPath(longestSkeletonPath(comp, size), SMOOTH_RADIUS);
    const length = pathLength(path);
    if (length >= 5) pieces.push({ path, length });
  }
  if (pieces.length === 0) return null;

  pieces.sort((a, b) => b.length - a.length);
  const main = pieces[0];
  const first = main.path[0];
  const last = main.path[main.path.length - 1];
  const chord = Math.hypot(last.x - first.x, last.y - first.y);

  return {
    pieces: pieces.length,
    length: pieces.reduce((sum, p) => sum + p.length, 0),
    straightness: main.length > 0 ? Math.min(1, chord / main.length) : 1,
    paths: pieces.map((p) => simplify(p.path, 2)),
  };
}

// ---------------------------------------------------------------------
// 1) 조각 나누기 — 대각선까지 이웃으로 보는 8방향 연결
// ---------------------------------------------------------------------
function findComponents(mask: Uint8Array, size: number): number[][] {
  const seen = new Uint8Array(mask.length);
  const result: number[][] = [];
  const stack: number[] = [];
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue;
    const comp: number[] = [];
    seen[start] = 1;
    stack.push(start);
    while (stack.length) {
      const i = stack.pop()!;
      comp.push(i);
      const x = i % size;
      const y = (i - x) / size;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= size) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if ((dx === 0 && dy === 0) || nx < 0 || nx >= size) continue;
          const j = ny * size + nx;
          if (mask[j] && !seen[j]) {
            seen[j] = 1;
            stack.push(j);
          }
        }
      }
    }
    result.push(comp);
  }
  return result;
}

// ---------------------------------------------------------------------
// 2)+3) 세선화 후 가장 긴 경로 찾기
// ---------------------------------------------------------------------
function longestSkeletonPath(comp: number[], size: number): Pt[] {
  // 조각만 잘라낸 작은 이미지 (가장자리 1픽셀 여백)
  let minX = size;
  let minY = size;
  let maxX = 0;
  let maxY = 0;
  for (const i of comp) {
    const x = i % size;
    const y = (i - x) / size;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const w = maxX - minX + 3;
  const h = maxY - minY + 3;
  const img = new Uint8Array(w * h);
  for (const i of comp) {
    const x = i % size;
    const y = (i - x) / size;
    img[(y - minY + 1) * w + (x - minX + 1)] = 1;
  }

  thin(img, w, h);

  const skeleton: number[] = [];
  for (let i = 0; i < img.length; i++) if (img[i]) skeleton.push(i);
  if (skeleton.length === 0) return [];

  // 아무 점에서 가장 먼 점 A → A에서 가장 먼 점 B → A~B 경로가 가장 긴 선
  const a = bfsFarthest(img, w, h, skeleton[0]).farthest;
  const { farthest: b, parent } = bfsFarthest(img, w, h, a);

  const path: Pt[] = [];
  for (let cur = b; cur !== -1; cur = parent[cur]) {
    const x = cur % w;
    const y = (cur - x) / w;
    path.push({ x: x - 1 + minX, y: y - 1 + minY });
    if (cur === a) break;
  }
  return path.reverse();
}

function bfsFarthest(img: Uint8Array, w: number, h: number, start: number) {
  const parent = new Int32Array(img.length).fill(-1);
  const visited = new Uint8Array(img.length);
  const queue: number[] = [start];
  visited[start] = 1;
  let farthest = start;
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head];
    farthest = i;
    const x = i % w;
    const y = (i - x) / w;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx;
        if (img[j] && !visited[j]) {
          visited[j] = 1;
          parent[j] = i;
          queue.push(j);
        }
      }
    }
  }
  return { farthest, parent };
}

// Zhang-Suen 세선화: 선의 모양은 유지하면서 두께를 1픽셀로 깎아 냄
function thin(img: Uint8Array, w: number, h: number): void {
  const toDelete: number[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (let pass = 0; pass < 2; pass++) {
      toDelete.length = 0;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const i = y * w + x;
          if (!img[i]) continue;
          const p2 = img[i - w];
          const p3 = img[i - w + 1];
          const p4 = img[i + 1];
          const p5 = img[i + w + 1];
          const p6 = img[i + w];
          const p7 = img[i + w - 1];
          const p8 = img[i - 1];
          const p9 = img[i - w - 1];
          const neighbors = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (neighbors < 2 || neighbors > 6) continue;
          const seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
          let transitions = 0;
          for (let k = 0; k < 8; k++) if (seq[k] === 0 && seq[k + 1] === 1) transitions++;
          if (transitions !== 1) continue;
          if (pass === 0) {
            if (p2 * p4 * p6 !== 0 || p4 * p6 * p8 !== 0) continue;
          } else if (p2 * p4 * p8 !== 0 || p2 * p6 * p8 !== 0) {
            continue;
          }
          toDelete.push(i);
        }
      }
      for (const i of toDelete) img[i] = 0;
      if (toDelete.length > 0) changed = true;
    }
  }
}

// 앞뒤 radius개 점의 평균으로 위치를 다듬기 (양 끝점은 그대로 둬서 직선거리는 유지)
const SMOOTH_RADIUS = 4;

function smoothPath(path: Pt[], radius: number): Pt[] {
  if (path.length <= 2) return path;
  const out: Pt[] = [];
  for (let i = 0; i < path.length; i++) {
    if (i === 0 || i === path.length - 1) {
      out.push(path[i]);
      continue;
    }
    const r = Math.min(radius, i, path.length - 1 - i); // 끝 쪽은 창을 좁혀서 끝점이 끌려가지 않게
    let sx = 0;
    let sy = 0;
    for (let k = i - r; k <= i + r; k++) {
      sx += path[k].x;
      sy += path[k].y;
    }
    out.push({ x: sx / (2 * r + 1), y: sy / (2 * r + 1) });
  }
  return out;
}

function pathLength(path: Pt[]): number {
  let len = 0;
  for (let i = 1; i < path.length; i++) {
    len += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
  }
  return len;
}

// 그리기용으로 점 개수 줄이기 (step개마다 하나 + 마지막 점)
function simplify(path: Pt[], step: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < path.length; i += step) out.push(path[i]);
  const last = path[path.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}
