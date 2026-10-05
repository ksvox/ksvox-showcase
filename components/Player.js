// 画面下のプレーヤー(YouTubeの埋め込み再生)
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { songSub } from './SongCard';

let apiPromise = null;
function loadApi() {
  if (typeof window === 'undefined') return Promise.reject();
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev && prev(); resolve(window.YT); };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    });
  }
  return apiPromise;
}

const Player = forwardRef(function Player({ song, hasPrev, hasNext, onPrev, onNext, onEnded }, ref) {
  const box = useRef(null);
  const yt = useRef(null);
  const ready = useRef(false);
  const pending = useRef(null);
  const endedRef = useRef(onEnded);
  const [playing, setPlaying] = useState(false);
  const [big, setBig] = useState(false);
  endedRef.current = onEnded;

  useEffect(() => {
    let alive = true;
    loadApi().then((YT) => {
      if (!alive || !box.current) return;
      yt.current = new YT.Player(box.current, {
        width: '100%', height: '100%',
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            ready.current = true;
            if (pending.current) { yt.current.loadVideoById(pending.current); pending.current = null; }
          },
          onStateChange: (e) => {
            setPlaying(e.data === 1 || e.data === 3);
            if (e.data === 0) endedRef.current && endedRef.current();
          },
        },
      });
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useImperativeHandle(ref, () => ({
    play(s) {
      if (!s?.youtubeId) return;
      if (ready.current) yt.current.loadVideoById(s.youtubeId);
      else pending.current = s.youtubeId;
    },
  }));

  function toggle() {
    if (!yt.current || !ready.current || !song) return;
    if (playing) yt.current.pauseVideo(); else yt.current.playVideo();
  }

  return (
    <div className="dock" role="region" aria-label="プレーヤー">
      <div className="dock-in">
        <div className={`screen ${big && song ? 'big' : ''}`}>
          <div className="yt"><div ref={box} /></div>
          {!song && <div className="screen-empty"><div className="record" /></div>}
          {song && !big && <div className={`record mini ${playing ? 'spin' : ''}`} aria-hidden="true" />}
        </div>
        <div className="np">
          <b>{song ? `${song.no}  ${song.title}` : '曲を選んでください'}</b>
          <small>{song ? songSub(song) : 'K\'s VOX RECORD のジュークボックス'}</small>
          {song && <button className="tiny" onClick={() => setBig(!big)}>{big ? '画面を小さく' : '画面を大きく'}</button>}
        </div>
        <div className="ctrl">
          <button className="chrome" onClick={onPrev} disabled={!hasPrev} aria-label="前の曲">⏮</button>
          <button className="btn-red main" onClick={toggle} disabled={!song} aria-label={playing ? '一時停止' : '再生'}>{playing ? '❚❚' : '▶'}</button>
          <button className="chrome" onClick={onNext} disabled={!hasNext} aria-label="次の曲">⏭</button>
        </div>
      </div>
    </div>
  );
});

export default Player;
