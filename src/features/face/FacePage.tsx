import { useRef, useState } from 'react';
import PageLayout from '../../components/PageLayout';
import { analyzeFace } from './core/analyze';
import { fileToCanvas } from './core/image';
import { findFaces } from './core/faceCount';
import { dist, LM, toPixels } from './core/geometry';
import { loadLandmarker } from './core/landmarker';
import type { Analysis, IssueCode, Quality, Sex } from './types';
import CameraStep from './ui/CameraStep';
import IntroStep from './ui/IntroStep';
import ResultStep from './ui/ResultStep';
import RetryStep from './ui/RetryStep';
import ScanStep from './ui/ScanStep';
import './face.css';

// 담당: 장혁수
// 화면 흐름: 안내 → (카메라 촬영 | 사진 올리기) → 스캔 연출 → 결과 / 다시 찍기 안내
// 주소는 나누지 않고 이 페이지 안에서 단계(step)만 바꿉니다.
type Ok = Extract<Analysis, { ok: true }>;
type Step =
  | { name: 'intro'; notice?: string }
  | { name: 'camera' }
  | { name: 'scan'; image: HTMLCanvasElement | null; analysis: Ok | null }
  | { name: 'result'; analysis: Ok }
  | { name: 'retry'; image: HTMLCanvasElement | null; issues: IssueCode[]; quality?: Quality };

const MIN_SEARCH_MS = 900; // 검출이 너무 빨리 끝나도 "찾는 중" 화면을 잠깐은 보여줌
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 개발 모드 전용: 화면을 거치지 않고 사진을 바로 분석 (기준값 보정 스크립트에서 사용)
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__faceDev = {
    async analyzeFile(file: File, sex: Sex = 'any') {
      const loaded = await fileToCanvas(file);
      if (!loaded.ok) return { ok: false, issues: [loaded.issue] };
      const a = await analyzeFace(loaded.canvas, sex);
      return a.ok
        ? { ok: true, metrics: a.metrics, quality: a.quality, hairline: a.hairline.kind, reading: a.reading, points: a.points }
        : { ok: false, issues: a.issues, quality: a.quality, debug: a.debug };
    },
    // 얼굴 수 세기에서 잡힌 얼굴 상자 확인용
    async faceBoxes(file: File) {
      const loaded = await fileToCanvas(file);
      if (!loaded.ok) return null;
      const { landmarker, detector } = await loadLandmarker();
      const first = landmarker.detect(loaded.canvas).faceLandmarks[0];
      if (!first) return null;
      const pts = toPixels(first, loaded.canvas.width, loaded.canvas.height);
      const main = dist(pts[LM.faceRight], pts[LM.faceLeft]);
      return { size: [loaded.canvas.width, loaded.canvas.height], main, boxes: findFaces(detector, loaded.canvas, main) };
    },
  };
}

export default function FacePage() {
  const [step, setStep] = useState<Step>({ name: 'intro' });
  const [sex, setSex] = useState<Sex>('any'); // 기준 범위 선택용 (선택 안 하면 전체 기준)
  const runId = useRef(0); // 분석 도중 다른 화면으로 넘어가면 늦게 온 결과를 버리기 위한 번호

  async function start(source: File | HTMLCanvasElement) {
    const id = ++runId.current;
    const stale = () => id !== runId.current;

    setStep({ name: 'scan', image: null, analysis: null });

    let image: HTMLCanvasElement;
    if (source instanceof File) {
      const loaded = await fileToCanvas(source);
      if (stale()) return;
      if (!loaded.ok) return setStep({ name: 'retry', image: null, issues: [loaded.issue] });
      image = loaded.canvas;
    } else {
      image = source;
    }
    setStep({ name: 'scan', image, analysis: null });

    const [analysis] = await Promise.all([analyzeFace(image, sex), wait(MIN_SEARCH_MS)]);
    if (stale()) return;
    if (import.meta.env.DEV) (window as unknown as { __face?: Analysis }).__face = analysis;

    if (analysis.ok) setStep({ name: 'scan', image, analysis });
    else setStep({ name: 'retry', image, issues: analysis.issues, quality: analysis.quality });
  }

  function go(next: Step) {
    runId.current++;
    setStep(next);
  }

  return (
    <PageLayout title="관상" desc="얼굴 특징점으로 보는 관상 풀이">
      <div className="face">
        {step.name === 'intro' && (
          <IntroStep
            notice={step.notice}
            sex={sex}
            onSex={setSex}
            onFile={start}
            onCamera={() => go({ name: 'camera' })}
          />
        )}
        {step.name === 'camera' && (
          <CameraStep
            onCapture={start}
            onCancel={() => go({ name: 'intro' })}
            onError={() => go({ name: 'intro', notice: '카메라를 사용할 수 없어요. 사진을 올려주세요.' })}
          />
        )}
        {step.name === 'scan' && (
          <ScanStep
            image={step.image}
            analysis={step.analysis}
            onDone={() => step.analysis && setStep({ name: 'result', analysis: step.analysis })}
          />
        )}
        {step.name === 'result' && <ResultStep analysis={step.analysis} onRetry={() => go({ name: 'intro' })} />}
        {step.name === 'retry' && (
          <RetryStep
            image={step.image}
            issues={step.issues}
            quality={step.quality}
            onRetry={() => go({ name: 'intro' })}
            onCamera={() => go({ name: 'camera' })}
          />
        )}
      </div>
    </PageLayout>
  );
}
