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

const Player = forwardRef(function Player({ song, stopped, hasPrev, hasNext, onPrev, onNext, onEnded, onState, onTick, onStop, onResume }, ref) {
  const box = useRef(null);
  const yt = useRef(null);
  const ready = useRef(false);
  const pending = useRef(null);
  const endedRef = useRef(onEnded);
  const stateRef = useRef(onState);
  const tickRef = useRef(onTick);
  const fadeTimer = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [big, setBig] = useState(false);
  endedRef.current = onEnded;
  stateRef.current = onState;
  tickRef.current = onTick;

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
            const on = e.data === 1 || e.data === 3;
            setPlaying(on);
            stateRef.current && stateRef.current(on);
            if (e.data === 0) endedRef.current && endedRef.current();
          },
        },
      });
    }).catch(() => {});
    // 再生中は0.5秒ごとに、今の位置と曲の長さを知らせる(曲つなぎ用)
    const iv = setInterval(() => {
      const p = yt.current;
      if (!ready.current || !p || !p.getPlayerState || p.getPlayerState() !== 1) return;
      tickRef.current && tickRef.current(p.getCurrentTime(), p.getDuration());
    }, 500);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  useImperativeHandle(ref, () => ({
    play(s) {
      if (!s?.youtubeId) return;
      clearInterval(fadeTimer.current);
      if (ready.current) { yt.current.setVolume(100); yt.current.loadVideoById(s.youtubeId); }
      else pending.current = s.youtubeId;
    },
    // 音量を少しずつ絞る(曲つなぎ)
    fadeOut(ms) {
      if (!ready.current) return;
      clearInterval(fadeTimer.current);
      const start = Date.now();
      fadeTimer.current = setInterval(() => {
        const r = Math.min(1, (Date.now() - start) / ms);
        try { yt.current.setVolume(Math.round(100 * (1 - r * 0.85))); } catch (e) { /* noop */ }
        if (r >= 1) clearInterval(fadeTimer.current);
      }, 100);
    },
    stop() {
      clearInterval(fadeTimer.current);
      if (ready.current) { try { yt.current.stopVideo(); yt.current.setVolume(100); } catch (e) { /* noop */ } }
    },
  }));

  function toggle() {
    if (!yt.current || !ready.current || !song) return;
    if (stopped) { onResume && onResume(); return; }
    if (playing) yt.current.pauseVideo(); else yt.current.playVideo();
  }
  const open = big && !!song;

  return (
    <div className="dock" role="region" aria-label="プレーヤー">
      <div className="dock-in">
        <div className={`screen ${open ? 'big' : ''}`} onClick={() => song && !open && setBig(true)}>
          <div className="yt"><div ref={box} /></div>
          {!song && <div className="screen-empty"><div className="record" /></div>}
          {song && !open && <div className={`record mini ${playing ? 'spin' : ''}`} aria-hidden="true" />}
        </div>
        <button className="np" onClick={() => song && setBig(true)} disabled={!song} aria-label="プレーヤーを開く">
          <b>{song ? song.title : '曲を選んでください'}</b>
          <small>{song ? (song.release || songSub(song)) : 'K\'s VOX RECORD のジュークボックス'}</small>
          {song && <span className="tiny">▲ プレーヤーを開く</span>}
        </button>
        <div className="ctrl">
          <button className="chrome" onClick={onPrev} disabled={!hasPrev} aria-label="前の曲">⏮</button>
          <button className="btn-red main" onClick={toggle} disabled={!song} aria-label={playing ? '一時停止' : '再生'}>{playing ? '❚❚' : '▶'}</button>
          <button className="chrome" onClick={onNext} disabled={!hasNext} aria-label="次の曲">⏭</button>
        </div>
      </div>

      {/* 大きなプレーヤー(下からせり上がる) */}
      <div className={`sheet-back ${open ? 'on' : ''}`} onClick={() => setBig(false)} aria-hidden="true" />
      <section className={`sheet ${open ? 'on' : ''}`} aria-hidden={!open} aria-label="プレーヤー(大)">
        <button className="sheet-close" onClick={() => setBig(false)} aria-label="プレーヤーを閉じる">▼</button>
        <div className="sheet-jacket" />
        {song && (
          <div className="sheet-info">
            <h2>{song.title}</h2>
            {song.release && <p>{song.release}</p>}
          </div>
        )}
        <div className="sheet-ctrl">
          <button className="chrome" onClick={onPrev} disabled={!hasPrev} aria-label="前の曲">⏮</button>
          <button className="chrome" onClick={onStop} disabled={!song || stopped} aria-label="停止">⏹</button>
          <button className="btn-red main" onClick={toggle} disabled={!song} aria-label={playing ? '一時停止' : '再生'}>{playing ? '⏸' : '▶'}</button>
          <button className="chrome" onClick={onNext} disabled={!hasNext} aria-label="次の曲">⏭</button>
        </div>
      </section>
    </div>
  );
});

export default Player;
