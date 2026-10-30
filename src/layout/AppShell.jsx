import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, Menu, Search, X } from 'lucide-react';
import BrandMark from '../components/BrandMark';
import ConnectionNotice from '../components/ConnectionNotice';
import { BRAND } from '../constants/branding';
import { primaryNav, secondaryNav } from '../constants/navigation';

const desktopLinks = primaryNav.filter(({ to }) => ['/', '/events', '/results', '/leaderboard', '/teams'].includes(to));
const moreLinks = [{label:'Schedule',to:'/schedule'},...secondaryNav];
const navClass = ({isActive}) => `inline-flex items-center rounded-full px-3 py-2 text-[13px] font-semibold transition-colors ${isActive ? 'bg-clay-700 text-white' : 'text-muted hover:bg-paper hover:text-clay-800'}`;
const mobileClass = ({isActive}) => `flex items-center justify-between border-b border-line py-3 text-sm font-semibold ${isActive ? 'text-clay-700' : 'text-ink hover:text-pink-700'}`;
export default function AppShell() {
  const [menuOpen,setMenuOpen]=useState(false);
  const location=useLocation(); const menuButton=useRef(null); const firstRoute=useRef(true);
  useEffect(()=>{setMenuOpen(false);window.scrollTo(0,0);if(!firstRoute.current)document.getElementById('main-content')?.focus();firstRoute.current=false;},[location.pathname]);
  useEffect(()=>{if(!menuOpen)return;const close=e=>{if(e.key==='Escape'){setMenuOpen(false);menuButton.current?.focus();}};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[menuOpen]);
  return <div className="flex min-h-screen flex-col bg-paper text-ink">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-clay-800">Skip to content</a>
    <ConnectionNotice />
    <header className="relative z-40 border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-2 px-5 sm:px-8">
        <BrandMark showLogo={false} />
        <nav aria-label="Primary navigation" className="hidden items-center gap-1 min-[900px]:flex">
          {desktopLinks.map(item=><NavLink key={item.to} to={item.to} end={item.to==='/'} className={navClass}>{item.label}</NavLink>)}
          <details className="group relative" onKeyDown={e=>{if(e.key==='Escape')e.currentTarget.open=false;}}><summary className="flex cursor-pointer list-none items-center gap-1 rounded-full px-3 py-2 text-[13px] font-semibold text-muted hover:bg-paper hover:text-clay-800 [&::-webkit-details-marker]:hidden">More <ChevronDown size={14} className="group-open:rotate-180" aria-hidden="true" /></summary><div className="absolute right-0 top-[calc(100%+10px)] z-50 w-52 rounded-[18px] border border-line bg-white p-2 shadow-raised">{moreLinks.map(item=><NavLink key={item.to} to={item.to} onClick={e=>{e.currentTarget.closest('details').open=false;}} className={({isActive})=>`block rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive?'bg-paper text-clay-700':'text-ink hover:bg-paper'}`}>{item.label}</NavLink>)}</div></details>
        </nav>
        <div className="flex items-center gap-1 sm:gap-2"><Link to="/search" aria-label="Search" className="grid h-10 w-10 place-items-center rounded-full text-clay-800 hover:bg-paper"><Search size={19} aria-hidden="true" /></Link><Link to="/admin/login" className="hidden rounded-xl bg-clay-900 px-4 py-2.5 text-[13px] font-bold text-white hover:bg-clay-800 sm:inline-flex">Admin <ArrowUpRight size={14} className="ml-1" aria-hidden="true" /></Link><button ref={menuButton} type="button" aria-label={menuOpen?'Close navigation menu':'Open navigation menu'} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={()=>setMenuOpen(v=>!v)} className="grid h-10 w-10 place-items-center rounded-full text-clay-800 hover:bg-paper min-[900px]:hidden">{menuOpen?<X size={22} aria-hidden="true"/>:<Menu size={22} aria-hidden="true"/>}</button></div>
      </div>
      {menuOpen && <nav id="mobile-navigation" aria-label="Mobile navigation" className="absolute inset-x-0 top-full max-h-[calc(100dvh-64px)] overflow-y-auto border-t border-line bg-white px-5 pb-6 shadow-raised sm:px-8 min-[900px]:hidden"><div className="mx-auto grid max-w-[1160px] sm:grid-cols-2 sm:gap-x-10">{[...primaryNav,...secondaryNav].map(item=><NavLink key={item.to} to={item.to} end={item.to==='/'} className={mobileClass}>{item.label}<ArrowUpRight size={14} aria-hidden="true"/></NavLink>)}<NavLink to="/search" className={mobileClass}>Search</NavLink><NavLink to="/admin/login" className={mobileClass}>Admin sign in</NavLink></div></nav>}
    </header>
    <main id="main-content" className="flex-1" tabIndex="-1"><Outlet/></main>
    <footer className="kiln bg-clay-900 text-on-kiln">
      <div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-9 sm:px-8 min-[900px]:grid-cols-[1fr_auto]">
        <div><BrandMark inverse /><p lang="ml" className="mt-3 text-base font-semibold text-glaze-300">{BRAND.tagline}</p><p className="mt-2 text-sm text-on-kiln-muted">{BRAND.college}<br/>{BRAND.location}</p></div>
        <nav aria-label="Footer navigation" className="grid grid-cols-2 content-start gap-x-8 gap-y-3 text-sm font-semibold text-on-kiln-muted sm:gap-x-14">{secondaryNav.map(item=><Link key={item.to} to={item.to} className="hover:text-white">{item.label}</Link>)}</nav>
      </div>
      <div className="border-t border-white/20"><div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-2 px-5 py-3 text-xs text-on-kiln-muted sm:px-8"><span>© 2026 KALAM · STWC</span><span>{BRAND.organizer}</span></div></div>
    </footer>
  </div>;
}
