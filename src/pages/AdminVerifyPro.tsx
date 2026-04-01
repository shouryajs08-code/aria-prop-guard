import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

const ADMIN_EMAIL = 'shouryajs08@gmail.com';

interface SubData {
  id: string;
  status: string;
  plan: string;
  trial_ends_at: string;
  razorpay_subscription_id: string | null;
  created_at: string;
}

interface UsageData {
  trade_logs_count: number;
  ai_analyses_count: number;
  pre_trade_count: number;
  date: string;
}

const AdminVerifyPro = () => {
  const { user } = useAuth();
  const [sub, setSub] = useState<SubData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const fetchData = async () => {
    if (!user) return;
    const [{ data: subData }, { data: usageData }] = await Promise.all([
      supabase.from('subscriptions').select('*').eq('user_id', user.id).limit(1),
      supabase.from('usage_tracking').select('*').eq('user_id', user.id).eq('date', new Date().toISOString().split('T')[0]).maybeSingle(),
    ]);
    setSub(subData?.[0] as SubData ?? null);
    setUsage(usageData as UsageData ?? null);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchData();
    else setLoading(false);
  }, [user, isAdmin]);

  if (!user || !isAdmin) return <Navigate to="/dashboard" replace />;

  const grantPro = async () => {
    setGranting(true);
    const { error } = await supabase.from('subscriptions').upsert({
      user_id: user.id, status: 'active', plan: 'pro', razorpay_subscription_id: 'admin_grant',
    } as any, { onConflict: 'user_id' });
    if (error) toast.error('Failed: ' + error.message);
    else { toast.success('Pro access granted!'); fetchData(); }
    setGranting(false);
  };

  const revokePro = async () => {
    const { error } = await supabase.from('subscriptions').upsert({
      user_id: user.id, status: 'trialing', plan: 'free', razorpay_subscription_id: null,
    } as any, { onConflict: 'user_id' });
    if (error) toast.error('Failed');
    else { toast.success('Revoked to free'); fetchData(); }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  const isPro = sub?.status === 'active' && sub?.plan === 'pro';

  return (
    <div className="min-h-screen bg-background p-6">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-semibold">Admin: Verify Pro</h1>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 space-y-3">
          <h2 className="font-body text-sm font-medium text-muted-foreground uppercase tracking-wider">Subscription</h2>
          <div className="space-y-2 font-body text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={isPro ? 'text-safe' : 'text-warning'}>{sub?.status ?? 'None'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span>{sub?.plan ?? 'None'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Trial Ends</span><span>{sub?.trial_ends_at ? new Date(sub.trial_ends_at).toLocaleDateString() : '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Payment ID</span><span className="truncate max-w-[200px]">{sub?.razorpay_subscription_id ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">isPro</span><span className={isPro ? 'text-safe' : 'text-danger'}>{isPro ? 'YES' : 'NO'}</span></div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 space-y-3">
          <h2 className="font-body text-sm font-medium text-muted-foreground uppercase tracking-wider">Today's Usage</h2>
          <div className="space-y-2 font-body text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Trade Logs</span><span>{usage?.trade_logs_count ?? 0} / {isPro ? '∞' : '5'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">AI Analyses</span><span>{usage?.ai_analyses_count ?? 0} / {isPro ? '∞' : '3'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pre-Trade</span><span>{usage?.pre_trade_count ?? 0} / {isPro ? '∞' : '0'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Accounts</span><span>{isPro ? '5' : '1'}</span></div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="gold" onClick={grantPro} disabled={granting || isPro} className="flex-1">
            {granting ? 'Granting...' : isPro ? 'Already Pro' : 'Grant Pro Access'}
          </Button>
          {isPro && (
            <Button variant="outline" onClick={revokePro} className="flex-1 border-danger text-danger hover:bg-danger/10">
              Revoke Pro
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminVerifyPro;
