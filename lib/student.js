// 門弟アプリの「通行証」を確かめ、12時間有効の生徒モード(Cookie)に切り替える
import crypto from 'crypto';

export const COOKIE = 'ks_stu';
const HOURS = 12;

function secret() {
  const s = process.env.KS_APP_PASS_SECRET;
  if (!s) throw new Error('サーバーの設定(KS_APP_PASS_SECRET)が未登録です。');
  return s;
}
const sign = (text) => crypto.createHmac('sha256', secret()).update(text).digest('base64url');
const same = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

function check(token, prefix) {
  const [p, exp, sig] = String(token || '').split('.');
  if (p !== prefix || !exp || !sig) return false;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false;
  try { return same(sig, sign(`${p}.${exp}`)); } catch { return false; }
}

// 門弟アプリが発行した通行証(5分間有効)
export const validPass = (pass) => check(pass, 'p');

export function studentCookie() {
  const exp = Math.floor(Date.now() / 1000) + HOURS * 3600;
  const value = `s.${exp}.${sign(`s.${exp}`)}`;
  return `${COOKIE}=${value}; Path=/; Max-Age=${HOURS * 3600}; HttpOnly; Secure; SameSite=Lax`;
}

function readCookie(req) {
  const m = (req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : '';
}

export function isStudent(req) {
  try { return check(readCookie(req), 's'); } catch { return false; }
}
