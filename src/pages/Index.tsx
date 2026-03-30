import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Bell, Brain, Database, BookOpen, TrendingUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const features = [
  { icon: Shield, title: 'Real-Time Rule Monitor', desc: 'Instant alerts when you approach daily loss limits, drawdown thresholds, or violate prop firm rules.', tag: 'Risk Engine' },
  { icon: Bell, title: 'WhatsApp Alerts', desc: 'Get critical risk notifications delivered straight to your WhatsApp — never miss a warning.', tag: 'Notifications' },
  { icon: Brain, title: 'AI Trade Coach', desc: 'Personalized AI analysis of your trading patterns with actionable improvement suggestions.', tag: 'Intelligence' },
  { icon: Database, title: 'Prop Firm Rules DB', desc: 'Complete database of rules across 2000+ prop firms, always updated and always accurate.', tag: 'Database' },
  { icon: BookOpen, title: 'Auto Trade Journal', desc: 'Every trade automatically logged with session, risk metrics, and compliance status.', tag: 'Journaling' },
  { icon: TrendingUp, title: 'Challenge Forecaster', desc: 'AI-powered predictions on your probability of passing based on current performance.', tag: 'Forecasting' },
];

const stats = [
  { value: '90', unit: '%', label: 'Traders Fail Challenges' },
  { value: '2,000', unit: '+', label: 'Prop Firms Tracked' },
  { value: '$20', unit: 'B', label: 'Industry Size' },
  { value: '₹1,999', unit: '/mo', label: 'Starting Price' },
];

/* ─── Intersection Observer hook ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ─── Custom cursor ─── */
function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    let mx = 0, my = 0, rx = 0, ry = 0;
    const move = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };

    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('a, button, [role="button"]')) setHovering(true);
    };
    const out = () => setHovering(false);

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', over);
    window.addEventListener('mouseout', out);

    let raf: number;
    const loop = () => {
      if (dot.current) {
        dot.current.style.transform = `translate(${mx}px, ${my}px)`;
      }
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      if (ring.current) {
        ring.current.style.transform = `translate(${rx}px, ${ry}px)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', over);
      window.removeEventListener('mouseout', out);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div
        ref={dot}
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full bg-primary transition-[width,height] duration-200"
        style={{
          width: hovering ? 16 : 8,
          height: hovering ? 16 : 8,
          marginLeft: hovering ? -8 : -4,
          marginTop: hovering ? -8 : -4,
        }}
      />
      <div
        ref={ring}
        className="pointer-events-none fixed top-0 left-0 z-[9998] rounded-full border border-primary/40 transition-[width,height] duration-300"
        style={{
          width: hovering ? 48 : 32,
          height: hovering ? 48 : 32,
          marginLeft: hovering ? -24 : -16,
          marginTop: hovering ? -24 : -16,
        }}
      />
    </>
  );
}

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);
  const statsReveal = useReveal();
  const featuresReveal = useReveal();
  const ctaReveal = useReveal();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-background cursor-none">
      <CustomCursor />

      {/* ─── Nav ─── */}
      <nav
        className="fixed top-0 z-50 w-full transition-all duration-500"
        style={{
          backgroundColor: scrolled ? 'hsla(30,25%,95%,0.04)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '0.5px solid hsla(30,25%,95%,0.08)' : '0.5px solid transparent',
        }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-8">
          <Link to="/" className="font-display text-xl" style={{ fontWeight: 300 }}>
            <span className="text-primary">ARIA</span>{' '}
            <span className="text-foreground">PropGuard</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            {['Features', 'Pricing', 'About'].map((l) => (
              <span
                key={l}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' as const, fontFamily: '"DM Sans"' }}
              >
                {l}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost-light" size="sm" asChild className="text-xs" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
              <Link to="/login">Log In</Link>
            </Button>
            <Button variant="gold" size="sm" asChild className="text-xs" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
              <Link to="/signup">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative flex h-screen flex-col items-center justify-center px-8 overflow-hidden" style={{ backgroundColor: '#0A0A0A' }}>
        {/* Animated grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(hsla(30,25%,95%,1) 1px, transparent 1px), linear-gradient(90deg, hsla(30,25%,95%,1) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          {/* Eyebrow */}
          <p
            className="text-primary animate-[heroFadeUp_0.8s_ease-out_0.3s_both]"
            style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' as const, fontFamily: '"DM Sans"', fontWeight: 500 }}
          >
            AI Risk Intelligence Platform
          </p>

          {/* Headline */}
          <h1
            className="mt-8 font-display animate-[heroFadeUp_0.8s_ease-out_0.5s_both]"
            style={{ fontSize: 'clamp(56px, 8vw, 90px)', fontWeight: 300, lineHeight: 0.95, letterSpacing: '-0.02em' }}
          >
            Never breach<br />a rule <span className="text-primary italic">again.</span>
          </h1>

          {/* Body */}
          <p
            className="mx-auto mt-8 font-body animate-[heroFadeUp_0.8s_ease-out_0.7s_both]"
            style={{ maxWidth: 400, opacity: 0.55, fontWeight: 300, fontSize: 16, lineHeight: 1.7 }}
          >
            Real-time AI risk monitoring for prop firm challenges. Protect your capital with institutional-grade intelligence.
          </p>

          {/* Buttons */}
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-[heroFadeUp_0.8s_ease-out_0.9s_both]">
            <Button variant="gold" size="lg" className="px-10 text-xs" style={{ letterSpacing: '0.1em', textTransform: 'uppercase' as const }} asChild>
              <Link to="/signup">Start Free Trial</Link>
            </Button>
            <Button variant="ghost-light" size="lg" className="px-10 text-xs" style={{ letterSpacing: '0.1em', textTransform: 'uppercase' as const }} asChild>
              <Link to="/dashboard">See Dashboard</Link>
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 right-10 flex flex-col items-center gap-3">
          <span className="text-muted-foreground" style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase' as const, writingMode: 'vertical-rl' }}>
            Scroll
          </span>
          <div className="w-px bg-primary animate-pulse-gold" style={{ height: 60 }} />
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section
        ref={statsReveal.ref}
        className="border-y"
        style={{ backgroundColor: '#1C1C1C', borderColor: 'hsla(30,25%,95%,0.06)' }}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="px-8 py-12 text-center transition-all duration-700"
              style={{
                borderRight: i < stats.length - 1 ? '0.5px solid hsla(30,25%,95%,0.06)' : 'none',
                opacity: statsReveal.visible ? 1 : 0,
                transform: statsReveal.visible ? 'translateY(0)' : 'translateY(30px)',
                transitionDelay: `${i * 100}ms`,
              }}
            >
              <div className="font-display" style={{ fontSize: 42, fontWeight: 300, lineHeight: 1 }}>
                <span className="text-foreground">{s.value}</span>
                <span className="text-primary" style={{ fontSize: 24 }}>{s.unit}</span>
              </div>
              <div className="mt-3 font-body text-muted-foreground" style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="px-8 py-32" ref={featuresReveal.ref} style={{ backgroundColor: '#111111' }}>
        <div className="mx-auto max-w-7xl">
          {/* Section label */}
          <div
            className="mb-6 flex items-center gap-6 transition-all duration-700"
            style={{
              opacity: featuresReveal.visible ? 1 : 0,
              transform: featuresReveal.visible ? 'translateY(0)' : 'translateY(30px)',
            }}
          >
            <div className="h-px w-10 bg-primary" />
            <span className="text-primary" style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase' as const }}>
              Capabilities
            </span>
          </div>

          <h2
            className="font-display mb-16 transition-all duration-700"
            style={{
              fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, lineHeight: 1.1,
              opacity: featuresReveal.visible ? 1 : 0,
              transform: featuresReveal.visible ? 'translateY(0)' : 'translateY(30px)',
              transitionDelay: '100ms',
            }}
          >
            Built for <span className="text-primary italic">serious</span> traders
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3" style={{ border: '0.5px solid hsla(30,25%,95%,0.06)' }}>
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group p-8 transition-all duration-500 hover:bg-[hsla(30,25%,95%,0.02)]"
                style={{
                  borderRight: (i % 3 !== 2) ? '0.5px solid hsla(30,25%,95%,0.06)' : 'none',
                  borderBottom: i < 3 ? '0.5px solid hsla(30,25%,95%,0.06)' : 'none',
                  opacity: featuresReveal.visible ? 1 : 0,
                  transform: featuresReveal.visible ? 'translateY(0)' : 'translateY(30px)',
                  transitionDelay: `${(i + 2) * 100}ms`,
                }}
              >
                <span className="font-display text-primary/40" style={{ fontSize: 14 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 font-display" style={{ fontSize: 22, fontWeight: 400 }}>
                  {f.title}
                </h3>
                <p className="mt-3 font-body" style={{ fontSize: 14, fontWeight: 300, opacity: 0.55, lineHeight: 1.7 }}>
                  {f.desc}
                </p>
                <div className="mt-6">
                  <span
                    className="text-primary border-b border-primary/30 pb-0.5"
                    style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' as const }}
                  >
                    {f.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer CTA ─── */}
      <section
        ref={ctaReveal.ref}
        className="relative px-8 py-32 overflow-hidden"
        style={{ backgroundColor: '#0A0A0A' }}
      >
        {/* Radial gold glow */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: 800,
            height: 400,
            background: 'radial-gradient(ellipse at center bottom, hsla(42,64%,44%,0.06), transparent 70%)',
          }}
        />

        <div
          className="relative z-10 mx-auto max-w-3xl text-center transition-all duration-700"
          style={{
            opacity: ctaReveal.visible ? 1 : 0,
            transform: ctaReveal.visible ? 'translateY(0)' : 'translateY(30px)',
          }}
        >
          <div className="mx-auto mb-8 flex items-center justify-center gap-6">
            <div className="h-px w-10 bg-primary" />
            <span className="text-primary" style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase' as const }}>
              Get Started
            </span>
            <div className="h-px w-10 bg-primary" />
          </div>

          <h2
            className="font-display"
            style={{ fontSize: 'clamp(40px, 6vw, 80px)', fontWeight: 300, lineHeight: 0.95, letterSpacing: '-0.02em' }}
          >
            Stop losing challenges.<br />
            <span className="text-primary italic">Start trading smarter.</span>
          </h2>
          <p className="mx-auto mt-8 font-body text-muted-foreground" style={{ maxWidth: 400, fontWeight: 300, opacity: 0.55, lineHeight: 1.7 }}>
            Join thousands of prop firm traders who trust ARIA PropGuard to protect their accounts.
          </p>
          <Button
            variant="gold" size="lg"
            className="mt-12 px-12 text-xs"
            style={{ letterSpacing: '0.1em', textTransform: 'uppercase' as const }}
            asChild
          >
            <Link to="/signup">Start Free Trial</Link>
          </Button>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="px-8 py-8" style={{ borderTop: '0.5px solid hsla(30,25%,95%,0.06)' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="font-body text-muted-foreground" style={{ fontSize: 11, letterSpacing: '0.06em' }}>
            © 2026 ARIA PropGuard. All rights reserved.
          </span>
          <span className="font-display text-primary" style={{ fontSize: 14, fontWeight: 300 }}>ARIA</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
