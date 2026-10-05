// 歌詞PDF(生徒モードのときだけ渡す)
import { adminDb } from '../../lib/firebaseAdmin';
import { isStudent } from '../../lib/student';
import { getCatalog } from '../../lib/catalog';

function fail(res, status, msg) {
  res.status(status).setHeader('Content-Type', 'text/plain; charset=utf-8');
  return res.send(msg);
}

export default async function handler(req, res) {
  if (!isStudent(req)) return fail(res, 403, '歌詞PDFはK\'s VOXの門下生限定です。門弟アプリから開いてください。');
  const id = String(req.query.id || '');
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return fail(res, 400, '曲が指定されていません。');
  try {
    const song = (await getCatalog()).find((s) => s.id === id);
    if (!song) return fail(res, 404, '曲が見つかりません。');
    const snap = await adminDb().collection('songs').doc(id).collection('pdf').orderBy('i').get();
    if (snap.empty) return fail(res, 404, 'この曲の歌詞PDFは登録されていません。');
    const buf = Buffer.from(snap.docs.map((d) => d.data().data).join(''), 'base64');
    const name = `${song.title.replace(/[\\/:*?"<>|]/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="lyrics.pdf"; filename*=UTF-8''${encodeURIComponent(name)}`);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.send(buf);
  } catch (e) {
    return fail(res, 500, '歌詞PDFを読み込めませんでした:' + e.message);
  }
}
