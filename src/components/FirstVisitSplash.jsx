import { useCallback, useEffect, useRef, useState } from 'react';
import { LOGO_URL } from '../constants/branding';
import IntroLogo3D from './IntroLogo3D';
import './intro-visuals.css';

const SPLASH_KEY = 'kalam:splash-seen:v1';
function hasSeenSplash() {
  try { return window.sessionStorage.getItem(SPLASH_KEY) === '1'; } catch { return false; }
}
function markSeen() {
  try { window.sessionStorage.setItem(SPLASH_KEY, '1'); } catch { /* Storage may be disabled. */ }
}
export default function FirstVisitSplash({ children }) {
  const [show, setShow] = useState(() => window.location.pathname === '/' && !hasSeenSplash());
  const [revealing, setRevealing] = useState(false);
  const [phase, setPhase] = useState('loading');
  const [failed, setFailed] = useState(false);
  const [webglReady, setWebglReady] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const pageRef = useRef(null);
  const beginReveal = useCallback(() => setRevealing(true), []);
  const showWebgl = useCallback(() => setWebglReady(true), []);
  const fallbackWebgl = useCallback(() => { setWebglReady(false); setWebglFailed(true); }, []);
  useEffect(() => {
    if (pageRef.current) pageRef.current.inert = show;
  }, [show]);
  useEffect(() => {
    if (!show) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = oldOverflow; };
  }, [show]);
  useEffect(() => {
    if (!show) return;
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const change = () => {
      setReducedMotion(media.matches);
      if (media.matches) setWebglReady(false);
    };
    media?.addEventListener?.('change', change);
    return () => media?.removeEventListener?.('change', change);
  }, [show]);
  useEffect(() => {
    if (!show || phase !== 'loading') return;
    const timeout = window.setTimeout(() => { setFailed(true); setPhase('failed'); }, 5000);
    return () => window.clearTimeout(timeout);
  }, [show, phase]);
  useEffect(() => {
    if (!show || phase !== 'logo' || reducedMotion || webglReady || webglFailed) return;
    const timer = window.setTimeout(fallbackWebgl, 3500);
    return () => window.clearTimeout(timer);
  }, [show, phase, reducedMotion, webglReady, webglFailed, fallbackWebgl]);
  useEffect(() => {
    if (!show || phase !== 'logo' || revealing) return;
    if (!reducedMotion && !webglReady && !webglFailed) return;
    const duration = reducedMotion ? 800 : webglFailed ? 1800 : 4000;
    const timer = window.setTimeout(beginReveal, duration);
    return () => window.clearTimeout(timer);
  }, [show, phase, reducedMotion, webglReady, webglFailed, revealing, beginReveal]);
  useEffect(() => {
    if (!show || phase !== 'failed' || revealing) return;
    const timer = window.setTimeout(beginReveal, 1200);
    return () => window.clearTimeout(timer);
  }, [show, phase, revealing, beginReveal]);
  useEffect(() => {
    if (!show || !revealing) return;
    const timer = window.setTimeout(() => { markSeen(); setShow(false); }, reducedMotion ? 0 : 850);
    return () => window.clearTimeout(timer);
  }, [show, revealing, reducedMotion]);

  const use3d = !failed && !reducedMotion && !webglFailed && phase === 'logo';
  const visible = phase !== 'loading' && (!use3d || webglReady);
  return <>
    <div ref={pageRef} aria-hidden={show ? 'true' : undefined}>{children}</div>
    {show && <main className={`kalam-intro ${revealing ? 'kalam-intro--exit' : ''}`} aria-label="KALAM festival welcome">
      <div className={`kalam-intro-scene ${visible ? 'kalam-intro-scene--visible' : ''}`}>
        {!failed && !reducedMotion && <div className="kalam-intro-colours" aria-hidden="true">
          <span className="kalam-intro-halo" />
          <svg className="kalam-intro-orbit" viewBox="0 0 700 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M35 205 C35 108 175 49 350 49 C525 49 665 108 665 205" stroke="#d99938" strokeWidth="1.2" strokeDasharray="170 85 45 190" />
            <path d="M65 188 C80 110 200 70 350 70 C500 70 620 110 635 188" stroke="#e63b83" strokeWidth="1" strokeDasharray="45 210 100 130" />
          </svg>
          <i className="kalam-dot kalam-dot--pink" /><i className="kalam-dot kalam-dot--blue" />
          <i className="kalam-dot kalam-dot--green" /><i className="kalam-dot kalam-dot--gold" />
        </div>}
        <div className="kalam-intro-logo">
          {failed ? <span className="font-display text-5xl font-extrabold text-clay-700" aria-label="KALAM">K</span> : <>
            <img src={LOGO_URL} alt="KALAM College Arts Fest 2K26 logo" className={`block h-auto w-full object-contain ${use3d ? 'opacity-0' : 'opacity-100'}`} onLoad={() => setPhase(current => current === 'loading' ? 'logo' : current)} onError={() => { setFailed(true); setPhase('failed'); }} />
            {use3d && <IntroLogo3D src={LOGO_URL} onReady={showWebgl} onFailure={fallbackWebgl} />}
          </>}
        </div>
      </div>
      {phase === 'loading' && <span className="sr-only" role="status">Loading festival welcome</span>}
    </main>}
  </>;
}
