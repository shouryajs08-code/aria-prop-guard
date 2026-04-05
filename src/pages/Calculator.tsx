import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Calculator as CalcIcon } from 'lucide-react';

const PIP_VALUE = 10;

const Calculator = () => {
  const { user } = useAuth();
  const [accountSize, setAccountSize] = useState('100000');
  const [riskPct, setRiskPct] = useState([1]);
  const [slPips, setSlPips] = useState('20');
  const [dailyLossUsed, setDailyLossUsed] = useState(0);
  const [dailyLossLimit, setDailyLossLimit] = useState(5);
  const [acctSize, setAcctSize] = useState(100000);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_accounts')
      .select('account_size, current_daily_loss, firm_id')
      .eq('user_id', user.id)
      .limit(1)
      .then(async ({ data }) => {
        if (data?.[0]) {
          setAcctSize(data[0].account_size);
          setDailyLossUsed(data[0].current_daily_loss);
          if (data[0].firm_id) {
            const { data: firm } = await supabase
              .from('prop_firms')
              .select('daily_loss_limit')
              .eq('id', data[0].firm_id)
              .maybeSingle();
            if (firm) setDailyLossLimit(firm.daily_loss_limit);
          }
        }
      });
  }, [user]);

  const calc = useMemo(() => {
    const acct = parseFloat(accountSize);
    const risk = riskPct[0];
    const sl = parseFloat(slPips);
    if (!acct || !risk || !sl || sl <= 0) return null;
    const dollarRisk = (acct * risk) / 100;
    const lotSize = dollarRisk / (sl * PIP_VALUE);
    const pipValue = dollarRisk / sl;
    return {
      lotSize: Math.floor(lotSize * 100) / 100,
      dollarRisk,
      pipValue: pipValue.toFixed(2),
    };
  }, [accountSize, riskPct, slPips]);

  const dailyLimit = acctSize * dailyLossLimit / 100;
  const dailyRemaining = Math.max(0, dailyLimit - dailyLossUsed);
  const dailyPct = dailyLimit > 0 ? (dailyLossUsed / dailyLimit) * 100 : 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border px-4 sm:px-6 py-4">
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <CalcIcon className="h-5 w-5 text-primary" />
        <span className="font-display text-lg font-semibold tracking-wide">Calculator</span>
      </header>

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-lg space-y-6">
          {/* Position Size Calculator */}
          <div className="rounded-xl border border-border bg-card p-8">
            <h2 className="font-display text-2xl font-light text-foreground mb-1">Position Size</h2>
            <p className="font-body text-xs text-muted-foreground mb-6 opacity-50">
              (Account × Risk%) ÷ (SL pips × Pip value)
            </p>

            <div className="space-y-5">
              <div>
                <label className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground">Account Size ($)</label>
                <Input type="number" value={accountSize} onChange={(e) => setAccountSize(e.target.value)} className="mt-2 bg-background border-border" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground">Risk (%)</label>
                  <span className="font-display text-sm font-semibold text-primary">{riskPct[0]}%</span>
                </div>
                <Slider value={riskPct} onValueChange={setRiskPct} min={0.5} max={3} step={0.25} className="py-2" />
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground">Stop Loss (pips)</label>
                <Input type="number" value={slPips} onChange={(e) => setSlPips(e.target.value)} className="mt-2 bg-background border-border" />
              </div>
            </div>

            {calc && (
              <div className="mt-6 space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-5">
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-muted-foreground">Max Lot Size</span>
                  <span className="font-display text-2xl font-semibold text-primary">{calc.lotSize}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-muted-foreground">Max Dollar Risk</span>
                  <span className="font-display text-xl font-semibold text-foreground">${calc.dollarRisk.toFixed(2)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-muted-foreground">Pip Value</span>
                  <span className="font-display text-xl font-semibold text-foreground">${calc.pipValue}</span>
                </div>
              </div>
            )}
          </div>

          {/* Daily Loss Tracker */}
          <div className="rounded-xl border border-border bg-card p-8">
            <h2 className="font-display text-xl font-light text-foreground mb-4">Daily Loss Tracker</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-muted-foreground">Used Today</span>
                <span className="font-display text-lg font-semibold text-danger">${dailyLossUsed.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-muted-foreground">Remaining</span>
                <span className="font-display text-lg font-semibold text-safe">${dailyRemaining.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-muted-foreground">Limit ({dailyLossLimit}%)</span>
                <span className="font-display text-lg font-semibold text-foreground">${dailyLimit.toFixed(2)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${dailyPct > 85 ? 'bg-danger' : dailyPct > 50 ? 'bg-warning' : 'bg-safe'}`}
                  style={{ width: `${Math.min(dailyPct, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Calculator;
