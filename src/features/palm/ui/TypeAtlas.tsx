// 손금 유형 도감: 가능한 유형을 모두 보여 주고, 그중 내 유형을 강조
import { useState, type ReactNode } from 'react';
import { LINE_INFO, type LineKey } from '../config';
import { HAND_TYPE_ORDER, HAND_TYPES, INDEX_RING_INFO, LINE_TYPES, THUMB_INFO } from '../handReading';
import type { HandCategories, IndexRingCat, ThumbCat } from '../handShape';
import type { LineCategories } from '../reading';

type Props = {
  hand: HandCategories;
  lines: Partial<Record<LineKey, LineCategories>>;
};

type Tab = 'hand' | LineKey | 'finger';
const TABS: { key: Tab; label: string }[] = [
  { key: 'hand', label: '손 모양' },
  { key: 'life', label: '생명선' },
  { key: 'head', label: '두뇌선' },
  { key: 'heart', label: '감정선' },
  { key: 'finger', label: '손가락' },
];

// 선 유형 카드의 작은 그림 (길이 3단계 · 곡률 3단계)
const MINI_PATH: Record<string, string> = {
  short: 'M22 15 L38 15',
  normal: 'M13 15 L47 15',
  long: 'M5 15 L55 15',
  straight: 'M8 22 L52 8',
  gentle: 'M8 23 Q28 10 52 9',
  deep: 'M8 25 Q14 4 52 8',
};

export default function TypeAtlas({ hand, lines }: Props) {
  const [tab, setTab] = useState<Tab>('hand');

  return (
    <div className="palm-atlas">
      <div className="palm-atlas-tabs" role="tablist" aria-label="도감 종류">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`palm-atlas-tab${tab === t.key ? ' is-on' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hand' && (
        <div className="palm-atlas-grid palm-atlas-grid--four">
          {HAND_TYPE_ORDER.map((type) => {
            const info = HAND_TYPES[type];
            return (
              <AtlasCard key={type} mine={hand.type === type}>
                <span className="palm-atlas-symbol">{info.symbol}</span>
                <h4>{info.name}</h4>
                <p className="palm-atlas-basis">
                  {info.palm} · {info.fingers}
                </p>
                <p>{info.summary}</p>
              </AtlasCard>
            );
          })}
        </div>
      )}

      {(tab === 'life' || tab === 'head' || tab === 'heart') && (
        <LineTab line={tab} cats={lines[tab]} />
      )}

      {tab === 'finger' && (
        <>
          <p className="palm-atlas-note">검지 ÷ 약지 길이</p>
          <div className="palm-atlas-grid">
            {(['index', 'even', 'ring'] as IndexRingCat[]).map((c) => (
              <AtlasCard key={c} mine={hand.indexRing === c}>
                <h4>{INDEX_RING_INFO[c].name}</h4>
                <p>{INDEX_RING_INFO[c].reading}</p>
              </AtlasCard>
            ))}
          </div>
          <p className="palm-atlas-note">엄지 ÷ 검지 길이</p>
          <div className="palm-atlas-grid">
            {(['long', 'normal', 'short'] as ThumbCat[]).map((c) => (
              <AtlasCard key={c} mine={hand.thumb === c}>
                <h4>{THUMB_INFO[c].name}</h4>
                <p>{THUMB_INFO[c].reading}</p>
              </AtlasCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LineTab({ line, cats }: { line: LineKey; cats?: LineCategories }) {
  const group = LINE_TYPES[line];
  const mineCat = cats ? (line === 'head' ? cats.curve : cats.length) : null;
  return (
    <>
      <p className="palm-atlas-note">
        {group.basis}로 나눠요{!cats && ' · 이번 사진에서는 이 선을 찾지 못했어요'}
      </p>
      <div className="palm-atlas-grid">
        {group.entries.map((e) => (
          <AtlasCard key={e.cat} mine={mineCat === e.cat}>
            <svg className={`palm-atlas-mini palm-atlas-mini--${line}`} viewBox="0 0 60 30" aria-hidden="true">
              <path d={MINI_PATH[e.cat]} />
            </svg>
            <h4>
              {LINE_INFO[line].name} {e.name}
            </h4>
            <p>{e.desc}</p>
          </AtlasCard>
        ))}
      </div>
    </>
  );
}

function AtlasCard({ mine, children }: { mine: boolean; children: ReactNode }) {
  return (
    <article className={`palm-atlas-card${mine ? ' is-mine' : ''}`}>
      {mine && <span className="palm-atlas-badge">내 유형</span>}
      {children}
    </article>
  );
}
