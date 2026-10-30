import { useCallback, useEffect, useState } from 'react';
import { BRAND, LOGO_URL } from '../constants/branding';

const SPLASH_KEY = 'kalam:splash-seen:v1';
function hasSeenSplash() {
  try { return window.sessionStorage.getItem(SPLASH_KEY) === '1'; } catch { return false; }
}
function markSeen() {
  try { window.sessionStorage.setItem(SPLASH_KEY, '1'); } catch { /* Storage may be disabled. */ }
}

export default function FirstVisitSplash({ children }) {
  // Never intercept a direct link to another route.
  const [show, setShow] = useState(() => window.location.pathname === '/' && !hasSeenSplash());
  const [phase, setPhase] = useState('loading');
  const [failed, setFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const finish = useCallback(() => { markSeen(); setShow(false); }, []);

  useEffect(() => {
    if (!show) return;
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const change = () => setReducedMotion(media.matches);
    media?.addEventListener?.('change', change);
    return () => media?.removeEventListener?.('change', change);
  }, [show]);

  useEffect(() => {
    if (!show) return;
    const timeout = window.setTimeout(() => { setFailed(true); setPhase('failed'); }, 5000);
    return () => window.clearTimeout(timeout);
  }, [show]);

  useEffect(() => {
    if (!show || phase !== 'logo') return;
    const reveal = window.setTimeout(() => setPhase('words'), reducedMotion ? 100 : 1350);
    return () => window.clearTimeout(reveal);
  }, [show, phase, reducedMotion]);
  useEffect(() => {
    if (!show || phase !== 'words') return;
    const continueTimer = window.setTimeout(finish, reducedMotion ? 800 : 1400);
    return () => window.clearTimeout(continueTimer);
  }, [show, phase, reducedMotion, finish]);
  useEffect(() => {
    if (!show || phase !== 'failed') return;
    const continueTimer = window.setTimeout(finish, 1200);
    return () => window.clearTimeout(continueTimer);
  }, [show, phase, finish]);

  if (!show) return children;
  return <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-clay-900 px-5 py-12 text-center text-on-kiln sm:px-8" aria-label="KALAM festival welcome">
    <button type="button" onClick={finish} className="absolute right-5 top-5 rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-on-kiln hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-8 sm:top-8">{failed ? 'Continue to site' : 'Skip intro'}</button>
    <div className="flex w-full max-w-[680px] flex-col items-center">
      <div className={`grid aspect-[1046/568] w-full max-w-[620px] place-items-center overflow-hidden rounded-[1.5rem] bg-white p-4 shadow-raised transition-all ease-out sm:rounded-[2rem] sm:p-6 ${phase === 'loading' ? 'scale-[.6] opacity-0' : 'scale-100 opacity-100'}`} style={{ transitionDuration: reducedMotion ? '0ms' : '1250ms' }}>
        {failed ? <span className="font-display text-5xl font-extrabold text-clay-700" aria-label="KALAM">K</span> : <img src={LOGO_URL} alt="KALAM College Arts Fest 2K26 logo" className="block h-auto w-full object-contain" onLoad={() => setPhase(current => current === 'loading' ? 'logo' : current)} onError={() => { setFailed(true); setPhase('failed'); }} />}
      </div>
      <div className={`mt-7 transition-all duration-500 sm:mt-9 ${phase === 'words' || phase === 'failed' ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
        <p className="text-sm font-semibold text-on-kiln-muted">Shihab Thangal Women’s College</p>
        <h1 className="mt-3 font-display text-5xl font-extrabold tracking-[-.04em] text-on-kiln sm:text-6xl">KALAM</h1>
        <p className="mt-2 text-sm font-semibold text-on-kiln">COLLEGE ARTS FEST 2K26</p>
        <p lang="ml" className="mt-5 text-lg font-semibold leading-relaxed text-glaze-300">{BRAND.tagline}</p>
      </div>
      {phase === 'loading' && <span className="sr-only" role="status">Loading festival welcome</span>}
    </div>
  </main>;
}
