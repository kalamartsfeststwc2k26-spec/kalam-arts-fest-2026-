import { useEffect, useState } from 'react';
import { LOGO_URL } from '../constants/branding';

export default function AboutBanner({ banners }) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState([]);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const available = banners.filter(banner => !failed.includes(banner.id));
  const active = Math.min(index, Math.max(available.length - 1, 0));

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return undefined;
    const onChange = event => setReducedMotion(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  useEffect(() => {
    if (reducedMotion || available.length < 2) return undefined;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex(current => (current + 1) % available.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [reducedMotion, available.length]);

  return <div className="min-w-0">
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-page">
      {available.length ? available.map((banner, position) => <img key={banner.id} src={banner.url} alt={position === active ? banner.alt_text : ''} aria-hidden={position !== active} onError={() => setFailed(previous => previous.includes(banner.id) ? previous : [...previous, banner.id])} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 motion-reduce:transition-none ${position === active ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />) : <img src={LOGO_URL} alt="KALAM festival logo" className="h-full w-full object-contain p-5" />}
    </div>
  </div>;
}
