import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TESTIMONIALS, TestimonialItem } from '../data/testimonials';
import { AnimatePresence, motion } from 'framer-motion';
import { portalApi } from '../services/portalApi';
import { useContent } from '../context/ContentBase';
import { isLikelyCrawler } from '../utils/crawler';
import { cx, typography } from '../utils/theme';
import { cldAvatar, cldTransform } from '../utils/cloudinary';
import Frame from '../components/ui/Frame';

interface TestimonialsProps {
  className?: string;
  title?: string;
}

const marqueeStyles = `
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.animate-marquee-custom {
  animation: marquee 100s linear infinite;
}
`;

const Avatar = ({ name, avatarUrl, company }: { name: string; avatarUrl?: string; company?: string }) => {
  const richAlt = company
    ? `${name} - ${company} - Reframe Visuals Ecommerce Photo Editing Client`
    : `${name} - Reframe Visuals Client Testimonial`;
  if (avatarUrl) {
    return (
      <img
        src={cldAvatar(avatarUrl)}
        alt={richAlt}
        width={36}
        height={36}
        loading="lazy"
        decoding="async"
        className="w-9 h-9 rounded-full object-cover shrink-0 border border-black/[0.12]"
      />
    );
  }
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-[11px] tracking-wide shrink-0 border border-black/[0.16] bg-black/[0.06] text-black/70">
      {initials}
    </div>
  );
};


const highlightText = (text: string) => {
  const keywords = [
    'Amazon', 'Remove.bg', 'Photoshop', 'Reframe Visuals', 'Reframe',
    '12 hours', '3 days', '12-hour', 'clipping path', 'clipping paths',
    'background removal', 'ghost mannequin', 'color correction', 'shadow depth',
    'style guides', 'retouching', 'natural shadows', 'white backgrounds',
    'color accuracy', 'API'
  ];
  let parts: (string | React.ReactNode)[] = [text];

  // Removed pastel color logic
  keywords.forEach((keyword) => {
    const newParts: (string | React.ReactNode)[] = [];
    parts.forEach((part) => {
      if (typeof part === 'string') {
        const subparts = part.split(new RegExp(`(${keyword})`, 'gi'));
        subparts.forEach((subpart, i) => {
          if (subpart.toLowerCase() === keyword.toLowerCase()) {
            newParts.push(
              <span key={i} className="text-black font-semibold">
                {subpart}
              </span>
            );
          } else if (subpart) {
            newParts.push(subpart);
          }
        });
      } else {
        newParts.push(part);
      }
    });
    parts = newParts;
  });

  return parts;
};

// ── Curved laurel branch geometry ───────────────────────────────────────────
// A long, sweeping stem (cubic bézier) with sharp-tipped blade leaves sampled
// along the curve — each leaf swept outward-and-up, tapering toward the apex.
interface LaurelLeaf { d: string; vx1: number; vy1: number; vx2: number; vy2: number; t: number; }

const buildLaurel = (): { leaves: LaurelLeaf[]; stemPath: (a: number, b: number) => string } => {
  const P0 = { x: 84, y: 452 };  // base (bottom, near card)
  const P1 = { x: 0, y: 318 };   // bows outward (left)
  const P2 = { x: 30, y: 116 };
  const P3 = { x: 132, y: 66 };  // apex hooks back in — drapes over the card corner

  const bez = (t: number) => {
    const m = 1 - t;
    return {
      x: m * m * m * P0.x + 3 * m * m * t * P1.x + 3 * m * t * t * P2.x + t * t * t * P3.x,
      y: m * m * m * P0.y + 3 * m * m * t * P1.y + 3 * m * t * t * P2.y + t * t * t * P3.y,
    };
  };
  const dbez = (t: number) => {
    const m = 1 - t;
    return {
      x: 3 * m * m * (P1.x - P0.x) + 6 * m * t * (P2.x - P1.x) + 3 * t * t * (P3.x - P2.x),
      y: 3 * m * m * (P1.y - P0.y) + 6 * m * t * (P2.y - P1.y) + 3 * t * t * (P3.y - P2.y),
    };
  };

  const f = (n: number) => n.toFixed(1);
  const N = 16;
  const t0 = 0.05, span = 0.91;
  const leaves: LaurelLeaf[] = [];

  // side: +1 = outer (convex, points away from card), -1 = inner (toward stem/card)
  const makeLeaf = (t: number, side: number, lenScale: number): LaurelLeaf => {
    const r = Math.min(1, Math.max(0, (t - t0) / span));
    const p = bez(t);
    const d = dbez(t);
    const dl = Math.hypot(d.x, d.y) || 1;
    const tx = d.x / dl, ty = d.y / dl;          // unit tangent (up the curve)

    let nx = ty, ny = -tx;                        // normal
    if (nx > 0) { nx = -nx; ny = -ny; }          // force outward (left)
    nx *= side; ny *= side;                       // flip to inner when side = -1

    let lx = nx + 0.5 * tx, ly = ny + 0.5 * ty;  // sweep leaf up along the branch
    const ll = Math.hypot(lx, ly) || 1;
    lx /= ll; ly /= ll;

    const len = (58 - 34 * r) * lenScale;        // long at base → short at tip
    const wid = (10 - 5.5 * r) * (0.6 + 0.4 * lenScale);
    const bx = p.x, by = p.y;
    const ax = bx + lx * len, ay = by + ly * len; // sharp tip
    const mx = (bx + ax) / 2, my = (by + ay) / 2;
    const px = -ly, py = lx;                      // perpendicular to leaf axis
    const c1x = mx + px * wid, c1y = my + py * wid;
    const c2x = mx - px * wid, c2y = my - py * wid;

    return {
      d: `M${f(bx)} ${f(by)} Q${f(c1x)} ${f(c1y)} ${f(ax)} ${f(ay)} Q${f(c2x)} ${f(c2y)} ${f(bx)} ${f(by)} Z`,
      vx1: bx, vy1: by, vx2: ax, vy2: ay, t,
    };
  };

  // Outer row — long leaves along the convex edge
  for (let i = 0; i < N; i++) {
    leaves.push(makeLeaf(t0 + (i / (N - 1)) * span, 1, 1));
  }
  // Inner row — shorter leaves, interleaved between the outer ones
  for (let i = 0; i < N - 1; i++) {
    leaves.push(makeLeaf(t0 + ((i + 0.5) / (N - 1)) * span, -1, 0.64));
  }
  // Crowning leaf right at the apex tip
  leaves.push(makeLeaf(1, 1, 0.9));

  // Smooth stem sub-path sampled between two curve parameters (for front/behind splitting)
  const stemPath = (a: number, b: number): string => {
    const steps = 30;
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const p = bez(a + (b - a) * (i / steps));
      d += i === 0 ? `M${f(p.x)} ${f(p.y)}` : ` L${f(p.x)} ${f(p.y)}`;
    }
    return d;
  };

  return { leaves, stemPath };
};

const LAUREL = buildLaurel();

const TSPLIT = 0.5; // split along the branch: t ≤ TSPLIT → base half, t > TSPLIT → apex half

const LaurelBranch: React.FC<{ mirrored?: boolean; delay?: number; uid: string; part: 'top' | 'bottom' }> = ({ mirrored = false, delay = 0, uid, part }) => {
  // Render only the requested half so it can be layered in front of / behind the card
  const leaves = LAUREL.leaves.filter((lf) => (part === 'top' ? lf.t > TSPLIT : lf.t <= TSPLIT));
  const stem = part === 'top' ? LAUREL.stemPath(TSPLIT, 1) : LAUREL.stemPath(0, TSPLIT);
  const svgEl = (
    <svg
      viewBox="-54 0 150 466"
      width="132"
      height="410"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        {/* Metallic gold — dark edge → bright center → warm edge (3D sheen) */}
        <linearGradient id={`leaf-${uid}`} x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0" stopColor="#5a3d08" />
          <stop offset="0.28" stopColor="#a9760d" />
          <stop offset="0.5" stopColor="#ffe9a8" />
          <stop offset="0.72" stopColor="#c9971f" />
          <stop offset="1" stopColor="#6e4e0c" />
        </linearGradient>
        <linearGradient id={`stem-${uid}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#7a5510" />
          <stop offset="0.5" stopColor="#e8bd53" />
          <stop offset="1" stopColor="#8a6212" />
        </linearGradient>
        {/* Soft depth shadow beneath each leaf */}
        <filter id={`sh-${uid}`} x="-60%" y="-25%" width="220%" height="150%">
          <feDropShadow dx="0" dy="1.1" stdDeviation="1.1" floodColor="#2e1f04" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Stem */}
      <path d={stem} stroke={`url(#stem-${uid})`} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.9" />

      {/* Leaves */}
      <g filter={`url(#sh-${uid})`}>
        {leaves.map((lf, i) => (
          <g key={i}>
            <path d={lf.d} fill={`url(#leaf-${uid})`} stroke="#4a3206" strokeWidth="0.4" strokeOpacity="0.5" />
            {/* Bright midrib for the metallic glint */}
            <line
              x1={lf.vx1} y1={lf.vy1} x2={lf.vx2} y2={lf.vy2}
              stroke="#fff6d8" strokeWidth="0.7" strokeOpacity="0.55" strokeLinecap="round"
            />
          </g>
        ))}
      </g>
    </svg>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: mirrored ? 26 : -26 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay }}
      className="pointer-events-none select-none"
    >
      {/* Mirror wrapper (static) so the sway origin stays consistent */}
      <div style={{ transform: mirrored ? 'scaleX(-1)' : undefined }}>
        {part === 'top' ? (
          // Upper half — gentle side-to-side sway, pivoting at the seam so it stays
          // attached to the calm lower half (seam ≈ viewBox 38.25,227.5 → 61.5% 48.8%)
          <motion.div
            animate={{ rotate: [0, 6.5, -6.5, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', repeatType: 'loop', delay: delay + 0.4 }}
            style={{ transformOrigin: '61.5% 48.8%' }}
          >
            {svgEl}
          </motion.div>
        ) : (
          // Lower half — calm / still
          <div>{svgEl}</div>
        )}
      </div>
    </motion.div>
  );
};

const TestimonialCard = ({ item, ariaHidden = false }: { item: typeof TESTIMONIALS[0]; ariaHidden?: boolean }) => {
  return (
    <article aria-hidden={ariaHidden || undefined} className="w-[280px] sm:w-[320px] md:w-[350px] shrink-0 flex flex-col bg-white border border-black/[0.16] -ml-[1px] cursor-default overflow-hidden">
      {/* Card Body - Quote at the top */}
      <div className="flex-1 p-5 pb-4 flex flex-col">
        <p className="text-[13px] sm:text-[14px] leading-relaxed text-black/75 font-normal" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
          {highlightText(item.quote)}
        </p>
        {item.metric && (
          <div className="mt-auto pt-2">
            <span className="inline-block text-[10px] font-bold text-[#C2410C] uppercase tracking-wider bg-orange-50 border border-orange-100 rounded px-1.5 py-0.5 leading-none">
              {item.metric}
            </span>
          </div>
        )}
      </div>

      {/* Horizontal Divider */}
      <div className="w-full h-px bg-black/[0.08]" />

      {/* Card Footer - Avatar & Author Details at the bottom */}
      <div className="flex items-center gap-3 p-5">
        <Avatar name={item.name} avatarUrl={item.avatarUrl} company={item.company} />
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[13px] font-bold text-black leading-tight truncate">{item.name}</span>
            {/* Checkmark verification badge */}
            {(item.company.includes(',') || item.company.toLowerCase().includes(' at ')) && (
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" style={{ fill: 'rgba(0,0,0,0.35)' }} aria-label="Verified account">
                <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.941.1-1.352.277C14.774 2.525 13.5 1.5 12 1.5s-2.774 1.025-3.422 2.287c-.41-.177-.872-.277-1.352-.277-2.109 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .941-.1 1.352-.277.648 1.262 1.922 2.287 3.422 2.287s2.774-1.025 3.422-2.287c.41.177.872.277 1.352.277 2.109 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.233 4.29l-3.32-3.315 1.246-1.244 2.074 2.071 5.394-5.385 1.246 1.244-6.64 6.63z" />
              </svg>
            )}
          </div>
          {item.username && (
            <span className="block text-[13px] text-black/60 leading-tight mt-0.5 truncate">{item.username}</span>
          )}
          <span className="block text-[12px] text-black/40 leading-snug mt-0.5 truncate">{item.company}</span>
        </div>
      </div>
    </article>
  );
};

const Testimonials: React.FC<TestimonialsProps> = ({
  className = '',
  title = 'People love shipping with Reframe',
}) => {
  const { currentUser } = useContent();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    company: '',
    quote: '',
    metric: '',
    email: '',
  });

  useEffect(() => {
    if (currentUser?.email && !form.email) {
      setForm(prev => ({ ...prev, email: currentUser.email }));
    }
  }, [currentUser]);

  const [customList, setCustomList] = useState<TestimonialItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('reframe_custom_testimonials');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {
          console.error(e);
        }
      }
    }
    return [];
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.company.trim() || !form.quote.trim() || !form.email.trim()) return;

    const newTestimonial: TestimonialItem = {
      name: form.name.trim(),
      company: form.company.trim(),
      quote: form.quote.trim(),
      metric: form.metric.trim() || undefined,
    };

    const updatedCustom = [newTestimonial, ...customList];
    setCustomList(updatedCustom);
    localStorage.setItem('reframe_custom_testimonials', JSON.stringify(updatedCustom));

    try {
      const messageBody = [
        `Name: ${newTestimonial.name}`,
        `Company/Role: ${newTestimonial.company}`,
        `Quote: "${newTestimonial.quote}"`,
        newTestimonial.metric ? `Impact Metric: ${newTestimonial.metric}` : ''
      ].filter(Boolean).join('\n');

      await portalApi.submitFeedback({
        type: 'testimonial',
        subject: `New Testimonial from ${newTestimonial.name}`,
        message: messageBody,
        email: form.email.trim(),
      });
    } catch (error) {
      console.error('Failed to submit testimonial to notifications:', error);
    }

    setForm({
      name: '',
      company: '',
      quote: '',
      metric: '',
      email: currentUser?.email || '',
    });
    setIsModalOpen(false);
  };

  const allTestimonials = [...customList, ...TESTIMONIALS];
  const marqueeTestimonials = allTestimonials.filter(item =>
    !item.name.includes('Nikola Filić')
  );

  // The infinite marquee needs the list repeated 3x for a seamless loop, but
  // duplicate copies must not appear in server-rendered/prerendered HTML
  // (crawlers would read every testimonial three times). Render one copy
  // statically and append aria-hidden clones client-side after mount, skipping
  // them entirely for crawlers and the build-time prerenderer.
  const [showMarqueeClones, setShowMarqueeClones] = useState(false);
  useEffect(() => {
    if (isLikelyCrawler()) return;
    setShowMarqueeClones(true);
  }, []);

  return (
    <section className={`relative overflow-hidden bg-white pt-14 sm:pt-16 lg:pt-24 pb-6 sm:pb-8 lg:pb-12 ${className}`}>
      <style>{marqueeStyles}</style>

      
      <div className="mx-auto max-w-[1800px] px-5 sm:px-10 lg:px-16">
        <div className="mb-12 md:mb-16 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-3xl space-y-2">
            <motion.h2 
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className={cx(typography.displayLg, "text-[var(--color-text-primary)]")}
            >
              {title}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="text-[16px] text-black/50 font-medium max-w-xl"
            >
              What catalog-scale teams say.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto"
          >
            <Link
              to="/free-trial"
              className="inline-flex min-h-[52px] w-full max-w-[280px] items-center justify-center rounded-full bg-[var(--color-text-primary)] px-6 text-[15px] font-bold text-white transition-all duration-300 hover:bg-black active:scale-95 sm:w-max"
            >
              Get 3 Free Sample Edits
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex min-h-[52px] w-full max-w-[280px] items-center justify-center rounded-full border border-black/15 px-6 text-[15px] font-bold text-black/70 transition-all duration-300 hover:border-black/30 hover:text-black active:scale-95 sm:w-max"
            >
              Share your experience
            </button>
          </motion.div>
        </div>
      </div>
      {/* Featured Client Spotlight Card (Nikola Filić) */}
      <div className="mx-auto max-w-5xl px-5 sm:px-10 lg:px-16 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-5xl"
        >
          {/* Left laurel — weaves around the frame: apex tip BEHIND the card, base IN FRONT */}
          <div className="absolute top-1/2 -translate-y-1/2 hidden xl:flex items-center pointer-events-none z-0
                          left-0 -translate-x-[70%]">
            <LaurelBranch part="top" delay={0.6} uid="l-behind" />
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 hidden xl:flex items-center pointer-events-none z-20
                          left-0 -translate-x-[70%]">
            <LaurelBranch part="bottom" delay={0.6} uid="l-front" />
          </div>
          {/* Right laurel — weaves around the frame: apex tip IN FRONT, base BEHIND the card */}
          <div className="absolute top-1/2 -translate-y-1/2 hidden xl:flex items-center pointer-events-none z-0
                          right-0 translate-x-[82%]">
            <LaurelBranch mirrored part="bottom" delay={0.75} uid="r-behind" />
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 hidden xl:flex items-center pointer-events-none z-20
                          right-0 translate-x-[82%]">
            <LaurelBranch mirrored part="top" delay={0.75} uid="r-front" />
          </div>

          <Frame size="lg" noPadding hideCrosshairs className="w-full relative z-10">
            <div className="w-full p-[5px]">
              <div className="w-full grid md:grid-cols-[1fr_1.3fr] rounded-none bg-white border border-black/[0.16] shadow-[0_24px_60px_-34px_rgba(15,23,42,0.18)] overflow-hidden">
          {/* Left Side: Real Photo of Nikola Filić */}
          <div className="relative h-[260px] md:h-auto min-h-[420px] overflow-hidden bg-[#e9e9e9]">
            <img
              src={cldTransform(
                'https://res.cloudinary.com/dnmj4altq/image/upload/v1781971885/reframe/testimonials/nikola_filic_portrait.jpg',
                'f_auto,q_auto,w_600'
              )}
              alt="Nikola Filić, Founder of Bomber Clothing - 5-Year Reframe Visuals Ecommerce Photo Editing Client"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 scale-[1.02] hover:scale-[1.05]"
            />

          </div>

          {/* Right Side: Review Content */}
          <div className="p-8 sm:p-10 lg:p-12 flex flex-col justify-between min-w-0 bg-white">
            <div>
              {/* Stars */}
              <div className="flex gap-0.5 text-amber-500 mb-7">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>

              {/* Primary Quote */}
              <blockquote className="text-[15px] sm:text-[16px] lg:text-[18px] text-black/80 font-normal leading-relaxed" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}>
                &ldquo;Probably the best team I have worked with, and I use the platform very very often. Awesome pricing &amp; highest possible result. Everything done to the smallest details. They really know how to use PS. Will definitely work with them in the long run.&rdquo;
              </blockquote>

              {/* Secondary Quote */}
              <p className="mt-4 text-[13px] sm:text-[14px] text-black/50 leading-relaxed border-l-2 border-black/[0.18] pl-4 italic">
                "Perfect collab as always. We have been working together now more than a year, and will definitely continue!"
              </p>

              {/* Brand note */}
              <p className="mt-6 text-[13px] text-black/45 leading-relaxed italic" style={{ WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}>
                Five years. Same vision, different seasons. Not every partnership is written in a contract. Some are written in the work.
                <span className="not-italic font-semibold text-black/30 ml-1">— Reframe Visuals</span>
              </p>

            </div>

            {/* Identity Footer */}
            <div className="mt-8 pt-6 border-t border-black/[0.14]">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Identity */}
                <div className="flex items-center gap-3.5">
                  <div className="relative w-11 h-11 shrink-0">
                    <img
                      src="https://res.cloudinary.com/dnmj4altq/image/upload/w_88,h_88,c_fill,g_face,f_auto,q_auto/v1781715801/reframe/testimonials/nikola_filic_profile.png"
                      alt="Nikola Filić - Founder, Bomber Clothing - Verified Reframe Visuals Long-term Partner"
                      className="w-full h-full rounded-full object-cover border-2 border-black/[0.18]"
                    />
                    {/* Verified badge overlay */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border border-white">
                      <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-white">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[15px] font-bold text-black leading-tight">Nikola Filić</span>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-blue-500 flex-shrink-0" aria-label="Verified">
                        <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.941.1-1.352.277C14.774 2.525 13.5 1.5 12 1.5s-2.774 1.025-3.422 2.287c-.41-.177-.872-.277-1.352-.277-2.109 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .941-.1 1.352-.277.648 1.262 1.922 2.287 3.422 2.287s2.774-1.025 3.422-2.287c.41.177.872.277 1.352.277 2.109 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.233 4.29l-3.32-3.315 1.246-1.244 2.074 2.071 5.394-5.385 1.246 1.244-6.64 6.63z" />
                      </svg>
                    </div>
                    <span className="block text-[12px] text-black/50 mt-0.5 font-medium">
                      Founder &amp; Creative Director,{' '}
                      <a href="https://bomberclothing.com" target="_blank" rel="noopener noreferrer" className="text-black hover:underline font-semibold">
                        Bomber Clothing
                      </a>
                    </span>
                    <span className="block text-[11px] text-black/50 mt-0.5 font-medium">Long-term partner</span>
                  </div>
                </div>
                {/* Identity data for search engines and AI crawlers — not visible to users */}
                <span style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
                  Nikola Filić, Founder and Creative Director at Bomber Clothing. Instagram: @bomber_clothing at instagram.com/bomber_clothing. Website: bomberclothing.com. Verified long-term partner of Reframe Visuals. 5-year collaboration.
                </span>
              </div>
            </div>
          </div>
        </div>
        </div>
        </Frame>
      </motion.div>
      </div>

      {/* Hidden identity data for Suril — Acia Studio — for search engines and AI crawlers */}
      <span style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        Suril, Founder of Acia Studio. UK-based streetwear and creative fashion brand. Instagram: @aciastudio at instagram.com/aciastudio. Verified client of Reframe Visuals.
      </span>

      {/* Infinite Single-Row Marquee */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-0 py-4"
      >
        {/* Row 1: Slides Left */}
        <div className="w-full overflow-hidden sm:overflow-visible select-none relative sm:[mask-image:linear-gradient(to_right,transparent,white_5%,white_95%,transparent)]">
          <div className="flex w-max animate-marquee-custom sm:hover:[animation-play-state:paused] pt-6 pb-6">
            {marqueeTestimonials.map((item, index) => (
              <TestimonialCard key={`row1-${index}`} item={item} />
            ))}
            {showMarqueeClones && [...marqueeTestimonials, ...marqueeTestimonials].map((item, index) => (
              <TestimonialCard key={`clone-${index}`} item={item} ariaHidden />
            ))}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-black/[0.18] bg-white p-6 shadow-2xl sm:p-8"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 rounded-full p-2 text-black/40 hover:bg-black/5 hover:text-black/70 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="mb-6">
                <h3 className="text-[20px] font-bold text-[var(--color-text-primary)]">Share your experience</h3>
                <p className="text-[13px] text-black/50 mt-1">
                  Add your testimonial to the Reframe scrolling marquee.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black/55 mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full rounded-xl border border-black/[0.18] bg-black/[0.04] px-4 py-2.5 text-[14px] outline-none focus:border-black/35 focus:bg-white transition-all focus:ring-1 focus:ring-black/5"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black/55 mb-1.5">
                    Company / Role
                  </label>
                  <input
                    type="text"
                    required
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="e.g. Founder at CleanSkins"
                    className="w-full rounded-xl border border-black/[0.18] bg-black/[0.04] px-4 py-2.5 text-[14px] outline-none focus:border-black/35 focus:bg-white transition-all focus:ring-1 focus:ring-black/5"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black/55 mb-1.5">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. sarah@cleanskins.com"
                    className="w-full rounded-xl border border-black/[0.18] bg-black/[0.04] px-4 py-2.5 text-[14px] outline-none focus:border-black/35 focus:bg-white transition-all focus:ring-1 focus:ring-black/5"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black/55 mb-1.5 flex justify-between">
                    <span>Your Review Quote</span>
                    <span className="text-[10px] text-black/35 normal-case font-normal">
                      {form.quote.length}/180 chars
                    </span>
                  </label>
                  <textarea
                    required
                    maxLength={180}
                    value={form.quote}
                    onChange={(e) => setForm({ ...form, quote: e.target.value })}
                    placeholder="Describe your experience with Reframe (e.g. quality, turnaround)..."
                    rows={3}
                    className="w-full rounded-xl border border-black/[0.18] bg-black/[0.04] px-4 py-2.5 text-[14px] outline-none focus:border-black/35 focus:bg-white transition-all focus:ring-1 focus:ring-black/5 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black/55 mb-1.5">
                    Impact Metric (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.metric}
                    onChange={(e) => setForm({ ...form, metric: e.target.value })}
                    placeholder="e.g. 3 days → 12 hours"
                    className="w-full rounded-xl border border-black/[0.18] bg-black/[0.04] px-4 py-2.5 text-[14px] outline-none focus:border-black/35 focus:bg-white transition-all focus:ring-1 focus:ring-black/5"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 min-h-11 rounded-xl border border-black/[0.18] text-[13px] font-bold text-black/70 hover:bg-neutral-50 active:scale-[0.98] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="min-h-12 flex-1 rounded-full bg-[var(--color-text-primary)] text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-all hover:bg-black active:scale-[0.98]"
                  >
                    Submit Testimonial
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Testimonials;
