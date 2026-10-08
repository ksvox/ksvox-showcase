// トップ下のバナー(門弟アプリの管理画面で差し替え。未登録の時は最初から入っている画像を出す)
import { useEffect, useState } from 'react';

const API = 'https://montei.ksvox.net/api/public/banner?slot=showcase';
const DEFAULT = { image: '/banner-default.jpg', link: 'https://koeshiru.ksvox.net/', alt: '歌声診断アプリ「コエシル」' };

export default function Banner() {
  const [b, setB] = useState(DEFAULT);
  useEffect(() => {
    let alive = true;
    fetch(API).then((r) => r.json()).then((j) => {
      if (alive && j && j.active && j.image && j.link) setB({ image: j.image, link: j.link, alt: 'おすすめアプリ' });
    }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return (
    <a className="ad-banner" href={b.link} target="_blank" rel="noopener noreferrer">
      <img src={b.image} alt={b.alt} width="1200" height="400" loading="lazy" />
    </a>
  );
}
