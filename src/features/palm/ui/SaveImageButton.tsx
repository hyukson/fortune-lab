// 손금 결과 카드 이미지 저장 버튼
// 공통 결과 저장 버튼(src/features/download/DownloadButton, 장진영 담당)이 아직 준비 중이라 손금 전용으로 만든 버튼.
// 공통 버튼이 완성되면 바꿔 달아도 됩니다.
import { useState } from 'react';
import type { PalmResult } from '../analyzePalm';
import type { HandChoice } from '../handReading';
import { canvasToFile, drawResultCard } from '../resultCard';

type Props = { result: PalmResult; choice: HandChoice };

const isTouchDevice = () => window.matchMedia?.('(pointer: coarse)').matches ?? false;

export default function SaveImageButton({ result, choice }: Props) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  async function save() {
    setBusy(true);
    setStatus('');
    try {
      const canvas = await drawResultCard(result, choice);
      const date = new Date();
      const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
      const file = await canvasToFile(canvas, `운세연구소-손금-${stamp}.png`);

      // 휴대폰: 공유 창(사진 앱에 저장 가능) / PC: 파일로 내려받기
      if (isTouchDevice() && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: '운세연구소 손금 결과' });
          setStatus('저장 · 공유 창을 열었어요');
        } catch (e) {
          if ((e as Error).name !== 'AbortError') throw e; // 사용자가 닫은 건 오류가 아님
        }
      } else {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
        setStatus('이미지를 저장했어요');
      }
    } catch (e) {
      console.error(e);
      setStatus('이미지를 만들지 못했어요. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="palm-save">
      <button className="btn" onClick={save} disabled={busy}>
        {busy ? '이미지 만드는 중...' : '결과 이미지 저장'}
      </button>
      {status && (
        <p className="palm-fineprint" role="status">
          {status}
        </p>
      )}
    </div>
  );
}
