import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BRAND, LOGO_URL } from '../constants/branding';

export default function BrandMark({ compact = false, inverse = false, showLogo = true }) {
  const [imageFailed,setImageFailed] = useState(false);
  return <Link to="/" aria-label="KALAM, back to home" className="inline-flex min-w-0 items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-700">
    {showLogo && <span className="grid h-12 w-14 shrink-0 place-items-center rounded-xl bg-white p-1.5">{imageFailed ? <span className="text-lg font-extrabold text-clay-700">K</span> : <img src={LOGO_URL} alt="" className="h-full w-full object-contain" onError={() => setImageFailed(true)} />}</span>}
    <span className="min-w-0"><span className={`block font-display text-[1.2rem] font-extrabold tracking-[-.04em] ${inverse ? 'text-on-kiln' : 'text-clay-700'}`}>{BRAND.name}</span>{!compact && <span className={`block text-xs font-semibold ${inverse ? 'text-on-kiln-muted' : 'text-muted'}`}>College Arts Fest 2K26</span>}</span>
  </Link>;
}
