import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import ProBadge from '@/components/ProBadge';
import { ArrowLeft, TrendingUp, Brain, Crown, Target, Calendar, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface ForecastData {
  winRate: number;
  avgRR: number;
  currentProfitPct: number;
  daysRemaining: number;
  targetProfitPct: number;
  totalTrades: number;
  accountSize: number;
  currentProfit: number;
}

function calcForecast(d: ForecastData) {
  const expectedPerTrade = (d.winRate / 100) * d.avgRR - (1 - d.winRate / 100);
  const remainingPct = d.targetProfitPct - d.currentProfitPct;
  const tradesNeeded = expectedPerTrade > 0 ? Math.ceil(remainingPct / (expectedPerTrade * 0.5)) : 999;
  const tradesPerDay = d.totalTrades > 0 && d.daysRemaining > 0
    ? d.totalTrades / (30 - d.daysRemaining || 1)
    : 2;
  const daysToComplete = Math.ceil(tradesNeeded / Math.max(tradesPerDay, 1));
  const projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + daysToComplete);

  // Probability: simple model based on edge + time
  let prob = 0;
  if (expectedPerTrade > 0 && d.daysRemaining > 0) {
    const edgeFactor = Math.min(expectedPerTrade * 100, 40);
    const timeFactor = Math.min((d.daysRemaining / daysToComplete) * 40, 40);
    const progressFactor = Math.min((d.currentProfitPct / d.targetProfitPct) * 20, 20);
    prob = Math.min(Math.round(edgeFactor + timeFactor + progressFactor), 95);
  } else if (d.currentProfitPct >= d.targetProfitPct) {
    prob = 99;
  }

  let risk: 'Conservative' | 'Moderate' | 'Aggressive' = 'Moderate';
  if (tradesNeeded > d.daysRemaining * 3) risk = 'Aggressive';
  else if (tradesNeeded < d.daysRemaining) risk = 'Conservative';

  return { prob, tradesNeeded, daysToComplete, projectedDate, risk, expectedPerTrade };
}

const Forecaster = () => {
  const { user } = useAuth();
  const { isPro } = useUsageLimits();
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: accounts } = await supabase
        .from('user_accounts')
        .select('account_size, challenge_day, current_profit, firm_id')
        .eq('user_id', user.id)
        .limit(1);

      if (!accounts?.[0]) { setLoading(false); return; }
      const acct = accounts[0];

      let targetPct = 10;
      if (acct.firm_id) {
        const { data: firm } = await supabase
          .from('prop_firms')
          .select('profit_target')
          .eq('id', acct.firm_id)
          .maybeSingle();
        if (firm) targetPct = firm.profit_target;
      }

      const { data: trades } = await supabase
        .from('trades')
        .select('pnl, rr_ratio')
        .eq('user_id', user.id);

      const totalTrades = trades?.length || 0;
      const wins = trades?.filter(t => t.pnl > 0).length || 0;
      const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 50;
      const avgRR = totalTrades > 0
        ? (trades!.reduce((s, t) => s + (t.rr_ratio ?? 0), 0) / totalTrades)
        : 1;

      setData({
        winRate,
        avgRR,
        currentProfitPct: acct.account_size > 0 ? (acct.current_profit / acct.account_size) * 100 : 0,
        daysRemaining: Math.max(0, 30 - acct.challenge_day),
        targetProfitPct: targetPct,
        totalTrades,
        accountSize: acct.account_size,
        currentProfit: acct.current_profit,
      });
      setLoading(false);
    };
    fetch();
  }, [user]);

  const analyseWithAI = useCallback(async () => {
    if (!data) return;
    setAiLoading(true);
    try {
      const forecast = calcForecast(data);
      const { data: res, error } = await supabase.functions.invoke('ai-coach', {
        body: {
          session_description: `Challenge Forecaster Analysis Request:
Win Rate: ${data.winRate.toFixed(1)}%
Average RR: ${data.avgRR.toFixed(2)}
Current Profit: ${data.currentProfitPct.toFixed(2)}% of ${data.targetProfitPct}% target
Days Remaining: ${data.daysRemaining}
Total Trades: ${data.totalTrades}
Account Size: $${data.accountSize.toLocaleString()}
Probability of Passing: ${forecast.prob}%
Trades Needed: ${forecast.tradesNeeded}
Risk Level: ${forecast.risk}

Provide specific, actionable advice on how to pass this challenge. Include lot size recommendations, session timing, and risk management tips. Be direct and concise.`
        }
      });
      if (error) throw error;
      setAiAnalysis(res?.analysis || 'Unable to generate analysis.');
    } catch (e) {
      console.error(e);
      toast.error('AI analysis failed');
    }
    setAiLoading(false);
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex items-center gap-3 border-b border-border px-6 py-4">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="h-4 w-4" /></Link>
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-semibold tracking-wide">Challenge Forecaster</span>
          <ProBadge />
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center space-y-4">
            <TrendingUp className="h-16 w-16 text-muted-foreground/30 mx-auto" />
            <p className="font-body text-muted-foreground">Challenge Forecaster is a Pro feature.</p>
            <Link to="/pricing"><Button variant="gold"><Crown className="h-4 w-4 mr-1" /> Upgrade to Pro</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const forecast = calcForecast(data);
  const progressPct = Math.min((data.currentProfitPct / data.targetProfitPct) * 100, 100);
  const probColor = forecast.prob >= 60 ? 'text-safe' : forecast.prob >= 35 ? 'text-primary' : 'text-danger';
  const riskColor = forecast.risk === 'Conservative' ? 'text-safe' : forecast.risk === 'Moderate' ? 'text-primary' : 'text-danger';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border px-6 py-4">
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="h-4 w-4" /></Link>
        <TrendingUp className="h-5 w-5 text-primary" />
        <span className="font-display text-lg font-semibold tracking-wide">Challenge Forecaster</span>
      </header>

      <main className="flex-1 p-4 sm:p-6">
        {/* Stats grid */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-3.5 w-3.5 text-primary" />
              <span className="font-body text-xs text-muted-foreground">Pass Probability</span>
            </div>
            <div className={`font-display text-3xl font-semibold ${probColor}`}>{forecast.prob}%</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              <span className="font-body text-xs text-muted-foreground">Trades Needed</span>
            </div>
            <div className="font-display text-3xl font-semibold text-foreground">{forecast.tradesNeeded}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span className="font-body text-xs text-muted-foreground">Projected Date</span>
            </div>
            <div className="font-display text-lg font-semibold text-foreground">{forecast.projectedDate.toLocaleDateString()}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="font-body text-xs text-muted-foreground">Risk Score</span>
            </div>
            <div className={`font-display text-xl font-semibold ${riskColor}`}>{forecast.risk}</div>
          </div>
        </div>

        {/* Progress visualization */}
        <div className="mb-6 rounded-lg border border-border bg-card p-5 sm:p-6">
          <h2 className="font-display text-lg font-light mb-4">Profit Progress</h2>
          <div className="relative mb-2">
            <div className="h-4 rounded-full bg-muted overflow-hidden">
              {/* Safe zone background */}
              <div className="absolute inset-y-0 left-0 bg-safe/10 rounded-l-full" style={{ width: '70%' }} />
              {/* Danger zone */}
              <div className="absolute inset-y-0 right-0 bg-danger/10 rounded-r-full" style={{ width: '30%' }} />
              {/* Current progress */}
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-primary to-safe transition-all duration-1000"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between font-body text-xs text-muted-foreground">
            <span>Current: {data.currentProfitPct.toFixed(2)}%</span>
            <span className="text-primary">Target: {data.targetProfitPct}%</span>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <span className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">Win Rate</span>
              <div className="font-display text-xl font-semibold text-foreground">{data.winRate.toFixed(1)}%</div>
            </div>
            <div>
              <span className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">Avg RR</span>
              <div className="font-display text-xl font-semibold text-foreground">{data.avgRR.toFixed(2)}</div>
            </div>
            <div>
              <span className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">Days Left</span>
              <div className="font-display text-xl font-semibold text-foreground">{data.daysRemaining}</div>
            </div>
            <div>
              <span className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">Total Trades</span>
              <div className="font-display text-xl font-semibold text-foreground">{data.totalTrades}</div>
            </div>
          </div>

          {/* Zone indicators */}
          <div className="mt-4 flex gap-4 font-body text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-safe" /> Safe Zone (0-70%)</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Caution (70-85%)</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger" /> Danger (&gt;85%)</span>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <span className="font-display text-lg font-light">AI Challenge Analysis</span>
            </div>
            <Button variant="gold" size="sm" onClick={analyseWithAI} disabled={aiLoading}>
              <Brain className="h-3.5 w-3.5 mr-1" />
              {aiLoading ? 'Analysing...' : 'Analyse My Progress'}
            </Button>
          </div>
          {aiLoading && (
            <div className="flex items-center gap-3 py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="font-body text-sm text-muted-foreground">Analysing your challenge data...</span>
            </div>
          )}
          {aiAnalysis && !aiLoading && (
            <div className="prose prose-sm prose-invert max-w-none font-body text-sm text-foreground/90 leading-relaxed">
              <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
            </div>
          )}
          {!aiAnalysis && !aiLoading && (
            <p className="font-body text-sm text-muted-foreground">Click "Analyse My Progress" to get AI-powered advice on your challenge strategy.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Forecaster;
