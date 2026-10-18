// 曲データ(公開してよい項目だけ)を用意する。歌詞PDFの中身は含めない
import { adminDb } from './firebaseAdmin';

const TTL = 5 * 60 * 1000; // 5分ごとに読み直す
let cache = { at: 0, songs: null, eps: [] };

// 「Title-(EP名)」から表示用の曲名を作る
export function displayTitle(title) {
  return String(title || '').replace(/-\s*\([^()]+\)\s*$/, '').trim();
}

function group(s) {
  if ((s.release || '').trim()) return 'D';
  if (s.vocal === '女性') return 'A';
  if (s.vocal === '男性') return 'B';
  return 'C';
}

// EP(門弟アプリの管理画面「EP」で登録したもの)。公開されている曲だけを、曲順どおりに
async function loadEps(songs) {
  const snap = await adminDb().collection('eps').get();
  const byId = Object.fromEntries(songs.map((s) => [s.id, s]));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    .map((e) => {
      const ids = (e.tracks || []).filter((id) => byId[id]);
      const first = ids.map((id) => byId[id]).find((s) => s.youtubeId);
      return {
        id: `ep_${e.id}`, kind: 'ep', no: 'EP',
        title: String(e.name || '').trim(), theme: String(e.theme || '').trim(),
        order: Number.isFinite(e.order) ? e.order : 9999,
        trackIds: ids, thumb: first ? first.youtubeId : '', // ジャケットは1曲目のYouTubeの画像
      };
    })
    .filter((e) => e.title && e.trackIds.length >= 2)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export async function getEps() {
  await getCatalog();
  return cache.eps;
}

export async function getCatalog() {
  if (cache.songs && Date.now() - cache.at < TTL) return cache.songs;
  const snap = await adminDb().collection('songs').get();
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => !s.draft && s.title);
  const created = (s) => s.createdAt?.seconds || s.createdAt?._seconds || 0;
  rows.sort((a, b) => created(a) - created(b) || String(a.title).localeCompare(String(b.title)));
  const counter = { A: 0, B: 0, C: 0, D: 0 };
  const songs = rows.map((s) => {
    const g = group(s);
    counter[g] += 1;
    return {
      id: s.id,
      no: `${g}${counter[g]}`,
      title: displayTitle(s.title),
      release: (s.release || '').trim(),
      vocal: s.vocal || '',
      sounds: s.sounds || [],
      vibes: s.vibes || [],
      tempo: s.tempo || '',
      range: s.range || '',
      youtubeId: s.youtubeId || '',
      songUrl: s.songUrl || '',
      hasPdf: !!s.hasPdf,
      pick: !!s.recommended,
      easy: !!s.easy,
    };
  });
  const order = { A: 0, B: 1, C: 2, D: 3 };
  songs.sort((a, b) => order[a.no[0]] - order[b.no[0]] || Number(a.no.slice(1)) - Number(b.no.slice(1)));
  let eps = [];
  try { eps = await loadEps(songs); } catch (e) { console.error('EPを読み込めませんでした', e); }
  cache = { at: Date.now(), songs, eps };
  return songs;
}
