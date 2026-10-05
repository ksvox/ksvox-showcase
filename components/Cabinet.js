// ジュークボックスの筐体(ネオンのアーチ・バブルチューブ・スピーカーグリル)
const BUBBLES = [8, 30, 52, 70, 88].map((d, i) => ({ left: i % 2 ? 2 : 7, delay: d / 10, dur: 4 + (i % 3) }));

function Tube({ side }) {
  return (
    <div className={`tube ${side}`} aria-hidden="true">
      {BUBBLES.map((b, i) => (
        <span key={i} className="bubble" style={{ left: b.left, animationDelay: `${b.delay + (side === 'right' ? 1.3 : 0)}s`, animationDuration: `${b.dur}s` }} />
      ))}
    </div>
  );
}

export default function Cabinet({ student, children }) {
  return (
    <div className="cabinet">
      <div className="cabinet-inner">
        <svg className="arch" viewBox="0 0 400 210" aria-hidden="true" preserveAspectRatio="none">
          <defs>
            <linearGradient id="neon" x1="0" x2="1">
              <stop offset="0" stopColor="#59f2ff" /><stop offset=".35" stopColor="#ff4fa3" />
              <stop offset=".65" stopColor="#ffc65c" /><stop offset="1" stopColor="#59f2ff" />
            </linearGradient>
          </defs>
          {['glow', ''].map((c) => (
            <path key={c || 'line'} className={c} d="M14 210 L14 196 A186 186 0 0 1 386 196 L386 210" fill="none" stroke="url(#neon)" strokeWidth={c ? 9 : 4} strokeLinecap="round" />
          ))}
        </svg>
        <Tube side="left" />
        <Tube side="right" />
        <header className="marquee">
          <h1 className="logo">K&apos;s VOX RECORD<span className="logo-sub">Showcase</span></h1>
          {student && <span className="student-badge">門下生モード</span>}
        </header>
        <main className="window">{children}</main>
        <div className="grille" aria-hidden="true" />
      </div>
    </div>
  );
}
