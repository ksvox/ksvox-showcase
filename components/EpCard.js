// EPのカード:ジャケット(1曲目のYouTubeの画像)・テーマ・「EPを聴く」・曲順の一覧
import { useState } from 'react';

export default function EpCard({ ep, songs, student, current, onPlay }) {
  const [src, setSrc] = useState('max'); // max=高画質 → hq=ふつう → none=画像なし
  const url = ep.thumb && src !== 'none' ? `https://i.ytimg.com/vi/${ep.thumb}/${src === 'max' ? 'maxresdefault' : 'hqdefault'}.jpg` : '';
  const playing = songs.some((s) => current?.id === s.id);
  const first = songs.find((s) => s.youtubeId);
  return (
    <article className={`card ep-card ${playing ? 'playing' : ''}`}>
      <div className="card-no" aria-label="EP">EP</div>
      <div className="ep-head">
        {url
          ? <img className="ep-jacket" src={url} alt="" width="112" height="112"
              onLoad={(e) => { if (src === 'max' && e.currentTarget.naturalWidth <= 120) setSrc('hq'); }}
              onError={() => setSrc(src === 'max' ? 'hq' : 'none')} />
          : <div className="ep-jacket ep-jacket-empty" aria-hidden="true" />}
        <div className="ep-meta">
          <h3 className="card-title">{ep.title}</h3>
          <p className="card-rel">{songs.length}曲収録</p>
        </div>
      </div>
      {ep.theme && <p className="ep-theme">{ep.theme}</p>}
      <div className="actions">
        <button className="btn-red" onClick={() => first && onPlay(songs, first)} disabled={!first}>
          {playing ? '♪ EP再生中(頭から聴き直す)' : '▶ EPを頭から聴く'}
        </button>
      </div>
      <ol className="ep-tracks">
        {songs.map((s, i) => (
          <li key={s.id}>
            <button className={`ep-track ${current?.id === s.id ? 'playing' : ''}`} onClick={() => onPlay(songs, s)} disabled={!s.youtubeId}>
              <span className="ep-n">{i + 1}</span>
              <span className="ep-t">{s.title}</span>
              <span className="ep-p" aria-hidden="true">{current?.id === s.id ? '♪' : '▶'}</span>
            </button>
            {student && s.hasPdf && (
              <a className="ep-lyr" href={`/api/lyrics?id=${encodeURIComponent(s.id)}`} download aria-label={`${s.title}の歌詞をダウンロード`}>歌詞</a>
            )}
          </li>
        ))}
      </ol>
    </article>
  );
}
