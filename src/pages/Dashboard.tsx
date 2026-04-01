import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useRazorpay } from '@/hooks/useRazorpay';
import { supabase } from '@/integrations/supabase/client';
import LogTradeDialog from '@/components/LogTradeDialog';
import UsageMeter from '@/components/UsageMeter';
import UpgradeCTA from '@/components/UpgradeCTA';
import ProSuccessOverlay from '@/components/ProSuccessOverlay';
import { toast } from 'sonner';
import {
  LayoutDashboard, BookOpen, Brain, Wallet, Bell, Calculator,
  LogOut, ChevronLeft, ChevronRight, CircleDot, Clock, Crosshair
} from 'lucide-react';

interface UserAccount {
  id: string;
  account_size: number;
  challenge_day: number;
  current_daily_loss: number;
  current_drawdown: number;
  current_profit: number;
  status: string;
  firm_id: string | null;
}

interface PropFirm {
  name: string;
  daily_loss_limit: number;
  max_drawdown: number;
  profit_target: number;
}

interface Trade {
  id: string;
  pair: string;
  session: string | null;
  entry_price: number;
  exit_price: number;
  pnl: number;
  rr_ratio: number | null;
  created_at: string;
}

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: BookOpen, label: 'Journal', href: '/journal' },
  { icon: Crosshair, label: 'Pre-Trade', href: '/pre-trade', pro: true },
  { icon: Brain, label: 'AI Coach', href: '/ai-coach' },
  { icon: Wallet, label: 'Accounts', href: '/accounts' },
  { icon: Bell, label: 'Alerts', href: '/alerts' },
  { icon: Calculator, label: 'Calculator', href: '/calculator' },
];

function RiskGauge({ label, value, limit, unit }: { label: string; value: number; limit: string; unit: string }) {
  const pct = Math.min(value, 100);
  const color = pct > 85 ? 'bg-danger' : pct > 50 ? 'bg-warning' : 'bg-safe';
  const textColor = pct > 85 ? 'text-danger' : pct > 50 ? 'text-primary' : 'text-safe';

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <span className="font-body text-sm text-muted-foreground">{label}</span>
        <span className="font-body text-xs text-muted-foreground">Limit: {limit}</span>
      </div>
      <div className={`mt-3 font-display text-4xl font-semibold ${textColor}`}>
        {value.toFixed(1)}{unit}
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { subscription } = useSubscription();
  const { isPro, usage } = useUsageLimits();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [firm, setFirm] = useState<PropFirm | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const { openCheckout, processing: upgrading, showSuccess } = useRazorpay();

  const fetchData = useCallback(async () => {
    if (!user) return;

    const { data: accounts } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);

    if (!accounts || accounts.length === 0) {
      navigate('/select-firm', { replace: true });
      return;
    }

    const acct = accounts[0];
    setAccount(acct);

    if (acct.firm_id) {
      const { data: firmData } = await supabase
        .from('prop_firms')
        .select('name, daily_loss_limit, max_drawdown, profit_target')
        .eq('id', acct.firm_id)
        .maybeSingle();
      if (firmData) setFirm(firmData);
    }

    const { data: tradeData } = await supabase
      .from('trades')
      .select('id, pair, session, entry_price, exit_price, pnl, rr_ratio, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (tradeData) setTrades(tradeData);

    setLoading(false);
  }, [user, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!account) return null;

  const dailyLossPct = firm ? (account.current_daily_loss / (account.account_size * firm.daily_loss_limit / 100)) * 100 : 0;
  const drawdownPct = firm ? (account.current_drawdown / (account.account_size * firm.max_drawdown / 100)) * 100 : 0;
  const profitPct = firm ? (account.current_profit / (account.account_size * firm.profit_target / 100)) * 100 : 0;

  const isTrialing = subscription?.status === 'trialing';
  const daysLeft = isTrialing
    ? Math.max(0, Math.ceil((new Date(subscription!.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <div className="flex min-h-screen bg-background">
      {showSuccess && <ProSuccessOverlay />}
      {/* Sidebar */}
      <aside className={`flex flex-col border-r border-border bg-card transition-all ${collapsed ? 'w-16' : 'w-56'}`}>
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!collapsed && (
            <span className="font-display text-sm font-semibold tracking-wide text-primary">ARIA</span>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="text-muted-foreground hover:text-foreground">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {sidebarItems.map((item) => (
            <Link key={item.label} to={item.href} className="flex items-center gap-3 rounded-md px-3 py-2.5 font-body text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <span className="flex items-center gap-2">
                  {item.label}
                  {item.pro && !isPro && (
                    <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">PRO</span>
                  )}
                </span>
              )}
            </Link>
          ))}
        </nav>
        {!isPro && (
          <div className="border-t border-border p-2">
            <UpgradeCTA collapsed={collapsed} />
          </div>
        )}
        <div className="border-t border-border p-2">
          <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 font-body text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-3">
            <span className="font-display text-lg font-semibold tracking-wide">
              <span className="text-primary">ARIA</span> PropGuard
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-safe/10 px-2.5 py-1 font-body text-xs text-safe">
              <CircleDot className="h-2.5 w-2.5 animate-pulse-gold" /> Live
            </span>
          </div>
          <div className="flex items-center gap-4">
            <LogTradeDialog accountId={account.id} onTradeLogged={fetchData} />
            <span className="font-body text-sm text-muted-foreground">{user?.email}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Trial / Upgrade banner */}
          {!isPro && (
            <div className="mb-6 flex items-center justify-between rounded-lg border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <span className="font-body text-sm text-primary font-medium">
                  {isTrialing
                    ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in free trial — Upgrade to Pro`
                    : 'Upgrade to Pro for unlimited access'}
                </span>
              </div>
              <button onClick={openCheckout} disabled={upgrading} className="rounded-md bg-primary px-4 py-1.5 font-body text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">{upgrading ? 'Processing...' : 'Upgrade now'}</button>
            </div>
          )}

          {/* Usage meters (free users) */}
          {!isPro && (
            <div className="mb-6 grid grid-cols-3 gap-4">
              <UsageMeter label="Trade Logs" used={usage.trade_logs_count} max={5} isPro={false} />
              <UsageMeter label="AI Analyses" used={usage.ai_analyses_count} max={3} isPro={false} />
              <UsageMeter label="Pre-Trade" used={usage.pre_trade_count} max={0} isPro={false} />
            </div>
          )}

          {/* Account info */}
          <div className="mb-8">
            <h1 className="font-display text-2xl font-light">{firm?.name ?? 'Challenge'}</h1>
            <div className="mt-2 flex items-center gap-4 font-body text-sm text-muted-foreground">
              <span>Account Size: <span className="text-foreground">${account.account_size.toLocaleString()}</span></span>
              <span className="text-border">|</span>
              <span>Challenge Day: <span className="text-primary">{account.challenge_day} / 30</span></span>
              <span className="text-border">|</span>
              <span>Status: <span className="text-safe capitalize">{account.status}</span></span>
            </div>
          </div>

          {/* Risk gauges */}
          <div className="grid gap-4 md:grid-cols-3">
            <RiskGauge
              label="Daily Loss Used"
              value={dailyLossPct}
              limit={`${firm?.daily_loss_limit ?? 5}% ($${((account.account_size * (firm?.daily_loss_limit ?? 5)) / 100).toLocaleString()})`}
              unit="%"
            />
            <RiskGauge
              label="Max Drawdown"
              value={drawdownPct}
              limit={`${firm?.max_drawdown ?? 10}% ($${((account.account_size * (firm?.max_drawdown ?? 10)) / 100).toLocaleString()})`}
              unit="%"
            />
            <RiskGauge
              label="Profit Target"
              value={profitPct}
              limit={`${firm?.profit_target ?? 10}% ($${((account.account_size * (firm?.profit_target ?? 10)) / 100).toLocaleString()})`}
              unit="%"
            />
          </div>

          {/* Trade log */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-light">Recent Trades</h2>
              <span className="font-body text-xs text-muted-foreground">{trades.length} trades</span>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-border">
              <table className="w-full font-body text-sm">
                <thead>
                  <tr className="border-b border-border bg-card">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pair</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Session</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Entry → Exit</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">RR</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No trades yet. Click "Log Trade" to add your first trade.
                      </td>
                    </tr>
                  ) : (
                    trades.map((t) => (
                      <tr key={t.id} className="border-b border-border/50 hover:bg-card/50">
                        <td className="px-4 py-3 font-medium">{t.pair}</td>
                        <td className="px-4 py-3 text-muted-foreground">{t.session ?? '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{t.entry_price} → {t.exit_price}</td>
                        <td className="px-4 py-3 text-primary">{t.rr_ratio?.toFixed(1) ?? '—'}</td>
                        <td className={`px-4 py-3 text-right font-medium ${t.pnl >= 0 ? 'text-safe' : 'text-danger'}`}>
                          {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
