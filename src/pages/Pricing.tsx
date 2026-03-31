import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Check, Shield, ArrowLeft, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const proFeatures = [
  'Unlimited Rule Monitoring',
  'WhatsApp Alerts',
  'AI Coach (10 analyses/month)',
  'Up to 3 Prop Firm Accounts',
  'Auto Trade Journal',
  'Challenge Forecaster',
];

const trialFeatures = [
  { text: 'Full dashboard access', included: true },
  { text: 'AI Coach (limited)', included: true },
  { text: '1 Prop Firm Account', included: true },
  { text: 'WhatsApp Alerts', included: false },
  { text: 'Multiple accounts', included: false },
  { text: 'Priority support', included: false },
];

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Pricing = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async () => {
    if (!user || !session) {
      navigate('/signup');
      return;
    }

    setProcessing(true);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { toast.error('Failed to load payment gateway'); setProcessing(false); return; }

      const { data, error } = await supabase.functions.invoke('razorpay', {
        body: { action: 'create_order' },
      });

      if (error || !data?.order_id) {
        toast.error('Could not create payment order');
        setProcessing(false);
        return;
      }

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: 'INR',
        name: 'ARIA PropGuard',
        description: 'PropGuard Pro — Monthly Subscription',
        order_id: data.order_id,
        handler: async (response: any) => {
          const { error: verifyErr } = await supabase.functions.invoke('razorpay', {
            body: {
              action: 'verify_payment',
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
          });

          if (verifyErr) {
            toast.error('Payment verification failed');
          } else {
            toast.success('Subscription activated!');
            navigate('/dashboard');
          }
          setProcessing(false);
        },
        prefill: { email: user.email },
        theme: { color: '#B8942A' },
        modal: { ondismiss: () => setProcessing(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      toast.error('Something went wrong');
      setProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: '#0A0A0A' }}>
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
