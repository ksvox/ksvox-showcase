// 曲データ(公開してよい項目だけ)を用意する。歌詞PDFの中身は含めない
import { adminDb } from './firebaseAdmin';

const TTL = 5 * 60 * 1000; // 5分ごとに読み直す
let cache = { at: 0, songs: null };

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
  cache = { at: Date.now(), songs };
  return songs;
}
