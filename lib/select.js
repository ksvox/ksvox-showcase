// 選曲のルール(② どんな曲をお探し? / ③ プレイリストを提案)

export const SOUNDS = ['ミニマル系', 'バンド系', 'アコースティック系', 'エレクトリック系', 'オーケストラ系', 'ブラス系'];
export const VIBES = [
  { key: 'ポップ', desc: '明るく親しみやすい' },
  { key: 'ダーク', desc: '重く暗い' },
  { key: 'ディープ', desc: '内省的で深い' },
  { key: 'シャイニー', desc: '華やかできらびやか' },
  { key: 'クール', desc: 'かっこいい、洗練された' },
  { key: 'ユニーク', desc: '個性的、ひと味違う' },
  { key: 'ダンサブル', desc: '体が自然に動き出す' },
  { key: 'メロウ', desc: 'やわらかく穏やか' },
];
export const ANY = 'おまかせ';

// 場面ごとの「中心にする曲」
export const SCENES = {
  'ドライブ': { tempos: ['ノリノリ', 'ほどよい'], vibes: ['ポップ', 'クール', 'シャイニー', 'ダーク', 'ダンサブル'] },
  '通勤通学': { tempos: ['ほどよい'], vibes: null },
  '気分を上げたい時': { tempos: ['ノリノリ'], vibes: ['ポップ', 'シャイニー', 'ユニーク', 'ダンサブル'] },
  'くつろぎたい時': { tempos: ['ゆったり', 'ほどよい'], vibes: ['ディープ', 'ポップ', 'メロウ'] },
  '集中したい時': { tempos: ['ゆったり', 'ほどよい'], vibes: ['クール', 'ディープ', 'メロウ'], sound: 'ミニマル系' },
};

const FINDER_MAX = 10;
const FINDER_CAP = 2; // 同じ収録作品から2曲まで
const PL_TOTAL = 20;
const PL_CAP = 3; // 同じ収録作品から3曲まで

const playable = (s) => !!s.youtubeId;
const tagged = (s) => s.sounds.length && s.vibes.length && s.tempo;
const relKey = (s) => s.release || `single:${s.id}`;

export function shuffle(a) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

// 収録作品の偏りを抑えながら n 曲選ぶ
function take(cands, n, used, rel, cap) {
  const out = [];
  for (const s of cands) {
    if (out.length >= n) break;
    if (used.has(s.id)) continue;
    const k = relKey(s);
    if ((rel[k] || 0) >= cap) continue;
    used.add(s.id); rel[k] = (rel[k] || 0) + 1; out.push(s);
  }
  return out;
}

// ② どんな曲をお探し?
export function findSongs(songs, { vocal, sound, vibe, tempo }) {
  const pool = songs.filter((s) => playable(s) && tagged(s));
  const scored = pool.map((s) => {
    let score = 0; let exact = true;
    if (vocal !== 'どちらでも') {
      if (s.vocal === vocal) score += 3; else if (s.vocal === '複数') { score += 1; exact = false; } else { exact = false; score -= 5; }
    }
    if (sound !== ANY) { if (s.sounds.includes(sound)) score += 3; else exact = false; }
    if (vibe !== ANY) { if (s.vibes.includes(vibe)) score += 3; else exact = false; }
    if (tempo !== ANY) { if (s.tempo === tempo) score += 2; else exact = false; }
    return { s, score, exact };
  });
  const used = new Set(); const rel = {};
  const exact = shuffle(scored.filter((x) => x.exact)).map((x) => x.s);
  const near = shuffle(scored.filter((x) => !x.exact && x.score > 0)).sort((a, b) => b.score - a.score).map((x) => x.s);
  const res = take(exact, FINDER_MAX, used, rel, FINDER_CAP).map((s) => ({ song: s, near: false }));
  if (res.length < FINDER_MAX) res.push(...take(near, FINDER_MAX - res.length, used, rel, FINDER_CAP).map((s) => ({ song: s, near: true })));
  if (res.length < FINDER_MAX) res.push(...take([...exact, ...near], FINDER_MAX - res.length, used, rel, 99).map((s) => ({ song: s, near: !exact.includes(s) })));
  return res;
}

// ③ プレイリストを提案
export function makePlaylist(songs, { scene, vocal, style }) {
  const rule = SCENES[scene] || SCENES['通勤通学'];
  const random = style === '冒険セレクト' ? 10 : 4;
  const direction = PL_TOTAL - random;
  const centerN = Math.round(direction * 0.7);
  const varietyN = direction - centerN;
  const pref = vocal === '男性多め' ? '男性' : vocal === '女性多め' ? '女性' : '';

  const pool = songs.filter((s) => playable(s) && tagged(s));
  const isCenter = (s) => rule.tempos.includes(s.tempo) && (!rule.vibes || s.vibes.some((v) => rule.vibes.includes(v)));
  let center = shuffle(pool.filter(isCenter));
  if (rule.sound) center = [...center.filter((s) => s.sounds.includes(rule.sound)), ...center.filter((s) => !s.sounds.includes(rule.sound))];
  const variety = shuffle(pool.filter((s) => !isCenter(s)));

  const used = new Set(); const rel = {};
  // ボーカルの好みは7割ほど反映
  function pick(cands, n) {
    if (!pref) return take(cands, n, used, rel, PL_CAP);
    const first = take(cands.filter((s) => s.vocal === pref), Math.ceil(n * 0.7), used, rel, PL_CAP);
    return [...first, ...take(cands, n - first.length, used, rel, PL_CAP)];
  }
  const items = [
    ...pick(center, centerN).map((s) => ({ song: s, kind: 'center' })),
    ...pick(variety, varietyN).map((s) => ({ song: s, kind: 'variety' })),
  ];
  // 寄り道(ランダム枠):タグに関係なく
  items.push(...take(shuffle(songs.filter(playable)), random, used, rel, PL_CAP).map((s) => ({ song: s, kind: 'random' })));
  // 足りない時は条件をゆるめて補う
  if (items.length < PL_TOTAL) items.push(...take(shuffle(songs.filter(playable)), PL_TOTAL - items.length, used, rel, 99).map((s) => ({ song: s, kind: 'variety' })));
  return arrange(items);
}

// 同じテンポ・同じ作品が続かないように並べる
function arrange(items) {
  const rest = shuffle(items); const out = [];
  while (rest.length) {
    const prev = out[out.length - 1]?.song;
    let i = rest.findIndex((x) => !prev || (x.song.tempo !== prev.tempo && relKey(x.song) !== relKey(prev)));
    if (i < 0) i = rest.findIndex((x) => relKey(x.song) !== relKey(prev));
    if (i < 0) i = 0;
    out.push(rest.splice(i, 1)[0]);
  }
  return out;
}
