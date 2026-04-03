import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Bell, Brain, Database, BookOpen, TrendingUp } from 'lucide-react';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

/* ─── Data ─── */
const features = [
  { icon: Shield, title: 'Real-Time Rule Monitor', desc: 'Instant alerts when you approach daily loss limits, drawdown thresholds, or violate prop firm rules.', tag: 'Risk Engine' },
  { icon: Bell, title: 'Telegram Alerts', desc: 'Get critical risk notifications delivered straight to Telegram — never miss a warning.', tag: 'Notifications' },
  { icon: Brain, title: 'AI Trade Coach', desc: 'Personalized AI analysis of your trading patterns with actionable improvement suggestions.', tag: 'Intelligence' },
  { icon: Database, title: 'Prop Firm Rules DB', desc: 'Complete database of rules across 2000+ prop firms, always updated and always accurate.', tag: 'Database' },
  { icon: BookOpen, title: 'Auto Trade Journal', desc: 'Every trade automatically logged with session, risk metrics, and compliance status.', tag: 'Journaling' },
  { icon: TrendingUp, title: 'Challenge Forecaster', desc: 'AI-powered predictions on your probability of passing based on current performance.', tag: 'Forecasting' },
];

const statsData = [
  { target: 90, prefix: '', suffix: '%', label: 'Traders Fail Challenges', duration: 1500 },
  { target: 2000, prefix: '', suffix: '+', label: 'Prop Firms Tracked', duration: 1800 },
  { target: 20, prefix: '$', suffix: 'B', label: 'Industry Size', duration: 1200 },
  { target: 1999, prefix: '₹', suffix: '/mo', label: 'Starting Price', duration: 1600 },
];

const gauges = [
  { label: 'Daily Loss Used', value: 34, limit: '5%', color: '#22C55E' },
  { label: 'Max Drawdown', value: 61, limit: '10%', color: '#B8942A' },
  { label: 'Profit Target', value: 24, limit: '10%', color: '#22C55E' },
];

const EASE = 'cubic-bezier(0.25, 0.1, 0.25, 1)';

/* ─── Hooks ─── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function useCountUp(target: number, duration: number, start: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setValue(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return value;
}

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const h = () => setY(window.scrollY);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  return y;
}

/* ─── Ticker ─── */
function LiveTicker() {
  const [idx, setIdx] = useState(0);
  const ticks = useMemo(() => [
    { label: 'Daily Loss', value: '2.4%', status: 'Safe' },
    { label: 'Max DD', value: '6.1%', status: 'Safe' },
    { label: 'Profit', value: '+3.2%', status: 'On Track' },
    { label: 'Daily Loss', value: '3.1%', status: 'Warning' },
    { label: 'Max DD', value: '7.8%', status: 'Monitor' },
    { label: 'Profit', value: '+4.6%', status: 'On Track' },
  ], []);

  useEffect(() => {
    const iv = setInterval(() => setIdx(i => (i + 1) % ticks.length), 2000);
    return () => clearInterval(iv);
  }, [ticks.length]);

  const t = ticks[idx];
  return (
    <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4 z-10"
      style={{ animation: 'heroFadeUp 0.8s ease-out 1.2s both' }}>
      {['Daily Loss', 'Max DD', 'Status'].map((label, i) => (
        <div key={label} className="flex flex-col" style={{ minWidth: 120 }}>
          <span className="font-body text-primary" style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{label}</span>
          <span className="font-display text-foreground transition-all duration-500" style={{ fontSize: 18, fontWeight: 300 }}>
            {i === 0 ? t.value : i === 1 ? ticks[(idx + 1) % ticks.length].value : t.status}
          </span>
        </div>
      ))}
      <div className="h-px w-8 bg-primary/20 mt-2" />
    </div>
  );
}

/* ─── Counter stat ─── */
function StatItem({ stat, visible, index }: { stat: typeof statsData[0]; visible: boolean; index: number }) {
  const count = useCountUp(stat.target, stat.duration, visible);
  return (
    <div
      className="px-8 py-14 text-center"
      style={{
        transition: `opacity 0.7s ${EASE} ${index * 0.1}s, transform 0.7s ${EASE} ${index * 0.1}s`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
      }}
    >
      <div className="font-display" style={{ fontSize: 42, fontWeight: 300, lineHeight: 1 }}>
        <span style={{ color: '#F5F2EE' }}>{stat.prefix}{count.toLocaleString()}</span>
        <span className="text-primary" style={{ fontSize: 24 }}>{stat.suffix}</span>
      </div>
      <div className="mt-3 font-body" style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(245,242,238,0.45)' }}>
        {stat.label}
      </div>
    </div>
  );
}

/* ─── Feature card ─── */
function FeatureCard({ f, i, visible }: { f: typeof features[0]; i: number; visible: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative p-8 transition-all overflow-hidden"
      style={{
        backgroundColor: hovered ? '#222222' : '#1A1A1A',
        border: '0.5px solid rgba(255,255,255,0.08)',
        transitionDuration: '0.5s',
        transitionTimingFunction: EASE,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: `${i * 0.15}s`,
      }}
    >
      {/* Gold left border on hover */}
      <div
        className="absolute left-0 top-0 w-[2px] bg-primary transition-all"
        style={{
          height: hovered ? '100%' : '0%',
          transitionDuration: '0.4s',
          transitionTimingFunction: EASE,
        }}
      />
      <span className="font-display transition-colors duration-500" style={{ fontSize: 14, color: hovered ? '#F5F2EE' : 'rgba(184,148,42,0.4)' }}>
        {String(i + 1).padStart(2, '0')}
      </span>
      <h3 className="mt-4 font-display" style={{ fontSize: 22, fontWeight: 400, color: '#F5F2EE' }}>{f.title}</h3>
      <p className="mt-3 font-body" style={{ fontSize: 14, fontWeight: 300, color: 'rgba(245,242,238,0.55)', lineHeight: 1.7 }}>{f.desc}</p>
      <div className="mt-6">
        <span className="text-primary border-b border-primary/30 pb-0.5" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{f.tag}</span>
      </div>
    </div>
  );
}

/* ─── Animated gauge bar ─── */
function GaugeBar({ gauge, visible, delay }: { gauge: typeof gauges[0]; visible: boolean; delay: number }) {
  return (
    <div className="mb-5">
      <div className="flex justify-between mb-2">
        <span className="font-body" style={{ fontSize: 13, fontWeight: 400, color: '#1A1A1A' }}>{gauge.label}</span>
        <span className="font-display" style={{ fontSize: 16, fontWeight: 400, color: '#1A1A1A' }}>{gauge.value}%</span>
      </div>
      <div className="w-full rounded-full overflow-hidden" style={{ height: 6, backgroundColor: 'rgba(0,0,0,0.08)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: visible ? `${gauge.value}%` : '0%',
            backgroundColor: gauge.color,
            transition: `width 1.2s cubic-bezier(0.25, 0.1, 0.25, 1) ${delay}s`,
          }}
        />
      </div>
      <div className="mt-1 font-body" style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)' }}>Limit: {gauge.limit}</div>
    </div>
  );
}

/* ─── Section reveal wrapper ─── */
function SectionTitle({ visible, title, highlight, side = 'left' }: { visible: boolean; title: string; highlight: string; side?: 'left' | 'center' }) {
  const isCenter = side === 'center';
  return (
    <div className={isCenter ? 'text-center' : ''}>
      <div
        className={`mb-6 flex items-center gap-6 ${isCenter ? 'justify-center' : ''}`}
        style={{
          transition: `opacity 0.6s ${EASE}, transform 0.6s ${EASE}`,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateX(0)' : 'translateX(-40px)',
        }}
      >
        <div className="bg-primary" style={{ height: 1, width: 40, transition: `transform 0.6s ${EASE} 0.3s`, transform: visible ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left' }} />
      </div>
      <h2
        className="font-display"
        style={{
          fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, lineHeight: 1.1,
          transition: `opacity 0.7s ${EASE} 0.1s, transform 0.7s ${EASE} 0.1s`,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateX(0)' : 'translateX(-40px)',
        }}
      >
        {title} <span className="text-primary italic">{highlight}</span>
      </h2>
    </div>
  );
}

/* ─── Gradient bridge ─── */
function Bridge({ from, to }: { from: string; to: string }) {
  return <div style={{ height: 120, background: `linear-gradient(${from}, ${to})` }} />;
}

/* ─── Custom cursor ─── */
function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    let mx = 0, my = 0, rx = 0, ry = 0;
    const move = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    const over = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a, button, [role="button"]')) setHovering(true);
    };
    const out = () => setHovering(false);
    const down = () => { setClicking(true); setTimeout(() => setClicking(false), 200); };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', over);
    window.addEventListener('mouseout', out);
    window.addEventListener('mousedown', down);

    let raf: number;
    const loop = () => {
      if (dot.current) dot.current.style.transform = `translate(${mx}px, ${my}px)`;
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      if (ring.current) ring.current.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', over);
      window.removeEventListener('mouseout', out);
      window.removeEventListener('mousedown', down);
      cancelAnimationFrame(raf);
    };
  }, []);

  const dotSize = clicking ? 12 : hovering ? 16 : 8;
  const ringSize = clicking ? 40 : hovering ? 48 : 36;

  return (
    <>
      <div ref={dot} className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full bg-primary" style={{ width: dotSize, height: dotSize, marginLeft: -dotSize / 2, marginTop: -dotSize / 2, transition: 'width 0.2s, height 0.2s, margin 0.2s' }} />
      <div ref={ring} className="pointer-events-none fixed top-0 left-0 z-[9998] rounded-full border transition-all duration-300" style={{ width: ringSize, height: ringSize, marginLeft: -ringSize / 2, marginTop: -ringSize / 2, borderColor: 'rgba(184,148,42,0.4)', backgroundColor: hovering ? 'rgba(184,148,42,0.1)' : 'transparent' }} />
    </>
  );
}

/* ─── Headline with letter animation ─── */
function AnimatedHeadline() {
  const line1 = 'Never breach';
  const line2 = 'a rule ';
  const [show, setShow] = useState(false);
  const [lineDrawn, setLineDrawn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 400);
    const t2 = setTimeout(() => setLineDrawn(true), 1200);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);

  const renderChars = (text: string, offset: number) =>
    text.split('').map((ch, i) => (
      <span
        key={i}
        className="inline-block"
        style={{
          transition: `opacity 0.5s ${EASE} ${(offset + i) * 0.05}s, transform 0.5s ${EASE} ${(offset + i) * 0.05}s`,
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0)' : 'translateY(40px)',
        }}
      >
        {ch === ' ' ? '\u00A0' : ch}
      </span>
    ));

  return (
    <div>
      <h1 className="font-display" style={{ fontSize: 'clamp(56px, 8vw, 90px)', fontWeight: 300, lineHeight: 0.95, letterSpacing: '-0.02em' }}>
        {renderChars(line1, 0)}
        <br />
        {renderChars(line2, line1.length)}
        <span className="text-primary italic" style={{
          transition: `opacity 0.5s ${EASE} ${(line1.length + line2.length) * 0.05}s, transform 0.5s ${EASE} ${(line1.length + line2.length) * 0.05}s`,
          opacity: show ? 1 : 0,
          display: 'inline-block',
          transform: show ? 'translateY(0)' : 'translateY(40px)',
        }}>again.</span>
      </h1>
      {/* Gold line draw */}
      <div className="mt-8 mx-auto" style={{ width: 40, height: 1, backgroundColor: '#B8942A', transition: `transform 0.6s ${EASE}`, transform: lineDrawn ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left' }} />
    </div>
  );
}

/* ═══════════════════════════════════════ */
/*               MAIN PAGE                */
/* ═══════════════════════════════════════ */

const Landing = () => {
  const scrollY = useScrollY();
  const statsReveal = useReveal(0.15);
  const featuresReveal = useReveal(0.15);
  const dashReveal = useReveal(0.15);
  const ctaReveal = useReveal(0.15);

  const navCompressed = scrollY > 60;

  return (
    <div className="min-h-screen cursor-none" style={{ backgroundColor: '#0A0A0A' }}>
      <CustomCursor />

      {/* ─── Nav ─── */}
      <nav
        className="fixed top-0 z-50 w-full transition-all"
        style={{
          transitionDuration: '0.5s',
          transitionTimingFunction: EASE,
          backgroundColor: navCompressed ? 'rgba(10,10,10,0.85)' : 'transparent',
          backdropFilter: navCompressed ? 'blur(20px)' : 'none',
          borderBottom: navCompressed ? '0.5px solid rgba(245,242,238,0.06)' : '0.5px solid transparent',
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8" style={{ height: navCompressed ? 56 : 72, transition: `height 0.5s ${EASE}` }}>
          <Link to="/" className="font-display" style={{ fontWeight: 300, fontSize: 20 }}>
            {'ARIA'.split('').map((ch, i) => (
              <span key={i} className="text-primary inline-block" style={{ animation: `heroFadeUp 0.5s ${EASE} ${i * 0.08}s both` }}>{ch}</span>
            ))}
            {' '}
            {'PropGuard'.split('').map((ch, i) => (
              <span key={i} className="inline-block" style={{ color: '#F5F2EE', animation: `heroFadeUp 0.5s ${EASE} ${(i + 4) * 0.08}s both` }}>{ch}</span>
            ))}
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            {['Features', 'Pricing', 'About'].map((l) => (
              <span key={l} className="transition-colors duration-400 cursor-pointer" style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: '"DM Sans"', color: 'rgba(245,242,238,0.5)' }}>
                {l}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost-light" size="sm" asChild className="text-xs" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              <Link to="/login">Log In</Link>
            </Button>
            <Button variant="gold" size="sm" asChild className="text-xs" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              <Link to="/signup">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative flex h-screen flex-col items-center justify-center px-8 overflow-hidden" style={{ backgroundColor: '#0A0A0A' }}>
        {/* Noise texture */}
        <div className="absolute inset-0" style={{ opacity: 0.04, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '128px 128px' }} />

        {/* Ghost ARIA text — parallax */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{ transform: `translateY(${-scrollY * 0.15}px)` }}>
          <span className="font-display" style={{ fontSize: 'clamp(200px, 30vw, 400px)', fontWeight: 300, color: 'rgba(245,242,238,0.03)', lineHeight: 1 }}>ARIA</span>
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(245,242,238,1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,242,238,1) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />

        {/* Live ticker */}
        <LiveTicker />

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          {/* Eyebrow */}
          <p className="text-primary" style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: '"DM Sans"', fontWeight: 500, animation: `heroFadeUp 0.8s ${EASE} 0.3s both` }}>
            AI Risk Intelligence Platform
          </p>

          {/* Headline */}
          <div className="mt-8">
            <AnimatedHeadline />
          </div>

          {/* Body */}
          <p className="mx-auto mt-8 font-body" style={{ maxWidth: 400, color: 'rgba(245,242,238,0.55)', fontWeight: 300, fontSize: 16, lineHeight: 1.7, animation: `heroFadeUp 0.8s ${EASE} 0.9s both` }}>
            Real-time AI risk monitoring for prop firm challenges. Protect your capital with institutional-grade intelligence.
          </p>

          {/* Buttons */}
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center" style={{ animation: `heroFadeUp 0.8s ${EASE} 1.1s both` }}>
            <Button variant="gold" size="lg" className="px-10 text-xs" style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }} asChild>
              <Link to="/signup">Start Free Trial</Link>
            </Button>
            <Button variant="ghost-light" size="lg" className="px-10 text-xs" style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }} asChild>
              <Link to="/dashboard">See Dashboard</Link>
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 right-10 flex flex-col items-center gap-3">
          <span style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', writingMode: 'vertical-rl', color: 'rgba(245,242,238,0.3)' }}>Scroll</span>
          <div className="bg-primary animate-pulse-gold" style={{ width: 1, height: 60 }} />
        </div>
      </section>

      {/* ─── Bridge: Hero → Stats ─── */}
      <Bridge from="#0A0A0A" to="#111111" />

      {/* ═══ STATS ═══ */}
      <section ref={statsReveal.ref} style={{ backgroundColor: '#111111' }}>
        <div className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4">
          {statsData.map((s, i) => (
            <div key={s.label} style={{ borderRight: i < statsData.length - 1 ? '0.5px solid rgba(245,242,238,0.06)' : 'none' }}>
              <StatItem stat={s} visible={statsReveal.visible} index={i} />
            </div>
          ))}
        </div>
      </section>

      {/* ─── Bridge: Stats → Features ─── */}
      <Bridge from="#111111" to="#1A1A1A" />

      {/* ═══ FEATURES ═══ */}
      <section ref={featuresReveal.ref} className="px-8 py-32" style={{ backgroundColor: '#1A1A1A' }}>
        <div className="mx-auto max-w-7xl">
          <SectionTitle visible={featuresReveal.visible} title="Built for" highlight="serious traders" />
          <p className="mt-4 font-body mb-16" style={{
            maxWidth: 420, fontSize: 15, fontWeight: 300, color: 'rgba(245,242,238,0.5)', lineHeight: 1.7,
            transition: `opacity 0.7s ${EASE} 0.3s, transform 0.7s ${EASE} 0.3s`,
            opacity: featuresReveal.visible ? 1 : 0,
            transform: featuresReveal.visible ? 'translateX(0)' : 'translateX(40px)',
          }}>
            Six intelligent modules working together to protect your prop firm account.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <FeatureCard key={f.title} f={f} i={i} visible={featuresReveal.visible} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bridge: Features → Dashboard ─── */}
      <Bridge from="#1A1A1A" to="#F5F2EE" />

      {/* ═══ DASHBOARD PREVIEW (cream) ═══ */}
      <section ref={dashReveal.ref} className="px-8 py-32" style={{ backgroundColor: '#F5F2EE' }}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center gap-6" style={{
            transition: `opacity 0.6s ${EASE}, transform 0.6s ${EASE}`,
            opacity: dashReveal.visible ? 1 : 0,
            transform: dashReveal.visible ? 'translateX(0)' : 'translateX(-40px)',
          }}>
            <div style={{ height: 1, width: 40, backgroundColor: '#B8942A', transition: `transform 0.6s ${EASE} 0.3s`, transform: dashReveal.visible ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left' }} />
            <span style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#B8942A', fontFamily: '"DM Sans"' }}>Dashboard Preview</span>
          </div>

          <h2 className="font-display mb-4" style={{
            fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, lineHeight: 1.1, color: '#1A1A1A',
            transition: `opacity 0.7s ${EASE} 0.1s, transform 0.7s ${EASE} 0.1s`,
            opacity: dashReveal.visible ? 1 : 0,
            transform: dashReveal.visible ? 'translateX(0)' : 'translateX(-40px)',
          }}>
            Your command <span style={{ color: '#B8942A', fontStyle: 'italic' }}>center</span>
          </h2>

          <p className="font-body mb-16" style={{
            maxWidth: 420, fontSize: 15, fontWeight: 300, color: 'rgba(26,26,26,0.55)', lineHeight: 1.7,
            transition: `opacity 0.7s ${EASE} 0.3s, transform 0.7s ${EASE} 0.3s`,
            opacity: dashReveal.visible ? 1 : 0,
            transform: dashReveal.visible ? 'translateX(0)' : 'translateX(40px)',
          }}>
            Real-time risk gauges, trade logs, and AI insights — all in one elegant view.
          </p>

          {/* Dashboard mock card */}
          <div
            className="rounded-lg overflow-hidden"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
              transition: `opacity 0.8s ${EASE} 0.2s, transform 0.8s ${EASE} 0.2s`,
              opacity: dashReveal.visible ? 1 : 0,
              transform: dashReveal.visible ? 'translateY(0)' : 'translateY(60px)',
            }}
          >
            {/* Mock header */}
            <div className="flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-3">
                <span className="font-display" style={{ fontSize: 16, fontWeight: 400, color: '#B8942A' }}>ARIA</span>
                <span className="font-display" style={{ fontSize: 16, fontWeight: 300, color: '#1A1A1A' }}>PropGuard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full" style={{ width: 8, height: 8, backgroundColor: '#22C55E' }} />
                <span className="font-body" style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Live</span>
              </div>
            </div>

            {/* Mock content */}
            <div className="px-8 py-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="font-body" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)' }}>Active Account</span>
                  <h3 className="font-display mt-1" style={{ fontSize: 22, fontWeight: 400, color: '#1A1A1A' }}>FTMO — $100,000</h3>
                </div>
                <span className="font-display" style={{ fontSize: 14, color: '#B8942A' }}>Day 12</span>
              </div>

              {gauges.map((g, i) => (
                <GaugeBar key={g.label} gauge={g} visible={dashReveal.visible} delay={0.4 + i * 0.2} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bridge: Dashboard → Footer CTA ─── */}
      <Bridge from="#F5F2EE" to="#0A0A0A" />

      {/* ═══ FOOTER CTA ═══ */}
      <section ref={ctaReveal.ref} className="relative px-8 py-32 overflow-hidden" style={{ backgroundColor: '#000000' }}>
        {/* Radial gold glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{ width: 800, height: 400, background: 'radial-gradient(ellipse at center bottom, rgba(184,148,42,0.08), transparent 70%)' }} />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-8 flex items-center justify-center gap-6" style={{
            transition: `opacity 0.6s ${EASE}, transform 0.6s ${EASE}`,
            opacity: ctaReveal.visible ? 1 : 0,
          }}>
            <div style={{ height: 1, width: 40, backgroundColor: '#B8942A', transition: `transform 0.6s ${EASE} 0.2s`, transform: ctaReveal.visible ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'right' }} />
            <span className="text-primary" style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase' }}>Get Started</span>
            <div style={{ height: 1, width: 40, backgroundColor: '#B8942A', transition: `transform 0.6s ${EASE} 0.2s`, transform: ctaReveal.visible ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left' }} />
          </div>

          {/* Line 1: slides from left */}
          <h2 className="font-display" style={{
            fontSize: 'clamp(40px, 6vw, 80px)', fontWeight: 300, lineHeight: 0.95, letterSpacing: '-0.02em', color: '#F5F2EE',
            transition: `opacity 0.7s ${EASE} 0.2s, transform 0.7s ${EASE} 0.2s`,
            opacity: ctaReveal.visible ? 1 : 0,
            transform: ctaReveal.visible ? 'translateX(0)' : 'translateX(-60px)',
          }}>
            Trade with
          </h2>
          {/* Line 2: slides from right */}
          <h2 className="font-display" style={{
            fontSize: 'clamp(40px, 6vw, 80px)', fontWeight: 300, lineHeight: 0.95, letterSpacing: '-0.02em',
            transition: `opacity 0.7s ${EASE} 0.4s, transform 0.8s ${EASE} 0.4s`,
            opacity: ctaReveal.visible ? 1 : 0,
            transform: ctaReveal.visible ? 'translateX(0) scale(1)' : 'translateX(60px)',
          }}>
            <span className="text-primary italic" style={{
              display: 'inline-block',
              transition: `transform 0.6s ${EASE} 0.8s`,
              transform: ctaReveal.visible ? 'scale(1)' : 'scale(0.9)',
            }}>precision.</span>
          </h2>

          <p className="mx-auto mt-8 font-body" style={{
            maxWidth: 400, fontWeight: 300, color: 'rgba(245,242,238,0.45)', lineHeight: 1.7,
            transition: `opacity 0.7s ${EASE} 0.6s`,
            opacity: ctaReveal.visible ? 1 : 0,
          }}>
            Join thousands of prop firm traders who trust ARIA PropGuard to protect their accounts.
          </p>

          <div style={{ transition: `opacity 0.7s ${EASE} 0.8s`, opacity: ctaReveal.visible ? 1 : 0 }}>
            <Button variant="gold" size="lg" className="mt-12 px-12 text-xs" style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }} asChild>
              <Link to="/signup">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="px-8 py-8" style={{ backgroundColor: '#000000', borderTop: '0.5px solid rgba(245,242,238,0.06)' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="font-body" style={{ fontSize: 11, letterSpacing: '0.06em', color: 'rgba(245,242,238,0.3)' }}>© 2026 ARIA PropGuard. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="font-body text-[11px] tracking-wide text-[#F5F2EE]/30 hover:text-[#F5F2EE]/60 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="font-body text-[11px] tracking-wide text-[#F5F2EE]/30 hover:text-[#F5F2EE]/60 transition-colors">Terms of Service</Link>
            <span className="font-display text-primary" style={{ fontSize: 14, fontWeight: 300 }}>ARIA</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
