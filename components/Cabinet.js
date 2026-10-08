// ジュークボックスの筐体(二重アーチ・レコード窓・バブルチューブ・スピーカーグリル)
const BUBBLES = [8, 30, 52, 70, 88].map((d, i) => ({ left: i % 2 ? 2 : 7, delay: d / 10, dur: 4 + (i % 3) }));

function Tube({ side }) {
  return (
    <div className={`tube ${side}`} aria-hidden="true">
      {BUBBLES.map((b, i) => (
        <span key={i} className="bubble" style={{ left: b.left, animationDelay: `${b.delay + (side === 'right' ? 1.3 : 0)}s`, animationDuration: `${b.dur}s` }} />
      ))}
      <span className="bulbs" />
    </div>
  );
}

// アーチ窓の中のレコード(真ん中の1枚だけ正面、左右は縦に並ぶ)
const SIDE = [0, 1, 2, 3, 4, 5];
function RecordWindow({ playing }) {
  return (
    <div className="rec-window" aria-hidden="true">
      <div className="rec-row">
        {SIDE.map((i) => <span key={`l${i}`} className="rec-edge" style={{ '--d': 6 - i }} />)}
        <span className={`rec-face ${playing ? 'spin' : ''}`} />
        {SIDE.map((i) => <span key={`r${i}`} className="rec-edge" style={{ '--d': i + 1 }} />)}
      </div>
      <span className="rec-glass" />
    </div>
  );
}

export default function Cabinet({ student, playing, children }) {
  return (
    <div className="cabinet">
      <div className="cabinet-inner">
        <svg className="arch" viewBox="0 0 400 210" aria-hidden="true" preserveAspectRatio="none">
          <defs>
            <linearGradient id="neon" x1="0" x2="1">
              <stop offset="0" stopColor="#59f2ff" /><stop offset=".35" stopColor="#ff4fa3" />
              <stop offset=".65" stopColor="#ffc65c" /><stop offset="1" stopColor="#59f2ff" />
            </linearGradient>
            <linearGradient id="chrome" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#ffffff" /><stop offset=".5" stopColor="#aeb4bd" /><stop offset="1" stopColor="#e9ecf0" />
            </linearGradient>
          </defs>
          <path d="M6 210 L6 196 A194 194 0 0 1 394 196 L394 210" fill="none" stroke="url(#chrome)" strokeWidth="3" />
          {['glow', ''].map((c) => (
            <path key={c || 'line'} className={c} d="M14 210 L14 196 A186 186 0 0 1 386 196 L386 210" fill="none" stroke="url(#neon)" strokeWidth={c ? 9 : 4} strokeLinecap="round" />
          ))}
          <path d="M23 210 L23 196 A177 177 0 0 1 377 196 L377 210" fill="none" stroke="url(#chrome)" strokeWidth="2.5" />
        </svg>
        <Tube side="left" />
        <Tube side="right" />
        <header className="marquee">
          <RecordWindow playing={playing} />
          <h1 className="logo">K&apos;s VOX RECORD<span className="logo-sub">Showcase</span></h1>
          {student && <span className="student-badge">門下生モード</span>}
        </header>
        <main className="window">{children}</main>
        <div className="grille" aria-hidden="true"><span /></div>
      </div>
    </div>
  );
}
