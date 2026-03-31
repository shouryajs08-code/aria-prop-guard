import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Subscription {
  id: string;
  plan: string;
  status: string;
  trial_ends_at: string;
  razorpay_subscription_id: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);
      
      if (data && data.length > 0) {
        setSubscription(data[0] as Subscription);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const isActive = (): boolean => {
    if (!subscription) return false;
    if (subscription.status === 'active') return true;
    if (subscription.status === 'trialing') {
      return new Date(subscription.trial_ends_at) > new Date();
    }
    return false;
  };

  const isTrialExpired = (): boolean => {
    if (!subscription) return false;
    if (subscription.status === 'trialing') {
      return new Date(subscription.trial_ends_at) <= new Date();
    }
    return false;
  };

  return { subscription, loading, isActive, isTrialExpired };
}
