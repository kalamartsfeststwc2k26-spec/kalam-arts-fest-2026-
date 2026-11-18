import { useCallback, useEffect, useRef, useState } from 'react';
import { LOGO_URL } from '../constants/branding';
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
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const pageRef = useRef(null);
  const beginReveal = useCallback(() => setRevealing(true), []);
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
    const change = () => setReducedMotion(media.matches);
    media?.addEventListener?.('change', change);
    return () => media?.removeEventListener?.('change', change);
  }, [show]);
  useEffect(() => {
    if (!show || phase !== 'loading') return;
    const timeout = window.setTimeout(() => { setFailed(true); setPhase('failed'); }, 5000);
    return () => window.clearTimeout(timeout);
  }, [show, phase]);
  useEffect(() => {
    if (!show || phase !== 'logo' || revealing) return;
    const timer = window.setTimeout(beginReveal, reducedMotion ? 800 : 3600);
    return () => window.clearTimeout(timer);
  }, [show, phase, reducedMotion, revealing, beginReveal]);
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

  const visible = phase !== 'loading';
  return <>
    <div ref={pageRef} aria-hidden={show ? 'true' : undefined}>{children}</div>
    {show && <main className={`kalam-intro ${revealing ? 'kalam-intro--exit' : ''}`} aria-label="KALAM festival welcome">
      <div className={`kalam-intro-scene ${visible ? 'kalam-intro-scene--visible' : ''}`}>
        <div className="kalam-intro-logo">
          {failed ? <span className="font-display text-5xl font-extrabold text-clay-700" aria-label="KALAM">K</span> : <>
            <img src={LOGO_URL} alt="KALAM College Arts Fest 2K26 logo" className={`block h-auto w-full object-contain ${phase === 'logo' ? 'kalam-logo-enter' : ''}`} onLoad={() => setPhase(current => current === 'loading' ? 'logo' : current)} onError={() => { setFailed(true); setPhase('failed'); }} />
          </>}
        </div>
      </div>
      {phase === 'loading' && <span className="sr-only" role="status">Loading festival welcome</span>}
    </main>}
  </>;
}
