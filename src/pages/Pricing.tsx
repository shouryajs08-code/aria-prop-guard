import { Check, Shield, ArrowLeft, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRazorpay } from '@/hooks/useRazorpay';
import { Button } from '@/components/ui/button';
import ProSuccessOverlay from '@/components/ProSuccessOverlay';

const proFeatures = [
  'Unlimited Rule Monitoring',
  'WhatsApp Alerts',
  'AI Coach (unlimited)',
  'Up to 3 Prop Firm Accounts',
  'Auto Trade Journal',
  'Challenge Forecaster',
  'Pre-Trade Analysis',
];

const trialFeatures = [
  { text: 'Full dashboard access', included: true },
  { text: 'AI Coach (3/day)', included: true },
  { text: '1 Prop Firm Account', included: true },
  { text: 'WhatsApp Alerts', included: false },
  { text: 'Multiple accounts', included: false },
  { text: 'Pre-Trade Analysis', included: false },
];

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openCheckout, processing, showSuccess } = useRazorpay();

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: '#0A0A0A' }}>
      {showSuccess && <ProSuccessOverlay />}
      <header className="flex items-center justify-between px-8 py-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span className="font-display text-sm font-semibold tracking-wide">
          <span className="text-primary">ARIA</span> PropGuard
        </span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
        <div className="mb-6 flex items-center gap-4">
          <div className="h-px w-10 bg-primary" />
          <span className="font-body text-[10px] uppercase tracking-[0.22em] text-primary">Pricing</span>
          <div className="h-px w-10 bg-primary" />
        </div>

        <h1 className="font-display text-5xl font-light text-foreground text-center leading-tight md:text-6xl">
          Choose Your Plan
        </h1>
        <p className="mt-4 max-w-md text-center font-body text-sm text-muted-foreground" style={{ opacity: 0.55 }}>
          Start free, upgrade when you're ready to dominate your challenge.
        </p>

        <div className="mt-12 grid w-full max-w-3xl gap-6 md:grid-cols-2">
          {/* Free Trial Card */}
          <div className="rounded-xl border border-border bg-card p-8">
            <span className="font-body text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Free Trial</span>
            <h2 className="mt-4 font-display text-2xl font-light text-foreground">7-Day Trial</h2>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-4xl font-semibold text-foreground">₹0</span>
              <span className="font-body text-sm text-muted-foreground">/7 days</span>
            </div>
            <div className="my-6 h-px w-full bg-border" />
            <ul className="space-y-3">
              {trialFeatures.map((f) => (
                <li key={f.text} className="flex items-center gap-3 font-body text-sm text-foreground" style={{ opacity: f.included ? 0.75 : 0.35 }}>
                  {f.included ? (
                    <Check className="h-4 w-4 shrink-0 text-safe" />
                  ) : (
                    <X className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  {f.text}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-center font-body text-xs text-muted-foreground" style={{ opacity: 0.4 }}>
              Automatically starts on signup
            </p>
          </div>

          {/* Pro Card */}
          <div className="rounded-xl border border-primary/30 bg-card p-8 relative overflow-hidden">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, hsl(42 64% 44%), transparent)' }} />
            <div className="absolute top-4 right-4 rounded-full bg-primary px-2.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
              Recommended
            </div>
            <div className="relative">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-body text-[10px] uppercase tracking-[0.22em] text-primary">Pro Plan</span>
              </div>
              <h2 className="mt-4 font-display text-2xl font-light text-foreground">ARIA PropGuard Pro</h2>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-semibold text-foreground">₹1,999</span>
                <span className="font-body text-sm text-muted-foreground">/month</span>
              </div>
              <div className="my-6 h-px w-full bg-border" />
              <ul className="space-y-3">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3 font-body text-sm text-foreground" style={{ opacity: 0.75 }}>
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={handleSubscribe}
                disabled={processing}
                variant="gold"
                size="lg"
                className="mt-8 w-full text-base"
              >
                {processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : 'Subscribe Now'}
              </Button>
              <p className="mt-4 text-center font-body text-xs text-muted-foreground" style={{ opacity: 0.4 }}>
                Cancel anytime. Billed monthly.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
