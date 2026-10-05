// 門弟アプリの通行証を受け取り、生徒モードのCookieを渡す
import { validPass, studentCookie } from '../../lib/student';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POSTのみ' });
  try {
    const pass = req.body?.pass || '';
    if (!validPass(pass)) return res.status(403).json({ error: '通行証の期限が切れています。門弟アプリからもう一度開いてください。' });
    res.setHeader('Set-Cookie', studentCookie());
    return res.status(200).json({ student: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
