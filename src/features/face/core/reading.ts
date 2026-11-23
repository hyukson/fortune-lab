import { FORTUNE_ORDER, RANGES, RULE_VERSION, SAMJEONG, SCORE_LIMIT, SCORE_RULES } from '../config';
import { FORTUNES, SAMJEONG_TEXT, TRAITS } from '../content/readings';
import type { FortuneKey, Hairline, Level, MetricKey, Metrics, Reading, SamjeongKey, Sex, Trait } from '../types';

// 측정값 → 풀이. 무작위가 없어서 같은 측정값이면 항상 같은 결과가 나옴

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const FORMAT: Record<MetricKey, (v: number) => string> = {
  faceAspect: (v) => `얼굴 길이 ÷ 너비 = ${v.toFixed(2)}`,
  eyeTilt: (v) => `눈꼬리 각도 = ${v.toFixed(1)}°`,
  eyeSpacing: (v) => `눈 사이 ÷ 눈 길이 = ${v.toFixed(2)}`,
  noseWidth: (v) => `콧볼 ÷ 얼굴 너비 = ${v.toFixed(2)}`,
  mouthWidth: (v) => `입 ÷ 얼굴 너비 = ${v.toFixed(2)}`,
  jawWidth: (v) => `턱 ÷ 얼굴 너비 = ${v.toFixed(2)}`,
};

const METRIC_KEYS = Object.keys(FORMAT) as MetricKey[];

// 측정값이 기준 범위의 어디쯤인지: 가운데 0, low -1, high +1
export function positions(metrics: Metrics, sex: Sex): Record<MetricKey, number> {
  const ranges = RANGES[sex];
  return Object.fromEntries(
    METRIC_KEYS.map((k) => {
      const { low, high } = ranges[k];
      return [k, (metrics[k] - (low + high) / 2) / ((high - low) / 2)];
    }),
  ) as Record<MetricKey, number>;
}

function readSamjeong(metrics: Metrics): { key: SamjeongKey; balance: number } {
  const base = SAMJEONG.baseline[metrics.samjeongMethod];
  const diffs = (['upper', 'middle', 'lower'] as const).map((k) => ({ k, d: metrics.samjeong[k] - base[k] }));
  const top = diffs.reduce((a, b) => (b.d > a.d ? b : a));
  // 균형도: 평균과 같으면 1, 많이 벗어날수록 0
  const balance = clamp(1 - Math.max(...diffs.map((x) => Math.abs(x.d))) / 0.05, 0, 1);
  return { key: top.d > SAMJEONG.tolerance ? top.k : 'balanced', balance };
}

export function buildReading(metrics: Metrics, sex: Sex, hairline: Hairline['kind']): Reading {
  const z = positions(metrics, sex);

  const traits: Trait[] = METRIC_KEYS.map((key) => {
    const level: Level = z[key] < -1 ? 'low' : z[key] > 1 ? 'high' : 'mid';
    const content = TRAITS[key];
    return {
      key,
      part: content.part,
      level,
      position: clamp(50 + z[key] * 25, 4, 96),
      scale: content.scale,
      title: content[level].title,
      text: content[level].text,
      measured: FORMAT[key](metrics[key]),
    };
  });

  const samjeong = readSamjeong(metrics);

  const scores = (Object.keys(SCORE_RULES) as FortuneKey[]).map((key) => {
    const rule = SCORE_RULES[key];
    let score = rule.base + rule.balance * samjeong.balance;
    for (const [metric, weight] of Object.entries(rule.weights) as [MetricKey, number][]) {
      score += weight * clamp(z[metric], -1.5, 1.5);
    }
    return { key, label: FORTUNES[key].label, score: Math.round(clamp(score, SCORE_LIMIT.min, SCORE_LIMIT.max)) };
  });

  // 가장 높은 지표가 대표 유형 (동점이면 FORTUNE_ORDER 순서)
  const best = [...scores].sort(
    (a, b) => b.score - a.score || FORTUNE_ORDER.indexOf(a.key) - FORTUNE_ORDER.indexOf(b.key),
  )[0];

  return {
    ruleVersion: RULE_VERSION,
    sex,
    type: { key: best.key, title: FORTUNES[best.key].title, summary: FORTUNES[best.key].summary },
    scores,
    samjeong: {
      key: samjeong.key,
      ratios: metrics.samjeong,
      method: metrics.samjeongMethod,
      hairline,
      ...SAMJEONG_TEXT[samjeong.key],
    },
    traits,
  };
}
