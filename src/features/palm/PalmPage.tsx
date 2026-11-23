import { useRef, useState } from 'react';
import PageLayout from '../../components/PageLayout';
import { savePalmResult } from '../chatbot/adapters/savePalm';
import { analyzePalm, AnalyzeError, ANALYZE_STAGES, fileToCanvas, type PalmResult } from './analyzePalm';
import type { HandChoice } from './handReading';
import CameraStep from './ui/CameraStep';
import IntroStep from './ui/IntroStep';
import ResultStep from './ui/ResultStep';
import RetryStep, { type RetryReason } from './ui/RetryStep';
import ScanStep from './ui/ScanStep';
import './palm.css';

// 담당: 오예은
// 산출 방식: MediaPipe Hands(21개 특징점) + 손금 분할 모델(ONNX)
//   → 생명선·두뇌선·감정선의 길이(손바닥 너비 대비 비율)·곡률·연속성 + 손 모양·손가락 비율 → 풀이 규칙 · 점수표
// 화면 흐름: 안내 → (카메라 촬영 | 사진 올리기) → 스캔 → 결과 / 다시 찍기 안내
// 주소는 나누지 않고 이 페이지 안에서 단계(step)만 바꿉니다.

type Step =
  | { name: 'intro'; notice?: string }
  | { name: 'camera' }
  | { name: 'scan'; image: HTMLCanvasElement | null; stage: number }
  | { name: 'result'; result: PalmResult; choice: HandChoice }
  | { name: 'retry'; image: HTMLCanvasElement | null; reason: RetryReason; message?: string };

const MIN_SCAN_MS = 1400; // 분석이 빨리 끝나도 스캔 화면을 잠깐은 보여 줌
const DONE_PAUSE_MS = 450; // 체크리스트가 다 채워진 모습을 잠깐 보여 줌
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 개발 모드 전용: 화면을 거치지 않고 사진 측정값 보기 (config.ts 기준값 보정용)
//   브라우저 콘솔에서: const f = document.createElement('input'); f.type='file'; f.onchange=async()=>console.table((await __palmDev.analyzeFile(f.files[0])).hand); f.click();
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__palmDev = {
    async analyzeFile(file: File) {
      const r = await analyzePalm(await fileToCanvas(file));
      return {
        hand: r.handMetrics,
        handCats: r.handCats,
        lines: r.lines.map(({ key, found, ratio, straightness, pieces, cats }) => ({ key, found, ratio, straightness, pieces, cats })),
        scores: r.scores,
      };
    },
  };
}

export default function PalmPage() {
  const [step, setStep] = useState<Step>({ name: 'intro' });
  const [choice, setChoice] = useState<HandChoice>({ side: 'right', dominant: 'right' }); // 찍을 손 · 주로 쓰는 손
  const runId = useRef(0); // 분석 도중 다른 화면으로 넘어가면 늦게 온 결과를 버리기 위한 번호

  async function start(source: File | HTMLCanvasElement) {
    const id = ++runId.current;
    const usedChoice = choice; // 분석 시작 시점의 선택을 결과에 함께 보관
    const stale = () => id !== runId.current;

    setStep({ name: 'scan', image: null, stage: 0 });

    let image: HTMLCanvasElement;
    if (source instanceof File) {
      try {
        image = await fileToCanvas(source);
      } catch {
        if (!stale()) setStep({ name: 'retry', image: null, reason: 'file' });
        return;
      }
      if (stale()) return;
    } else {
      image = source;
    }
    setStep({ name: 'scan', image, stage: 0 });
    const startedAt = performance.now();

    try {
      const [result] = await Promise.all([
        analyzePalm(image, (stage) => !stale() && setStep({ name: 'scan', image, stage })),
        wait(MIN_SCAN_MS),
      ]);
      if (stale()) return;
      savePalmResult(result); // AI 운세 상담에서 쓰도록 결과 저장 (김예진 추가, src/features/chatbot 참고)
      setStep({ name: 'scan', image, stage: ANALYZE_STAGES.length });
      await wait(DONE_PAUSE_MS);
      if (!stale()) setStep({ name: 'result', result, choice: usedChoice });
    } catch (e) {
      // 실패해도 스캔 화면이 너무 빨리 사라지지 않게 최소 시간은 채움
      await wait(Math.max(0, MIN_SCAN_MS - (performance.now() - startedAt)));
      if (stale()) return;
      console.error(e);
      const reason: RetryReason = e instanceof AnalyzeError ? e.code : 'unknown';
      setStep({ name: 'retry', image, reason, message: e instanceof Error ? e.message : undefined });
    }
  }

  function go(next: Step) {
    runId.current++;
    setStep(next);
  }

  return (
    <PageLayout title="손금" desc="손바닥 사진으로 보는 손금 풀이">
      <div className="palm">
        {step.name === 'intro' && (
          <IntroStep
            notice={step.notice}
            choice={choice}
            onChoice={setChoice}
            onFile={start}
            onCamera={() => go({ name: 'camera' })}
          />
        )}
        {step.name === 'camera' && (
          <CameraStep
            side={choice.side}
            onCapture={start}
            onCancel={() => go({ name: 'intro' })}
            onError={() =>
              go({ name: 'intro', notice: '카메라를 사용할 수 없어요. 카메라 권한을 확인하거나 사진을 올려 주세요.' })
            }
          />
        )}
        {step.name === 'scan' && <ScanStep image={step.image} stage={step.stage} />}
        {step.name === 'result' && (
          <ResultStep result={step.result} choice={step.choice} onRetry={() => go({ name: 'intro' })} />
        )}
        {step.name === 'retry' && (
          <RetryStep
            image={step.image}
            reason={step.reason}
            message={step.message}
            onRetry={() => go({ name: 'intro' })}
            onCamera={() => go({ name: 'camera' })}
          />
        )}
      </div>
    </PageLayout>
  );
}
