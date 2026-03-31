import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

interface Usage {
  trade_logs_count: number;
  ai_analyses_count: number;
  pre_trade_count: number;
}

const FREE_LIMITS = {
  trade_logs: 5,
  ai_analyses: 3,
  pre_trade: 0, // Pro only
  accounts: 1,
};

const PRO_LIMITS = {
  trade_logs: Infinity,
  ai_analyses: Infinity,
  pre_trade: Infinity,
  accounts: 5,
};

export function useUsageLimits() {
  const { user } = useAuth();
  const { subscription, isActive } = useSubscription();
  const [usage, setUsage] = useState<Usage>({ trade_logs_count: 0, ai_analyses_count: 0, pre_trade_count: 0 });
  const [loading, setLoading] = useState(true);

  const isPro = subscription?.status === 'active' || (subscription?.status === 'pro');
  const limits = isPro ? PRO_LIMITS : FREE_LIMITS;

  const fetchUsage = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('usage_tracking')
      .select('trade_logs_count, ai_analyses_count, pre_trade_count')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (data) {
      setUsage(data as Usage);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchUsage(); }, [fetchUsage]);

  const incrementUsage = useCallback(async (field: 'trade_logs_count' | 'ai_analyses_count' | 'pre_trade_count') => {
    if (!user) return false;
    const today = new Date().toISOString().split('T')[0];

    // Check limit
    const limitKey = field.replace('_count', '') as keyof typeof limits;
    const currentCount = usage[field];
    if (!isPro && currentCount >= (limits as any)[limitKey]) {
      return false;
    }

    // Upsert
    const { data: existing } = await supabase
      .from('usage_tracking')
      .select('id, ' + field)
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('usage_tracking')
        .update({ [field]: (existing as any)[field] + 1 })
        .eq('id', (existing as any).id);
    } else {
      await supabase
        .from('usage_tracking')
        .insert({ user_id: user.id, date: today, [field]: 1 } as any);
    }

    setUsage(prev => ({ ...prev, [field]: prev[field] + 1 }));
    return true;
  }, [user, usage, isPro, limits]);

  const canLogTrade = isPro || usage.trade_logs_count < FREE_LIMITS.trade_logs;
  const canUseAI = isPro || usage.ai_analyses_count < FREE_LIMITS.ai_analyses;
  const canUsePreTrade = isPro;
  const maxAccounts = isPro ? PRO_LIMITS.accounts : FREE_LIMITS.accounts;

  return {
    usage,
    limits,
    isPro,
    loading,
    canLogTrade,
    canUseAI,
    canUsePreTrade,
    maxAccounts,
    incrementUsage,
    refetch: fetchUsage,
  };
}
