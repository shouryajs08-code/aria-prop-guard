import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Bell, Brain, Database, BookOpen, TrendingUp } from 'lucide-react';

const features = [
  { icon: Shield, title: 'Real-Time Rule Monitor', desc: 'Instant alerts when you approach daily loss limits, drawdown thresholds, or violate prop firm rules.' },
  { icon: Bell, title: 'WhatsApp Alerts', desc: 'Get critical risk notifications delivered straight to your WhatsApp — never miss a warning.' },
  { icon: Brain, title: 'AI Trade Coach', desc: 'Personalized AI analysis of your trading patterns with actionable improvement suggestions.' },
  { icon: Database, title: 'Prop Firm Rules DB', desc: 'Complete database of rules across 2000+ prop firms, always updated and always accurate.' },
  { icon: BookOpen, title: 'Auto Trade Journal', desc: 'Every trade automatically logged with session, risk metrics, and compliance status.' },
  { icon: TrendingUp, title: 'Challenge Forecaster', desc: 'AI-powered predictions on your probability of passing based on current performance.' },
];

const stats = [
  { value: '90%', label: 'Traders Fail Challenges' },
  { value: '2,000+', label: 'Prop Firms Tracked' },
  { value: '$20B', label: 'Industry Size' },
  { value: '₹1,999/mo', label: 'Starting Price' },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="font-display text-xl font-semibold tracking-wide">
            <span className="text-primary">ARIA</span> <span className="text-foreground">PropGuard</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost-light" size="sm" asChild>
              <Link to="/login">Log In</Link>
            </Button>
            <Button variant="gold" size="sm" asChild>
              <Link to="/signup">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-display text-5xl font-light leading-tight tracking-tight md:text-7xl lg:text-8xl">
            Never breach<br />a rule <span className="text-primary">again.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-xl font-body text-lg text-muted-foreground">
            Real-time AI risk monitoring for prop firm challenges.
          </p>
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button variant="gold" size="lg" className="px-10 text-base" asChild>
              <Link to="/signup">Start Free Trial</Link>
            </Button>
            <Button variant="ghost-light" size="lg" className="px-10 text-base" asChild>
              <Link to="/dashboard">See Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 bg-card/50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border/50 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="px-6 py-10 text-center">
              <div className="font-display text-3xl font-semibold text-primary md:text-4xl">{s.value}</div>
              <div className="mt-2 font-body text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-28">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center font-display text-3xl font-light md:text-5xl">
            Built for <span className="text-primary">serious</span> traders
          </h2>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-lg border border-border/50 bg-card p-8 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <f.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-5 font-display text-xl font-medium">{f.title}</h3>
                <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border/50 px-6 py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-light md:text-5xl">
            Stop losing challenges.<br /><span className="text-primary">Start trading smarter.</span>
          </h2>
          <p className="mt-6 font-body text-muted-foreground">
            Join thousands of prop firm traders who trust ARIA PropGuard to protect their accounts.
          </p>
          <Button variant="gold" size="lg" className="mt-10 px-12 text-base" asChild>
            <Link to="/signup">Start Free Trial</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="font-body text-sm text-muted-foreground">© 2026 ARIA PropGuard. All rights reserved.</span>
          <span className="font-display text-sm text-primary">ARIA</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
