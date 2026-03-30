import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, BookOpen, Brain, Wallet, Bell, Calculator,
  LogOut, ChevronLeft, ChevronRight, CircleDot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: BookOpen, label: 'Journal', href: '/dashboard' },
  { icon: Brain, label: 'AI Coach', href: '/dashboard' },
  { icon: Wallet, label: 'Accounts', href: '/dashboard' },
  { icon: Bell, label: 'Alerts', href: '/dashboard' },
  { icon: Calculator, label: 'Calculator', href: '/dashboard' },
];

const mockTrades = [
  { pair: 'EUR/USD', session: 'London', entry: '1.0845', exit: '1.0872', rr: '2.1', pnl: '+$270' },
  { pair: 'GBP/JPY', session: 'Tokyo', entry: '188.42', exit: '188.15', rr: '1.5', pnl: '-$180' },
  { pair: 'XAU/USD', session: 'New York', entry: '2,342', exit: '2,358', rr: '3.2', pnl: '+$480' },
  { pair: 'NAS100', session: 'New York', entry: '18,245', exit: '18,312', rr: '2.8', pnl: '+$402' },
  { pair: 'USD/CAD', session: 'London', entry: '1.3612', exit: '1.3598', rr: '1.1', pnl: '+$85' },
];

const alerts = [
  { type: 'warning', msg: 'Daily loss at 3.2% — approaching 5% limit' },
  { type: 'info', msg: 'Drawdown recovered from 6.1% to 4.8%' },
  { type: 'success', msg: 'Day 7 target on track — $1,240 profit' },
];

function RiskGauge({ label, value, limit, unit }: { label: string; value: number; limit: string; unit: string }) {
  const color = value > 85 ? 'bg-danger' : value > 50 ? 'bg-warning' : 'bg-safe';
  const textColor = value > 85 ? 'text-danger' : value > 50 ? 'text-primary' : 'text-safe';

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <span className="font-body text-sm text-muted-foreground">{label}</span>
        <span className="font-body text-xs text-muted-foreground">Limit: {limit}</span>
      </div>
      <div className={`mt-3 font-display text-4xl font-semibold ${textColor}`}>
        {value}{unit}
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`flex flex-col border-r border-border bg-card transition-all ${collapsed ? 'w-16' : 'w-56'}`}>
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!collapsed && (
            <span className="font-display text-sm font-semibold tracking-wide">
              <span className="text-primary">ARIA</span>
            </span>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="text-muted-foreground hover:text-foreground">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 font-body text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-2">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 font-body text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        {/* Top nav */}
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
            <span className="font-body text-sm text-muted-foreground">{user?.email}</span>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Center content */}
          <main className="flex-1 overflow-y-auto p-6">
            {/* Account info */}
            <div className="mb-8">
              <h1 className="font-display text-2xl font-light">FTMO Challenge</h1>
              <div className="mt-2 flex items-center gap-4 font-body text-sm text-muted-foreground">
                <span>Account Size: <span className="text-foreground">$100,000</span></span>
                <span className="text-border">|</span>
                <span>Challenge Day: <span className="text-primary">7 / 30</span></span>
              </div>
            </div>

            {/* Risk gauges */}
            <div className="grid gap-4 md:grid-cols-3">
              <RiskGauge label="Daily Loss Used" value={32} limit="5% ($5,000)" unit="%" />
              <RiskGauge label="Max Drawdown" value={48} limit="10% ($10,000)" unit="%" />
              <RiskGauge label="Profit Target" value={62} limit="10% ($10,000)" unit="%" />
            </div>

            {/* Trade log */}
            <div className="mt-8">
              <h2 className="font-display text-xl font-light">Today's Trades</h2>
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
                    {mockTrades.map((t, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-card/50">
                        <td className="px-4 py-3 font-medium">{t.pair}</td>
                        <td className="px-4 py-3 text-muted-foreground">{t.session}</td>
                        <td className="px-4 py-3 text-muted-foreground">{t.entry} → {t.exit}</td>
                        <td className="px-4 py-3 text-primary">{t.rr}</td>
                        <td className={`px-4 py-3 text-right font-medium ${t.pnl.startsWith('+') ? 'text-safe' : 'text-danger'}`}>{t.pnl}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>

          {/* Right panel */}
          <aside className="hidden w-80 border-l border-border p-6 lg:block">
            <h3 className="font-display text-lg font-medium">Risk Alerts</h3>
            <div className="mt-4 space-y-3">
              {alerts.map((a, i) => (
                <div
                  key={i}
                  className={`rounded-md border p-3 font-body text-sm ${
                    a.type === 'warning' ? 'border-warning/30 bg-warning/5 text-warning' :
                    a.type === 'success' ? 'border-safe/30 bg-safe/5 text-safe' :
                    'border-border bg-card text-muted-foreground'
                  }`}
                >
                  {a.msg}
                </div>
              ))}
            </div>

            <div className="mt-8">
              <h3 className="font-display text-lg font-medium">ARIA AI Coach</h3>
              <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="font-body text-sm leading-relaxed text-foreground">
                  "Your win rate improved 12% this week. Consider reducing lot size on GBP pairs — 
                  your drawdown spikes correlate with high-volatility JPY crosses during Tokyo session."
                </p>
                <span className="mt-3 block font-body text-xs text-primary">ARIA AI • Just now</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
