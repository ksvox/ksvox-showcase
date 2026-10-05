// 曲名ドラム:5曲ほどが見えて、スクロールするとグルグル回る(最後まで行くと最初に戻る)
import { useEffect, useRef, useState } from 'react';

const ITEM = 52;
const VIS = 5;
const PAD = ((VIS - 1) / 2) * ITEM;

export default function Drum({ items, onCenter, onActivate }) {
  const ref = useRef(null);
  const len = items.length;
  const loop = len > VIS;
  const copies = loop ? 3 : 1;
  const total = len * copies;
  const [pos, setPos] = useState(0);
  const endTimer = useRef(null);
  const frame = useRef(0);

  const songAt = (k) => items[((k % len) + len) % len];

  // 位置を一気に移す時は、移動先の曲が描かれるまで吸着(スナップ)を止めておく
  function jump(el, top) {
    el.style.scrollSnapType = 'none';
    el.scrollTop = top;
    setPos(top / ITEM);
    requestAnimationFrame(() => requestAnimationFrame(() => { el.style.scrollSnapType = ''; }));
  }

  // 曲が絞り込まれたら最初の曲を中央に
  useEffect(() => {
    const el = ref.current;
    if (!el || !len) return;
    const start = loop ? len : 0;
    jump(el, start * ITEM);
    onCenter && onCenter(songAt(start));
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  function wrap(el) {
    if (!loop) return;
    const idx = Math.round(el.scrollTop / ITEM);
    if (idx < len * 0.5) jump(el, el.scrollTop + len * ITEM);
    else if (idx >= len * 2.5) jump(el, el.scrollTop - len * ITEM);
  }

  function onScroll() {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const idx = Math.round(el.scrollTop / ITEM);
      if (loop && (idx < 2 || idx > total - 3)) wrap(el); // 端に着きそうな時だけその場で戻す
      setPos(el.scrollTop / ITEM);
    });
    clearTimeout(endTimer.current);
    endTimer.current = setTimeout(() => {
      wrap(el);
      const k = Math.round(el.scrollTop / ITEM);
      setPos(el.scrollTop / ITEM);
      onCenter && onCenter(songAt(k));
    }, 140);
  }

  function goTo(k) { ref.current?.scrollTo({ top: k * ITEM, behavior: 'smooth' }); }

  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); goTo(Math.round(pos) + 1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); goTo(Math.round(pos) - 1); }
    if (e.key === 'Enter') { e.preventDefault(); onActivate && onActivate(songAt(Math.round(pos))); }
  }

  if (!len) return null;
  const center = Math.round(pos);
  const from = Math.max(0, Math.floor(pos) - 3);
  const to = Math.min(total - 1, Math.ceil(pos) + 3);
  const rows = [];
  for (let k = from; k <= to; k++) {
    const s = songAt(k);
    const d = k - pos;
    const ad = Math.min(Math.abs(d), 3);
    rows.push(
      <button
        key={k}
        type="button"
        tabIndex={-1}
        className={`drum-item ${k === center ? 'on' : ''}`}
        style={{ top: PAD + k * ITEM + 4, height: ITEM - 8, transform: `rotateX(${-d * 18}deg) scale(${1 - ad * 0.05})`, opacity: 1 - ad * 0.24 }}
        onClick={() => (k === center ? onActivate && onActivate(s) : goTo(k))}
      >
        <span className="no">{s.no}</span><span className="t">{s.title}</span>
      </button>
    );
  }

  return (
    <div className="drum-wrap">
      <div
        ref={ref}
        className="drum"
        style={{ height: ITEM * VIS }}
        onScroll={onScroll}
        tabIndex={0}
        role="listbox"
        aria-label="曲名の一覧(上下にスクロールして選ぶ)"
        aria-activedescendant={undefined}
        onKeyDown={onKey}
      >
        <div style={{ position: 'relative', height: (total - 1) * ITEM + ITEM * VIS }}>{rows}</div>
      </div>
      <div className="drum-sight" style={{ top: PAD, height: ITEM }} aria-hidden="true" />
    </div>
  );
}
