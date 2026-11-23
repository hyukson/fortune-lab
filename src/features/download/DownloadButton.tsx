import { useState } from 'react';
import { captureElement } from './capture';

// 담당: 장진영
// 결과 다운로드 공통 버튼 — 손금/관상/별자리/타로 결과 화면에서 같이 사용
//
// 사용법: 저장할 영역에 id를 붙이고, 그 id를 targetId로 넘기면 됩니다.
//   <section id="palm-result"> ...결과... </section>
//   <DownloadButton targetId="palm-result" />
// 저장 이미지에서 빼고 싶은 요소에는 data-download-ignore 속성을 붙이세요.
//   <button data-download-ignore>다시 하기</button>
//
// 동작: 영역을 PNG로 바꿔서 내려받기 (capture.ts · 서버로 보내지 않고 브라우저 안에서만 처리)
//  - p5 캔버스·SVG 그래프도 그대로 찍힘, 아래에 사이트 이름이 붙음
//  - 휴대폰에서 공유 기능이 있으면 공유 창(사진 저장·카톡 보내기)을 먼저 띄움

type Props = {
  targetId: string; // 저장할 결과 영역 요소의 id
  label?: string;
};

type Status = 'idle' | 'saving' | 'error';

function today() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function DownloadButton({ targetId, label = '결과 이미지로 저장' }: Props) {
  const [status, setStatus] = useState<Status>('idle');

  async function handleClick() {
    const target = document.getElementById(targetId);
    if (!target) {
      console.warn(`[DownloadButton] #${targetId} 요소를 찾지 못했어요.`);
      setStatus('error');
      return;
    }
    setStatus('saving');
    try {
      const blob = await captureElement(target);
      const filename = `운세연구소_${targetId}_${today()}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      // 휴대폰: 공유 창으로 (사진 앱 저장·메신저 전송이 쉬움)
      const touch = window.matchMedia('(pointer: coarse)').matches;
      if (touch && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: '운세연구소 결과' });
          setStatus('idle');
          return;
        } catch (e) {
          if ((e as DOMException).name === 'AbortError') {
            setStatus('idle'); // 사용자가 공유 창을 닫음
            return;
          }
          // 공유 실패 → 아래에서 파일로 내려받기
        }
      }
      download(blob, filename);
      setStatus('idle');
    } catch (e) {
      console.error('[DownloadButton] 저장 실패', e);
      setStatus('error');
    }
  }

  return (
    <button className="btn" type="button" onClick={handleClick} disabled={status === 'saving'} data-download-ignore>
      {status === 'saving' ? '이미지 만드는 중…' : status === 'error' ? '저장 실패 · 다시 시도' : label}
    </button>
  );
}
