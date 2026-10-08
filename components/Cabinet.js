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

// アーチ窓の中のレコード(真ん中の1枚が、再生中はせり上がって回る。ラベルに曲名)
const SIDE = [0, 1, 2, 3, 4, 5];
function RecordWindow({ song, up, spin }) {
  const label = song ? song.title : "K's VOX RECORD";
  const text = `${label}  •  ${label}  •  `;
  return (
    <div className="rec-window" aria-hidden="true">
      <div className="rec-row">
        {SIDE.map((i) => <span key={`l${i}`} className="rec-edge" style={{ '--d': 6 - i }} />)}
        <span className="rec-gap" />
        {SIDE.map((i) => <span key={`r${i}`} className="rec-edge" style={{ '--d': i + 1 }} />)}
      </div>
      <div className={`rec-main ${up ? 'up' : ''}`}>
        <div className={`rec-disc ${spin ? 'spin' : ''}`}>
          <svg viewBox="0 0 200 200" className="rec-label">
            <defs><path id="rec-arc" d="M100,100 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" /></defs>
            <circle cx="100" cy="100" r="52" fill="#b3172b" />
            <circle cx="100" cy="100" r="52" fill="none" stroke="#7a0d1b" strokeWidth="2" />
            <circle cx="100" cy="100" r="27" fill="none" stroke="#e7c06a" strokeWidth="1" opacity=".7" />
            <text fontSize="11" fontWeight="700" fill="#fbf0d9" letterSpacing="0.5" fontFamily="'Archivo Narrow', sans-serif">
              <textPath href="#rec-arc" textLength="236" lengthAdjust="spacingAndGlyphs">{text}</textPath>
            </text>
            <circle cx="100" cy="100" r="6" fill="#fbf0d9" /><circle cx="100" cy="100" r="3.5" fill="#1b1b1b" />
          </svg>
        </div>
      </div>
      <span className="rec-glass" />
    </div>
  );
}

export default function Cabinet({ student, up, spin, song, children }) {
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
          <RecordWindow song={song} up={up} spin={spin} />
          <h1 className="logo">K&apos;s VOX RECORD<span className="logo-sub">Showcase</span></h1>
          {student && <span className="student-badge">門下生モード</span>}
        </header>
        <main className="window">{children}</main>
        <div className="grille" aria-hidden="true"><span /></div>
      </div>
    </div>
  );
}
