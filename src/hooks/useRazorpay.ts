import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function useRazorpay(onSuccess?: () => void) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const loadScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  };

  const openCheckout = async () => {
    if (!user) { navigate('/login'); return; }
    setProcessing(true);

    try {
      const loaded = await loadScript();
      if (!loaded) { toast.error('Failed to load payment gateway'); setProcessing(false); return; }

      const rzp = new window.Razorpay({
        key: 'rzp_live_SXuE6O1pxh4tlC',
        amount: 199900,
        currency: 'INR',
        name: 'ARIA PropGuard',
        description: 'Pro Monthly Subscription',
        image: '/logo.png',
        prefill: { email: user.email },
        theme: { color: '#B8942A' },
        handler: async (response: any) => {
          try {
            const { error } = await supabase
              .from('subscriptions')
              .upsert({
                user_id: user.id,
                status: 'active',
                plan: 'pro',
                razorpay_subscription_id: response.razorpay_payment_id,
              } as any, { onConflict: 'user_id' });

            if (error) {
              toast.error('Payment received but activation failed. Contact support.');
              setProcessing(false);
              return;
            }

            // Show success overlay
            setShowSuccess(true);
            onSuccess?.();

            // Auto-redirect after 2 seconds
            setTimeout(() => {
              setShowSuccess(false);
              window.location.href = '/dashboard';
            }, 2000);
          } catch {
            toast.error('Payment received but activation failed.');
            setProcessing(false);
          }
        },
        modal: { ondismiss: () => setProcessing(false) },
      });
      rzp.open();
    } catch {
      toast.error('Something went wrong');
      setProcessing(false);
    }
  };

  return { openCheckout, processing, showSuccess };
}
