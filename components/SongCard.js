// 曲カード(ジュークボックスのタイトルストリップ)
export function songSub(s) {
  return [s.vocal && `${s.vocal}ボーカル`, s.release].filter(Boolean).join(' / ');
}

export default function SongCard({ song, student, playing, onPlay, onLocked, showService, near }) {
  const s = song;
  return (
    <article className={`card ${playing ? 'playing' : ''}`}>
      <div className="card-no" aria-label={`選曲番号 ${s.no}`}>{s.no}</div>
      <h3 className="card-title">{s.title}</h3>
      {s.release && <p className="card-rel">収録:{s.release}</p>}
      {(s.pick || (student && s.easy) || near) && (
        <div className="flags">
          {s.pick && <span className="flag pick">NOBU&apos;S PICK</span>}
          {student && s.easy && <span className="flag easy">歌いやすい</span>}
          {near && <span className="flag near">近い曲</span>}
        </div>
      )}
      <div className="tags">
        {s.vocal && <span className="tag vocal">{s.vocal}ボーカル</span>}
        {[...s.sounds, ...s.vibes, s.tempo].filter(Boolean).map((t) => <span key={t} className="tag">{t}</span>)}
      </div>
      {s.range && <p className="meta">音域:{s.range}</p>}
      <div className="actions">
        <button className="btn-red" onClick={() => onPlay(s)} disabled={!s.youtubeId}>
          {s.youtubeId ? (playing ? '♪ 再生中' : '▶ 聴く') : '試聴準備中'}
        </button>
        {s.hasPdf && (student
          ? <a className="chrome" href={`/api/lyrics?id=${encodeURIComponent(s.id)}`} download>歌詞をダウンロード</a>
          : <button className="lock" onClick={onLocked}>🔒 歌詞PDF(門下生限定)</button>)}
        {showService && s.songUrl && (
          <a className="service" href={s.songUrl} target="_blank" rel="noopener noreferrer">いつものサービスで聴く</a>
        )}
      </div>
    </article>
  );
}
