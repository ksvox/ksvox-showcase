import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Cabinet from '../components/Cabinet';
import Drum from '../components/Drum';
import SongCard, { songSub } from '../components/SongCard';
import Quiz from '../components/Quiz';
import Player from '../components/Player';
import { SOUNDS, VIBES, ANY, SCENES, findSongs, makePlaylist } from '../lib/select';
import { FOLLOW, SNS, SITE } from '../lib/links';

const FIND_Q = [
  { key: 'vocal', text: 'ボーカルは?', options: ['男性', '女性', 'どちらでも'] },
  { key: 'sound', text: 'どんなサウンドが好き?', options: [...SOUNDS, ANY] },
  { key: 'vibe', text: 'どんな雰囲気の曲?', options: [...VIBES, { key: ANY }] },
  { key: 'tempo', text: 'テンポは?', options: ['ゆったり', 'ほどよい', 'ノリノリ', ANY] },
];
const PL_Q = [
  { key: 'scene', text: 'どんな時に聴く?', options: Object.keys(SCENES) },
  { key: 'vocal', text: 'ボーカルは?', options: ['男性多め', '女性多め', ANY] },
  { key: 'style', text: '選曲スタイルは?', options: [{ key: '王道セレクト', desc: '場面にぴったりの曲を中心に' }, { key: '冒険セレクト', desc: '思いがけない曲も多めに' }] },
];

export default function Showcase({ songs, studentAtLoad, error }) {
  const router = useRouter();
  const [student, setStudent] = useState(studentAtLoad);
  const [screen, setScreen] = useState('home');
  const [q, setQ] = useState('');
  const [centerSong, setCenterSong] = useState(null);
  const [found, setFound] = useState([]);
  const [openId, setOpenId] = useState('');
  const [playlist, setPlaylist] = useState({ title: '', items: [] });
  const [coin, setCoin] = useState(false);
  const [queue, setQueue] = useState({ list: [], idx: -1 });
  const [toast, setToast] = useState(null);
  const player = useRef(null);
  const cardRef = useRef(null);
  const byId = useMemo(() => Object.fromEntries(songs.map((s) => [s.id, s])), [songs]);
  const current = queue.list[queue.idx] || null;

  // 門弟アプリからの通行証、または共有されたプレイリスト
  useEffect(() => {
    if (!router.isReady) return;
    const { kspass, pl } = router.query;
    if (kspass) {
      fetch('/api/student', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pass: kspass }) })
        .then((r) => r.json())
        .then((j) => (j.student ? setStudent(true) : showToast(j.error || '門下生モードに切り替えられませんでした。')))
        .catch(() => showToast('門下生モードに切り替えられませんでした。'))
        .finally(() => router.replace('/', undefined, { shallow: true }));
    }
    if (pl) {
      const items = String(pl).split('.').map((id) => byId[id]).filter(Boolean).map((s) => ({ song: s, kind: 'shared' }));
      if (items.length) { setPlaylist({ title: '届いたプレイリスト', items }); setScreen('pl'); }
    }
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  function showToast(text, link) {
    setToast({ text, link });
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => setToast(null), 6000);
  }

  function go(next) { setScreen(next); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  // 再生(クリックの流れの中で直接呼ぶ)
  function playFrom(list, song) {
    const playable = list.filter((s) => s.youtubeId);
    const idx = playable.findIndex((s) => s.id === song.id);
    if (idx < 0) return;
    setQueue({ list: playable, idx });
    player.current?.play(playable[idx]);
  }
  function step(d) {
    const idx = queue.idx + d;
    if (idx < 0 || idx >= queue.list.length) return;
    setQueue({ ...queue, idx });
    player.current?.play(queue.list[idx]);
  }

  const locked = () => showToast('歌詞PDFはボーカル道場 K\'s VOX の門下生限定です。', { href: SITE, label: 'K\'s VOXについて' });

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return songs;
    return songs.filter((s) => s.title.toLowerCase().includes(k) || s.no.toLowerCase() === k || (s.release || '').toLowerCase().includes(k));
  }, [songs, q]);

  async function share() {
    const ids = playlist.items.map((x) => x.song.id).join('.');
    const url = `${window.location.origin}/?pl=${ids}`;
    const title = 'K\'s VOX RECORD のプレイリスト';
    try {
      if (navigator.share) { await navigator.share({ title, url }); return; }
      await navigator.clipboard.writeText(url);
      showToast('プレイリストのリンクをコピーしました。メモやLINEに貼っておけば、いつでも同じ曲順で聴けます。');
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      window.prompt('このリンクをコピーして保存してください', url);
    }
  }

  const plSongs = playlist.items.map((x) => x.song);

  return (
    <>
      <Head>
        <title>K&apos;s VOX RECORD Showcase|オリジナル英語曲のジュークボックス</title>
        <meta name="description" content="ボーカル道場 K's VOX が制作したオリジナル英語曲を、ジュークボックスのように選んで聴けるショーケース。気分や場面に合わせたプレイリストも提案します。" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta property="og:title" content="K's VOX RECORD Showcase" />
        <meta property="og:description" content="オリジナル英語曲を、気分や場面に合わせて選んで聴けるジュークボックス。" />
      </Head>

      <div className="page">
        <Cabinet student={student}>
          {error && <p className="empty">{error}</p>}

          {screen === 'home' && (
            <>
              <p className="count-plate">オリジナル英語曲 全{songs.length}曲を収録</p>
              <nav className="entries" aria-label="探し方を選ぶ">
                {[
                  ['A', 'search', '曲名で探す', '曲目表のドラムを回して選ぶ'],
                  ['B', 'find', 'どんな曲をお探し?', '4つの質問から、好みに合う曲を'],
                  ['C', 'coin', 'プレイリストを提案', '場面に合わせて20曲を選曲'],
                ].map(([key, to, label, sub]) => (
                  <button key={key} className="entry" onClick={() => { setCoin(false); go(to); }}>
                    <span className="entry-key chrome">{key}</span>
                    <span className="entry-label"><b>{label}</b><small>{sub}</small></span>
                  </button>
                ))}
              </nav>
              <div className="turntable" aria-hidden="true">
                <div className={`big-record ${current ? 'fast' : ''}`}><span>K&apos;s VOX RECORD</span></div>
                <div className="sheen" />
              </div>
            </>
          )}

          {screen === 'search' && (
            <section>
              <div className="screen-head">
                <button className="chrome back" onClick={() => go('home')} aria-label="トップに戻る">←</button>
                <h2 className="screen-title">曲名で探す</h2>
              </div>
              <label className="sr-only" htmlFor="q">曲名</label>
              <input id="q" className="search" placeholder="曲名で検索する" value={q} onChange={(e) => setQ(e.target.value)} />
              {filtered.length ? (
                <Drum items={filtered} onCenter={setCenterSong} onActivate={() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })} />
              ) : <p className="empty">「{q}」に合う曲はありません。別の言葉で探してみてください。</p>}
              {filtered.length > 0 && centerSong && filtered.some((s) => s.id === centerSong.id) && (
                <div ref={cardRef}>
                  <SongCard song={centerSong} student={student} playing={current?.id === centerSong.id} onPlay={(s) => playFrom(filtered, s)} onLocked={locked} />
                </div>
              )}
            </section>
          )}

          {screen === 'find' && (
            <section>
              <div className="screen-head"><h2 className="screen-title">どんな曲をお探し?</h2></div>
              <Quiz questions={FIND_Q} onBack={() => go('home')} onDone={(a) => { setFound(findSongs(songs, a)); setOpenId(''); go('found'); }} />
            </section>
          )}

          {screen === 'found' && (
            <section>
              <div className="screen-head">
                <button className="chrome back" onClick={() => go('home')} aria-label="トップに戻る">←</button>
                <h2 className="screen-title">あなたに合いそうな{found.length}曲</h2>
              </div>
              {found.length ? (
                <>
                  <div className="result-tools">
                    <button className="btn-red" onClick={() => playFrom(found.map((x) => x.song), found[0].song)}>▶ 順に聴く</button>
                    <button className="chrome" onClick={() => go('find')}>質問をやり直す</button>
                  </div>
                  {found.map(({ song, near }, i) => (
                    <div key={song.id} className="found-item">
                      <button className={`pl-row ${current?.id === song.id ? 'playing' : ''} ${openId === song.id ? 'open' : ''}`}
                        aria-expanded={openId === song.id} onClick={() => setOpenId(openId === song.id ? '' : song.id)}>
                        <span className="pl-idx">{i + 1}</span>
                        <span className="pl-main">
                          <b>{song.title}</b>
                          <small>{near && <span className="flag near-mini">近い曲</span>} {song.no} / {songSub(song) || '—'}{song.tempo ? ` / ${song.tempo}` : ''}</small>
                        </span>
                        <span className="pl-open" aria-hidden="true">{openId === song.id ? '▲' : '▼'}</span>
                      </button>
                      {openId === song.id && (
                        <SongCard song={song} near={near} student={student} showService playing={current?.id === song.id}
                          onPlay={(s) => playFrom(found.map((x) => x.song), s)} onLocked={locked} />
                      )}
                    </div>
                  ))}
                  <p className="note">曲名をタップすると、試聴や「いつものサービスで聴く」のボタンが開きます。</p>
                  {found.some((x) => x.near) && <p className="note">「近い曲」は、条件の一部が違うけれど雰囲気の近い曲です。</p>}
                </>
              ) : <p className="empty">今はご案内できる曲がありません。</p>}
            </section>
          )}

          {screen === 'coin' && (
            <section>
              <div className="screen-head">
                <button className="chrome back" onClick={() => go('home')} aria-label="トップに戻る">←</button>
                <h2 className="screen-title">プレイリストを提案</h2>
              </div>
              {!coin ? (
                <div className="coin-stage">
                  <button className="chrome slot" onClick={() => { setCoin('drop'); setTimeout(() => setCoin(true), 700); }} aria-label="コインを入れて始める">
                    <span className={`coin ${coin === 'drop' ? 'drop' : ''}`}>25¢</span>
                  </button>
                  <p className="coin-help">スロットをタップしてコインを投入し、3つの質問のあとに20曲を選曲します。</p>
                </div>
              ) : coin === 'drop' ? (
                <div className="coin-stage"><div className="chrome slot"><span className="coin drop">25¢</span></div></div>
              ) : (
                <Quiz questions={PL_Q} onBack={() => { setCoin(false); go('home'); }} onDone={(a) => {
                  setPlaylist({ title: `${a.scene}のプレイリスト`, items: makePlaylist(songs, a) });
                  go('pl');
                }} />
              )}
            </section>
          )}

          {screen === 'pl' && (
            <section>
              <div className="screen-head">
                <button className="chrome back" onClick={() => go('home')} aria-label="トップに戻る">←</button>
                <h2 className="screen-title">{playlist.title}</h2>
              </div>
              <div className="result-tools">
                <button className="btn-red" onClick={() => plSongs.length && playFrom(plSongs, plSongs.find((s) => s.youtubeId))}>▶ 全曲再生</button>
                <button className="chrome" onClick={share}>プレイリストを持ち帰る</button>
              </div>
              <p className="note take-note">「持ち帰る」を押すと、このプレイリスト専用のリンクができます。メモやLINEなどに保存しておけば、アプリを閉じても、あとでそのリンクを開くだけで同じ20曲を同じ曲順で聴けます。友だちに送ることもできます。</p>
              {playlist.items.map(({ song, kind }, i) => (
                <button key={song.id} className={`pl-row ${current?.id === song.id ? 'playing' : ''}`} onClick={() => playFrom(plSongs, song)}>
                  <span className="pl-idx">{i + 1}</span>
                  <span className="pl-main">
                    <b>{song.title}</b>
                    <small>{kind === 'random' && <span className="flag detour">寄り道</span>} {song.no} / {songSub(song) || '—'}{song.tempo ? ` / ${song.tempo}` : ''}</small>
                  </span>
                  <span className="pl-play" aria-hidden="true">{current?.id === song.id ? '♪' : '▶'}</span>
                </button>
              ))}
              {playlist.items.some((x) => x.kind === 'random') && <p className="note">「寄り道」は、場面に関係なく選んだ一曲です。思いがけないお気に入りが見つかるかもしれません。</p>}
              <div style={{ textAlign: 'center', marginTop: 14 }}>
                <button className="chrome" style={{ padding: '9px 18px', fontSize: 13, fontWeight: 700 }} onClick={() => { setCoin(false); go('coin'); }}>別のプレイリストを作る</button>
              </div>
            </section>
          )}
        </Cabinet>

        <footer className="footer">
          <h2>K&apos;s VOX RECORD をフォロー</h2>
          <div className="plates">
            {FOLLOW.map((l) => <a key={l.name} className="chrome plate" href={l.url} target="_blank" rel="noopener noreferrer">{l.name}</a>)}
          </div>
          <div className="sns">
            <h2>ボーカル道場 K&apos;s VOX</h2>
            <div className="plates">
              {SNS.map((l) => <a key={l.name} className="plate" href={l.url} target="_blank" rel="noopener noreferrer">{l.name}</a>)}
            </div>
          </div>
          <p className="copy">© K&apos;s VOX RECORD ・ <a href={SITE} target="_blank" rel="noopener noreferrer">ksvox.net</a></p>
        </footer>
      </div>

      {toast && (
        <div className="toast" role="status">
          {toast.text}{toast.link && <> <a href={toast.link.href} target="_blank" rel="noopener noreferrer">{toast.link.label}</a></>}
        </div>
      )}

      <Player ref={player} song={current} hasPrev={queue.idx > 0} hasNext={queue.idx >= 0 && queue.idx < queue.list.length - 1}
        onPrev={() => step(-1)} onNext={() => step(1)} onEnded={() => step(1)} />
    </>
  );
}

export async function getServerSideProps({ req, res }) {
  const { getCatalog } = await import('../lib/catalog');
  const { isStudent } = await import('../lib/student');
  res.setHeader('Cache-Control', 'private, no-store');
  try {
    return { props: { songs: await getCatalog(), studentAtLoad: isStudent(req), error: '' } };
  } catch (e) {
    console.error(e);
    return { props: { songs: [], studentAtLoad: false, error: '曲の一覧を読み込めませんでした。時間をおいて開き直してください。' } };
  }
}
