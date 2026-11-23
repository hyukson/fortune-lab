// 카메라로 손바닥 찍기
// - 휴대폰은 뒷면 카메라, PC는 웹캠으로 시작 (전환 버튼 있음)
// - MediaPipe로 손을 실시간으로 찾아 특징점 21개와 뼈대를 화면에 그림 (ml5 handPose 예제처럼)
// - 위치·크기·움직임이 맞으면 그 장면에서 손금을 먼저 찾아 보고, 충분히 보일 때만 자동 촬영
import { useEffect, useRef, useState } from 'react';
import { findLines, type LineResult } from '../analyzePalm';
import {
  CAMERA_CHECK_MS,
  CAMERA_HOLD_CHECKS,
  CAMERA_MAX_MOVE,
  CAMERA_MAX_OFFSET,
  CAMERA_MAX_PALM,
  CAMERA_MIN_LINES,
  CAMERA_MIN_PALM,
  CAMERA_RETRY_MS,
  LINE_INFO,
  MAX_IMAGE_SIDE,
  MIN_FINGER_RATIO,
} from '../config';
import { prepareVideoDetector, type Point } from '../handDetector';
import { SIDE_LABEL, type HandSide } from '../handReading';
import { measureHand } from '../handShape';
import { preloadSegmenter } from '../lineSegmenter';
import PalmGuide from './PalmGuide';

type Props = {
  side: HandSide; // 찍을 손 (가이드 그림의 엄지 방향을 맞춤)
  onCapture: (image: HTMLCanvasElement) => void;
  onCancel: () => void;
  onError: () => void; // 카메라를 쓸 수 없을 때
};

type Facing = 'user' | 'environment';
type Frame = { canvas: HTMLCanvasElement; scale: number; mirrored: boolean };

// 손 뼈대 연결 (특징점 번호 쌍)
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

const isTouchDevice = () => window.matchMedia?.('(pointer: coarse)').matches ?? false;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const nextPaint = () => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

export default function CameraStep({ side, onCapture, onCancel, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [facing, setFacing] = useState<Facing>(() => (isTouchDevice() ? 'environment' : 'user'));
  const [canSwitch, setCanSwitch] = useState(false);
  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState('카메라를 켜는 중이에요...');
  const [hold, setHold] = useState(0); // 0~1 자동 촬영 진행도
  const [good, setGood] = useState(false);
  const [checking, setChecking] = useState(false);
  const captured = useRef(false);

  // 최신 값/콜백을 effect 안에서 쓰기 위해 ref에 보관
  const onCaptureRef = useRef(onCapture);
  const onErrorRef = useRef(onError);
  const facingRef = useRef(facing);
  onCaptureRef.current = onCapture;
  onErrorRef.current = onError;
  facingRef.current = facing;

  /** 지금 영상 한 장면을 캔버스로 (앞면 카메라는 화면에 보이는 그대로 좌우 반전) */
  const grabFrame = (): Frame | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const mirrored = facingRef.current === 'user';
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d')!;
    if (mirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return { canvas, scale, mirrored };
  };

  const finish = (canvas: HTMLCanvasElement) => {
    if (captured.current) return;
    captured.current = true;
    onCaptureRef.current(canvas);
  };

  const captureNow = () => {
    const frame = grabFrame();
    if (frame) finish(frame.canvas);
  };

  // 손금 모델을 미리 불러 둠 (첫 확인이 빨라지게)
  useEffect(() => preloadSegmenter(), []);

  // 카메라 켜기 (방향이 바뀌면 다시 켬)
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    setReady(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      onErrorRef.current();
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
      .then(async (s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = s;
        await video.play().catch(() => {});
        if (cancelled) return;
        setReady(true);
        const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
        if (!cancelled) setCanSwitch(devices.filter((d) => d.kind === 'videoinput').length > 1);
      })
      .catch(() => {
        if (!cancelled) onErrorRef.current();
      });

    // 화면을 벗어나면 카메라 끄기
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [facing]);

  // 손 실시간 검사 → 특징점 그리기 · 안내 문구 · 손금 확인 · 자동 촬영
  useEffect(() => {
    if (!ready) return;
    let stopped = false;
    let timer = 0;
    let streak = 0;
    let fails = 0;
    let prev: Point | null = null;
    let shownLines: { lines: LineResult[]; scale: number; until: number } | null = null;
    const colors = readColors();
    setHint('손 인식 준비 중이에요...');

    const draw = (pts: Point[] | null) => {
      const video = videoRef.current;
      const canvas = overlayRef.current;
      if (!video || !canvas) return;
      drawOverlay(canvas, video, facingRef.current === 'user', pts, colors, shownLines && performance.now() < shownLines.until ? shownLines : null);
    };

    // 자리를 잡은 장면에서 손금을 먼저 찾아 봄
    const checkLines = async (pts: Point[]) => {
      const frame = grabFrame();
      const video = videoRef.current;
      if (!frame || !video) return;
      setChecking(true);
      setHint('손금을 확인하고 있어요...');
      await nextPaint(); // 안내 문구가 먼저 보이도록 한 박자 쉬고 계산

      const mapped = pts.map((p) => ({
        x: (frame.mirrored ? video.videoWidth - p.x : p.x) * frame.scale,
        y: p.y * frame.scale,
      }));
      const palmWidth = Math.hypot(mapped[5].x - mapped[17].x, mapped[5].y - mapped[17].y);

      let lines: LineResult[];
      try {
        lines = await findLines(frame.canvas, mapped, palmWidth);
      } catch {
        // 모델을 못 쓰는 경우엔 확인 없이 찍고, 분석 화면에서 안내
        if (!stopped) finish(frame.canvas);
        return;
      }
      if (stopped) return;

      const count = lines.filter((l) => l.found).length;
      shownLines = { lines, scale: frame.scale, until: performance.now() + (count >= CAMERA_MIN_LINES ? 5000 : CAMERA_RETRY_MS) };
      draw(pts);

      if (count >= CAMERA_MIN_LINES) {
        setHint(`손금 ${count}개를 찾았어요! 분석을 시작할게요`);
        await wait(900);
        if (!stopped) finish(frame.canvas);
        return;
      }

      fails++;
      setHint(
        count === 0
          ? '손금이 잘 안 보여요. 밝은 곳에서 손바닥을 평평하게 펴 주세요'
          : `손금을 ${count}개만 찾았어요. 조금 더 밝은 곳에서 손바닥을 가까이 해 주세요`,
      );
      await wait(CAMERA_RETRY_MS);
      if (stopped) return;
      if (fails >= 3) setHint('잘 안 되면 [직접 찍기]를 눌러도 돼요');
      setChecking(false);
      streak = 0;
      prev = null;
    };

    prepareVideoDetector()
      .then((detect) => {
        const tick = async () => {
          if (stopped) return;
          const video = videoRef.current;
          const pts = video ? detect(video) : null;
          draw(pts);

          const verdict = video && pts ? judge(pts, video, prev) : { ok: false, hint: '손바닥을 화면 가운데에 비춰 주세요' };
          prev = pts ? palmCenter(pts) : null;
          streak = verdict.ok ? streak + 1 : Math.max(0, streak - 2);
          setGood(verdict.ok);
          setHold(streak / CAMERA_HOLD_CHECKS);
          if (!(fails >= 3 && !verdict.ok)) setHint(verdict.ok ? '좋아요! 그대로 잠깐만 있어 주세요' : verdict.hint);

          if (pts && streak >= CAMERA_HOLD_CHECKS) {
            await checkLines(pts); // 확인하는 동안은 검사를 멈춤
            if (stopped || captured.current) return;
          }
          timer = window.setTimeout(tick, CAMERA_CHECK_MS);
        };
        tick();
      })
      .catch(() => {
        if (!stopped) setHint('자동 촬영을 쓸 수 없어요. [직접 찍기]를 눌러 주세요.');
      });

    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [ready]);

  return (
    <section className="palm-step palm-camera">
      <div className={`palm-frame palm-camera-frame${good || checking ? ' is-ready' : ''}`}>
        <video
          ref={videoRef}
          className={`palm-video${facing === 'user' ? ' is-mirrored' : ''}`}
          playsInline
          muted
        />
        {/* 손바닥이 카메라를 볼 때 오른손은 엄지가 오른쪽, 거울(앞면 카메라) 화면에서는 반대 */}
        <PalmGuide className="palm-camera-guide" flip={(side === 'left') !== (facing === 'user')} />
        <canvas ref={overlayRef} className="palm-overlay" aria-hidden="true" />
        <div className="palm-hold" style={{ transform: `scaleX(${checking ? 1 : Math.min(1, hold)})` }} />
      </div>

      <p className="palm-hint" role="status" aria-live="polite">
        {hint}
      </p>
      <p className="palm-sub">
        <b>{SIDE_LABEL[side]}</b> 손가락을 쭉 펴고 손바닥을 점선에 맞추면, 손금을 확인한 뒤 자동으로 찍혀요.
      </p>

      <div className="palm-actions">
        <button className="btn" onClick={captureNow} disabled={!ready}>
          직접 찍기
        </button>
        {canSwitch && (
          <button
            className="btn palm-btn-sub"
            onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
            disabled={checking}
          >
            카메라 전환
          </button>
        )}
        <button className="palm-btn-ghost" onClick={onCancel}>
          돌아가기
        </button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// 화면 위 그림 (특징점 · 뼈대 · 확인한 손금)
// ---------------------------------------------------------------------
type Colors = { gold: string; text: string; sub: string; bg: string };

// 캔버스에서는 CSS 변수를 직접 못 써서, theme.css 값을 읽어서 사용
function readColors(): Colors {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return { gold: v('--color-gold'), text: v('--color-text'), sub: v('--color-sub'), bg: v('--color-bg') };
}

function drawOverlay(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  mirrored: boolean,
  pts: Point[] | null,
  colors: Colors,
  shown: { lines: LineResult[]; scale: number } | null,
) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  if (!video.videoWidth) return;

  // 영상이 object-fit: cover 로 잘려 보이는 것과 같은 변환
  const k = Math.max(w / video.videoWidth, h / video.videoHeight);
  const ox = (w - video.videoWidth * k) / 2;
  const oy = (h - video.videoHeight * k) / 2;
  const toScreen = (p: Point, flip: boolean) => {
    const x = ox + p.x * k;
    return { x: flip ? w - x : x, y: oy + p.y * k };
  };

  // 확인한 손금 (촬영 캔버스 좌표는 이미 화면 방향이라 다시 뒤집지 않음)
  if (shown) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const line of shown.lines) {
      if (!line.found) continue;
      const [r, g, b] = LINE_INFO[line.key].rgb;
      for (const [width, color] of [
        [7, colors.bg],
        [3.5, `rgb(${r}, ${g}, ${b})`],
      ] as const) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        for (const path of line.paths) {
          if (path.length < 2) continue;
          ctx.beginPath();
          path.forEach((p, i) => {
            const s = toScreen({ x: p.x / shown.scale, y: p.y / shown.scale }, false);
            if (i === 0) ctx.moveTo(s.x, s.y);
            else ctx.lineTo(s.x, s.y);
          });
          ctx.stroke();
        }
      }
    }
  }

  if (!pts) return;
  const sp = pts.map((p) => toScreen(p, mirrored));

  // 뼈대
  ctx.strokeStyle = colors.text;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2;
  for (const [a, b] of HAND_CONNECTIONS) {
    ctx.beginPath();
    ctx.moveTo(sp[a].x, sp[a].y);
    ctx.lineTo(sp[b].x, sp[b].y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // 특징점 (손바닥 너비 기준점 5 · 17번은 크게)
  sp.forEach((p, i) => {
    const big = i === 0 || i === 5 || i === 17;
    ctx.beginPath();
    ctx.arc(p.x, p.y, big ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fillStyle = big ? colors.gold : colors.sub;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = colors.bg;
    ctx.stroke();
  });
}

// ---------------------------------------------------------------------
// 자리 판정
// ---------------------------------------------------------------------
// 손바닥 중심 = 손목과 네 손가락 뿌리의 평균
function palmCenter(pts: Point[]): Point {
  const ids = [0, 5, 9, 13, 17];
  return {
    x: ids.reduce((s, i) => s + pts[i].x, 0) / ids.length,
    y: ids.reduce((s, i) => s + pts[i].y, 0) / ids.length,
  };
}

function judge(pts: Point[], video: HTMLVideoElement, prev: Point | null): { ok: boolean; hint: string } {
  const base = Math.min(video.videoWidth, video.videoHeight);
  const m = measureHand(pts);
  const size = m.palmLength / base;
  const c = palmCenter(pts);
  const offset = Math.max(
    Math.abs(c.x - video.videoWidth / 2) / video.videoWidth,
    Math.abs(c.y - video.videoHeight / 2) / video.videoHeight,
  );

  if (size < CAMERA_MIN_PALM) return { ok: false, hint: '손을 조금 더 가까이 가져와 주세요' };
  if (size > CAMERA_MAX_PALM) return { ok: false, hint: '손을 조금 멀리 해 주세요' };
  if (offset > CAMERA_MAX_OFFSET) return { ok: false, hint: '손을 화면 가운데로 옮겨 주세요' };
  if (m.fingerRatio < MIN_FINGER_RATIO + 0.15) return { ok: false, hint: '손가락을 쭉 펴 주세요' };
  if (prev && Math.hypot(c.x - prev.x, c.y - prev.y) / base > CAMERA_MAX_MOVE) {
    return { ok: false, hint: '움직이지 말고 잠깐만 그대로요' };
  }
  return { ok: true, hint: '' };
}
