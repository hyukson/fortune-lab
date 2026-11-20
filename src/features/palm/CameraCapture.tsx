// 웹캠으로 손바닥 사진 찍기 (노트북·PC용. 휴대폰은 '사진 올리기'를 누르면 카메라가 바로 열림)
import { useEffect, useRef, useState } from 'react';
import { MAX_IMAGE_SIDE } from './config';

type Props = {
  onCapture: (image: HTMLCanvasElement) => void;
  onCancel: () => void;
};

export default function CameraCapture({ onCapture, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    navigator.mediaDevices
      ?.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        const video = videoRef.current;
        if (video) {
          video.srcObject = s;
          video.play().then(() => setReady(true)).catch(() => setReady(true));
        }
      })
      .catch(() => setError('카메라를 켤 수 없어요. 브라우저의 카메라 권한을 확인하거나 [사진 올리기]를 이용해 주세요.'));

    if (!navigator.mediaDevices) setError('이 브라우저에서는 카메라를 쓸 수 없어요. [사진 올리기]를 이용해 주세요.');

    // 화면을 벗어나면 카메라 끄기
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d')!;
    // 화면에 보이는 그대로(거울처럼) 저장
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    onCapture(canvas);
  };

  return (
    <section className="palm-card palm-camera">
      {error ? (
        <p className="palm-error-text">{error}</p>
      ) : (
        <div className="palm-camera-frame">
          <video ref={videoRef} playsInline muted />
          <div className="palm-camera-guide" aria-hidden="true" />
        </div>
      )}
      <p className="palm-sub-text">손바닥을 점선 안에 펼치고, 손가락을 쭉 편 채로 찍어 주세요.</p>
      <div className="palm-actions">
        <button className="btn" onClick={capture} disabled={!ready || !!error}>
          찍기
        </button>
        <button className="btn palm-btn-sub" onClick={onCancel}>
          취소
        </button>
      </div>
    </section>
  );
}
