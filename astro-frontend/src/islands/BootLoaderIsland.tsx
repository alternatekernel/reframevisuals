import React, { useEffect, useState } from 'react';
import { routed } from './routed';

// Ported from AppBootLoader in frontend/src/App.tsx. Off unless PUBLIC_BOOT_LOADER=true:
// with pre-rendered HTML the page is already visible, so a loader would cover content that painted.
const BOOT_LOADER_SEEN_KEY = 'reframe_boot_loader_seen';
const BOOT_MIN_MS = 0;
const BOT_UA_PATTERN =
  /bot|crawler|spider|crawling|slurp|bingpreview|lighthouse|pagespeed|headless|facebookexternalhit|whatsapp|linkedinbot|twitterbot|discordbot|google-read-aloud/i;

const isLikelyCrawler = () => {
  if (typeof navigator === 'undefined') return false;
  return BOT_UA_PATTERN.test(navigator.userAgent || '');
};

// Synchronous check — computed before first render so showLoader can start true,
// preventing the 1-frame flash of page content before the effect fires.
const _initShowLoader = (() => {
  if (import.meta.env.PUBLIC_BOOT_LOADER !== 'true') return false;
  if (typeof navigator === 'undefined') return false;
  if (BOT_UA_PATTERN.test(navigator.userAgent || '')) return false;
  try { return sessionStorage.getItem(BOOT_LOADER_SEEN_KEY) !== '1'; } catch { return true; }
})();

const BootLogo = () => (
  <svg width="116" height="120" viewBox="0 0 2003 2073" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M150 160L150 1918M142 153H1837M1852 160L1852 1918M1837 1925L142 1925" stroke="currentColor" strokeWidth="8"/>
    <path d="M1730 152.983H1974.16M1852.08 28V272.152" stroke="currentColor" strokeWidth="56" strokeLinecap="round"/>
    <path d="M28 152.983H272.16M150.08 28V272.152" stroke="currentColor" strokeWidth="56" strokeLinecap="round"/>
    <path d="M28 1924.98H272.16M150.08 1800V2044.15" stroke="currentColor" strokeWidth="56" strokeLinecap="round"/>
    <path d="M1730 1924.98H1974.16M1852.08 1800V2044.15" stroke="currentColor" strokeWidth="56" strokeLinecap="round"/>
    <path d="M764.961 1646L413 1300.48V852.229H867.74L413 432L1278.52 432C1428.02 432 1580.64 531.61 1580.64 677.908V852.229H867.74L1581 1646H1157.41L764.961 1228.88V1646Z" fill="currentColor"/>
  </svg>
);

const BOOT_STATS = [
  { value: '$0.39+', label: 'Starting per image' },
  { value: '12h',    label: 'Turnaround time' },
  { value: '3',      label: 'Free sample edits' },
  { value: '100%',   label: 'Manual Pen Tool' },
];

const BOOT_SERVICES = [
  'Background Removal',
  'Clipping Path',
  'Ghost Mannequin',
  'Skin Retouching',
  'Color Correction',
  'Jewelry Editing',
  'Amazon-ready Images',
  'Storefront Optimisation',
];

const AppBootLoader: React.FC<{ exiting: boolean }> = ({ exiting }) => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #f8fbff 0%, #fff7ef 50%, #f5f3ff 100%)',
        opacity: exiting ? 0 : 1,
        transition: exiting ? 'opacity 0.6s ease' : 'opacity 0.3s ease',
      }}
    >
      {/* Coloured ambient blobs matching CTA section */}
      <div className="absolute inset-0 pointer-events-none" style={{ animation: 'boot-orb-in 1.6s ease both' }}>
        <div className="absolute top-[-20%] right-[-10%] w-[55vw] h-[55vw] rounded-full"
          style={{ background: '#cfe6ff', opacity: 0.7, filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full"
          style={{ background: '#ffd8bf', opacity: 0.6, filter: 'blur(80px)' }} />
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(circle at 20% 15%, rgba(255,255,255,0.85), transparent 40%), radial-gradient(circle at 80% 85%, rgba(255,255,255,0.55), transparent 35%)' }} />
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center px-8 w-full max-w-[620px]">

        {/* Logo */}
        <div className="text-gray-900" style={{ animation: 'boot-logo-in 0.7s cubic-bezier(0.16,1,0.3,1) both' }}>
          <BootLogo />
        </div>

        {/* Brand name — decorative only; <p> avoids a duplicate <h1> on every page */}
        <p
          className="mt-5 font-bold tracking-[-0.05em] text-gray-950 leading-none text-center"
          style={{ fontSize: 'clamp(36px, 5.5vw, 66px)', animation: 'boot-fade-up 0.6s 0.15s cubic-bezier(0.16,1,0.3,1) both', opacity: 0 }}
        >
          Reframe Visuals
        </p>

        {/* Tagline */}
        <p
          className="mt-3 text-gray-400 text-center font-medium"
          style={{ fontSize: 'clamp(13px, 1.2vw, 15px)', animation: 'boot-fade-up 0.5s 0.28s cubic-bezier(0.16,1,0.3,1) both', opacity: 0 }}
        >
          Human editors. Precise paths. Catalog-ready images.
        </p>


        {/* Stats — single glass strip with dividers */}
        <div
          className="mt-9 w-full flex rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.58)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.75)',
            boxShadow: '0 4px 28px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
            animation: 'boot-fade-up 0.55s 0.45s cubic-bezier(0.16,1,0.3,1) both',
            opacity: 0,
          }}
        >
          {BOOT_STATS.map((s, i) => (
            <div
              key={s.value}
              className="flex-1 flex flex-col items-center justify-center py-6 px-3"
              style={{ borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.11)' : 'none' }}
            >
              <span className="font-bold tracking-[-0.04em] text-gray-900 leading-none" style={{ fontSize: 'clamp(22px, 2.8vw, 36px)' }}>{s.value}</span>
              <span className="mt-2 text-gray-400 text-center font-medium leading-tight" style={{ fontSize: 'clamp(10px, 0.82vw, 12px)', letterSpacing: '0.01em' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Service pills */}
        <div
          className="mt-5 flex flex-wrap justify-center gap-2"
          style={{ animation: 'boot-fade-up 0.45s 0.62s cubic-bezier(0.16,1,0.3,1) both', opacity: 0 }}
        >
          {BOOT_SERVICES.map((s) => (
            <span
              key={s}
              className="px-3 py-1 rounded-full font-medium text-gray-400"
              style={{ fontSize: 'clamp(10px, 0.78vw, 12px)', background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.12)' }}
            >
              {s}
            </span>
          ))}
        </div>

        {/* Progress */}
        <div className="mt-9 w-full max-w-[280px] flex flex-col items-center gap-3"
          style={{ animation: 'boot-fade-up 0.4s 0.32s cubic-bezier(0.16,1,0.3,1) both', opacity: 0 }}>
          <div className="h-[2px] w-full overflow-hidden rounded-full" style={{ background: 'rgba(0,0,0,0.09)' }}>
            <div className="h-full rounded-full" style={{ background: 'rgba(0,0,0,0.28)', animation: 'boot-fill 3.4s linear forwards' }} />
          </div>
          <p style={{ fontSize: '10px', letterSpacing: '0.22em' }} className="uppercase text-gray-400 font-semibold">
            Loading
          </p>
        </div>

      </div>

      <style>{`
        @keyframes boot-logo-in { from { opacity:0; transform:scale(0.84) } to { opacity:1; transform:scale(1) } }
        @keyframes boot-fade-up { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes boot-fill    { from { width:0% } to { width:100% } }
        @keyframes boot-orb-in  { from { opacity:0 } to { opacity:1 } }
      `}</style>
    </div>
  );
};

const BootLoader: React.FC = () => {
  const [show, setShow] = useState(_initShowLoader);
  const [exiting, setExiting] = useState(false);
  useEffect(() => {
    if (!show) return;
    const ready = document.fonts ? document.fonts.ready : Promise.resolve();
    ready.then(() => {
      try { sessionStorage.setItem(BOOT_LOADER_SEEN_KEY, '1'); } catch { /* ignore */ }
      setExiting(true);
      setTimeout(() => setShow(false), 400);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return show ? <AppBootLoader exiting={exiting} /> : null;
};

export default routed(BootLoader);
