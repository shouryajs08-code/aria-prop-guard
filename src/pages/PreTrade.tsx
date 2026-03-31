import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProBadge from '@/components/ProBadge';
import { ArrowLeft, Crosshair, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const pairs = ['EURUSD', 'GBPUSD', 'XAUUSD', 'AUDUSD', 'USDJPY'];
const sessions = ['London', 'New York', 'Asian'];

const PreTrade = () => {
  const { user } = useAuth();
  const { isPro, canUsePreTrade, incrementUsage } = useUsageLimits();
  const [pair, setPair] = useState('');
  const [session, setSession] = useState('');
  const [setup, setSetup] = useState('');
  const [entry, setEntry] = useState('');
  const [sl, setSl] = useState('');
  const [tp, setTp] = useState('');
  const [lots, setLots] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [accountSize, setAccountSize] = useState<number>(100000);
  const [dailyLossLimit, setDailyLossLimit] = useState<number>(5);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_accounts')
      .select('account_size, firm_id')
      .eq('user_id', user.id)
      .limit(1)
      .then(async ({ data }) => {
        if (data?.[0]) {
          setAccountSize(data[0].account_size);
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
    const e = parseFloat(entry);
    const s = parseFloat(sl);
    const t = parseFloat(tp);
    const l = parseFloat(lots);
    if (isNaN(e) || isNaN(s) || isNaN(t) || isNaN(l) || l <= 0) return null;

    const pipMultiplier = pair === 'XAUUSD' ? 100 : pair === 'USDJPY' ? 1000 : 100000;
    const slPips = Math.abs(e - s) * (pair === 'XAUUSD' ? 10 : pair === 'USDJPY' ? 100 : 10000);
    const tpPips = Math.abs(t - e) * (pair === 'XAUUSD' ? 10 : pair === 'USDJPY' ? 100 : 10000);
    const rr = slPips > 0 ? tpPips / slPips : 0;
    const dollarRisk = Math.abs(e - s) * l * pipMultiplier;
    const pctRisk = (dollarRisk / accountSize) * 100;
    const dailyLimit = accountSize * dailyLossLimit / 100;
    const violatesDaily = dollarRisk > dailyLimit;

    return { rr, dollarRisk, pctRisk, violatesDaily, slPips, tpPips };
  }, [entry, sl, tp, lots, pair, accountSize, dailyLossLimit]);

  const handleAnalyse = async () => {
    if (!canUsePreTrade) {
      toast.error('Pre-trade analysis is a Pro feature. Upgrade to access.');
      return;
    }
    if (!pair || !session || !setup.trim() || !entry || !sl || !tp || !lots) {
      toast.error('Fill all fields');
      return;
    }

    setLoading(true);
    setAnalysis(null);

    const allowed = await incrementUsage('pre_trade_count');
    if (!allowed) {
      toast.error('Daily limit reached. Upgrade to Pro for unlimited.');
      setLoading(false);
      return;
    }

    try {
      const prompt = `Pre-trade setup for ${pair} (${session} session):
Setup: ${setup}
Entry: ${entry}, SL: ${sl}, TP: ${tp}, Lots: ${lots}
R:R = ${calc?.rr.toFixed(2)}, Dollar risk = $${calc?.dollarRisk.toFixed(2)}, Account risk = ${calc?.pctRisk.toFixed(2)}%
Daily loss limit: ${dailyLossLimit}%, Violates: ${calc?.violatesDaily ? 'YES' : 'No'}`;

      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: {
          session_description: prompt,
          system_override: `Analyse this pre-trade setup for a prop firm trader.
Given their account rules and this setup, provide:
1. Setup quality score (1-10)
2. Key risks to watch
3. Whether to take the trade (Yes/Proceed with caution/No)
4. Optimal entry suggestion
Be direct, under 120 words.`,
        },
      });

      if (error) throw error;
      setAnalysis(data.analysis);
    } catch (e: any) {
      toast.error(e.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isPro) {
    return (
      <div className="min-h-screen bg-background">
        <header className="flex h-16 items-center gap-4 border-b border-border px-6">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Crosshair className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-semibold tracking-wide">Pre-Trade Analysis</span>
          <ProBadge />
        </header>
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <Lock className="h-16 w-16 text-primary/30 mb-6" />
          <h2 className="font-display text-2xl font-light text-foreground">Pro Feature</h2>
          <p className="mt-3 font-body text-sm text-muted-foreground max-w-sm">
            Get AI-powered pre-trade analysis to validate your setups before entering. Upgrade to Pro to unlock.
          </p>
          <Link to="/pricing">
            <Button variant="gold" className="mt-6">Upgrade to Pro</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-16 items-center gap-4 border-b border-border px-6">
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Crosshair className="h-5 w-5 text-primary" />
        <span className="font-display text-lg font-semibold tracking-wide">
          <span className="text-primary">ARIA</span> Pre-Trade Analysis
        </span>
      </header>

      <main className="mx-auto max-w-2xl p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground">Pair</label>
              <Select value={pair} onValueChange={setPair}>
                <SelectTrigger className="mt-1 bg-card border-border"><SelectValue placeholder="Select pair" /></SelectTrigger>
                <SelectContent>
                  {pairs.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground">Session</label>
              <Select value={session} onValueChange={setSession}>
                <SelectTrigger className="mt-1 bg-card border-border"><SelectValue placeholder="Select session" /></SelectTrigger>
                <SelectContent>
                  {sessions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground">Setup Description</label>
            <Textarea
              placeholder="Bullish FVG on 15m, CHoCH confirmed on 5m..."
              value={setup}
              onChange={(e) => setSetup(e.target.value)}
              rows={3}
              className="mt-1 border-border bg-card font-body text-sm"
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground">Entry</label>
              <Input type="number" step="any" value={entry} onChange={e => setEntry(e.target.value)} className="mt-1 bg-card border-border" />
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground">Stop Loss</label>
              <Input type="number" step="any" value={sl} onChange={e => setSl(e.target.value)} className="mt-1 bg-card border-border" />
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground">Take Profit</label>
              <Input type="number" step="any" value={tp} onChange={e => setTp(e.target.value)} className="mt-1 bg-card border-border" />
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground">Lots</label>
              <Input type="number" step="0.01" value={lots} onChange={e => setLots(e.target.value)} className="mt-1 bg-card border-border" />
            </div>
          </div>

          {/* Auto-calculated stats */}
          {calc && (
            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <span className="font-body text-[10px] uppercase text-muted-foreground">R:R</span>
                <div className="mt-1 font-display text-lg font-semibold text-primary">1:{calc.rr.toFixed(1)}</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <span className="font-body text-[10px] uppercase text-muted-foreground">$ Risk</span>
                <div className="mt-1 font-display text-lg font-semibold text-foreground">${calc.dollarRisk.toFixed(0)}</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <span className="font-body text-[10px] uppercase text-muted-foreground">% Risk</span>
                <div className={`mt-1 font-display text-lg font-semibold ${calc.pctRisk > 2 ? 'text-danger' : 'text-safe'}`}>{calc.pctRisk.toFixed(2)}%</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <span className="font-body text-[10px] uppercase text-muted-foreground">Daily Limit</span>
                <div className={`mt-1 font-display text-lg font-semibold ${calc.violatesDaily ? 'text-danger' : 'text-safe'}`}>
                  {calc.violatesDaily ? '⚠️ BREACH' : '✓ OK'}
                </div>
              </div>
            </div>
          )}

          <Button variant="gold" onClick={handleAnalyse} disabled={loading} className="w-full">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analysing...</> : 'Analyse Setup'}
          </Button>
        </div>

        {analysis && (
          <div className="mt-8 rounded-lg border border-border bg-card p-6 border-l-4 border-l-primary">
            <h2 className="mb-4 font-display text-lg font-semibold text-primary">ARIA's Pre-Trade Analysis</h2>
            <div className="prose prose-invert prose-sm max-w-none font-body text-foreground">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PreTrade;
