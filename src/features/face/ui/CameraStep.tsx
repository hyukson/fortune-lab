import { useEffect, useRef, useState } from 'react';
import { LIVE_RULES } from '../config';
import { ISSUE_MESSAGES } from '../content/messages';
import { toPixels } from '../core/geometry';
import { toAnalysisCanvas } from '../core/image';
import { loadLandmarker } from '../core/landmarker';
import { validateFace } from '../core/validate';

// 실시간 카메라 촬영
// 일정 간격으로 화면을 검사해서, 조건(정면·거리·표정·밝기)을 모두 만족한 상태가
// 약 1초 유지되면 자동으로 촬영합니다. → 분석에 쓸 수 없는 사진이 애초에 찍히지 않음
type Props = {
  onCapture: (frame: HTMLCanvasElement) => void;
  onCancel: () => void;
  onError: () => void; // 카메라 권한 거부 등
};

export default function CameraStep({ onCapture, onCancel, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hint, setHint] = useState('카메라를 준비하고 있어요');
  const [hold, setHold] = useState(0); // 0~1, 조건을 만족한 채 버틴 정도
  // 웹캠 화질·조명 때문에 자동 촬영이 안 될 때를 대비한 "직접 찍기"
  // (직접 찍어도 분석 전에 같은 사진 검사를 거치므로 쓸 수 없는 사진은 걸러짐)
  const [manual, setManual] = useState(false);
  const captureNow = useRef<(() => void) | null>(null);

  // 최신 콜백을 ref에 담아 카메라가 다시 켜지지 않게 함
  const handlers = useRef({ onCapture, onError });
  handlers.current = { onCapture, onError };

  useEffect(() => {
    let stream: MediaStream | undefined;
    let timer: number | undefined;
    let stopped = false;
    const manualTimer = window.setTimeout(() => setManual(true), LIVE_RULES.manualAfterMs);

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        if (!stopped) handlers.current.onError();
        return;
      }
      const video = videoRef.current;
      if (stopped || !video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.srcObject = stream;
      await video.play().catch(() => {});

      // 검사용 작은 프레임이 아니라 원본 해상도로 담아서 넘김
      const capture = () => {
        if (stopped || video.videoWidth === 0) return;
        stopped = true;
        handlers.current.onCapture(toAnalysisCanvas(video, video.videoWidth, video.videoHeight));
      };
      captureNow.current = capture;

      let landmarker;
      try {
        ({ landmarker } = await loadLandmarker());
      } catch {
        if (!stopped) setHint(ISSUE_MESSAGES.MODEL_LOAD_FAILED.live);
        return;
      }

      const frame = document.createElement('canvas');
      const ctx = frame.getContext('2d', { willReadFrequently: true })!;
      let passed = 0;

      const tick = () => {
        if (stopped) return;
        if (video.videoWidth > 0) {
          frame.width = LIVE_RULES.frameWidth;
          frame.height = Math.round((video.videoHeight / video.videoWidth) * frame.width);
          ctx.drawImage(video, 0, 0, frame.width, frame.height);

          const result = landmarker.detect(frame);
          const first = result.faceLandmarks[0];
          const pts = first ? toPixels(first, frame.width, frame.height) : null;
          const { issues } = validateFace(result, pts, frame, true);

          if (issues.length === 0) {
            passed += 1;
            setHint('좋아요, 그대로 잠시만요');
            if (passed >= LIVE_RULES.holdTicks) {
              setHold(1);
              capture();
              return;
            }
          } else {
            passed = 0;
            setHint(ISSUE_MESSAGES[issues[0]].live || ISSUE_MESSAGES.NO_FACE.live);
          }
          setHold(passed / LIVE_RULES.holdTicks);
        }
        timer = window.setTimeout(tick, LIVE_RULES.tickMs);
      };
      tick();
    })();

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      window.clearTimeout(manualTimer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const ready = hold > 0;

  return (
    <section className="face-step face-camera">
      <div className={`face-frame${ready ? ' is-ready' : ''}`}>
        {/* 거울처럼 보이도록 좌우 반전 (촬영 결과는 반전하지 않음) */}
        <video ref={videoRef} className="face-video" playsInline muted />
        <svg className="face-camera-guide" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <ellipse cx="200" cy="245" rx="118" ry="158" />
        </svg>
        <div className="face-hold" style={{ transform: `scaleX(${hold})` }} />
      </div>

      <p className="face-hint" role="status" aria-live="polite">{hint}</p>
      <p className="face-sub">조건이 맞으면 자동으로 촬영돼요.</p>

      <div className="face-actions">
        {manual && (
          <button className="btn" onClick={() => captureNow.current?.()}>직접 찍기</button>
        )}
        <button className="face-btn-ghost" onClick={onCancel}>돌아가기</button>
      </div>
    </section>
  );
}
