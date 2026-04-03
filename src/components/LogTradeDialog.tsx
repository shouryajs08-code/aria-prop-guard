import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const pairs = ['EUR/USD', 'GBP/USD', 'AUD/USD', 'XAU/USD', 'USD/JPY'];
const sessions = ['London', 'New York', 'Asian', 'Off-session'];

interface Props {
  accountId: string;
  onTradeLogged: () => void;
}

const LogTradeDialog = ({ accountId, onTradeLogged }: Props) => {
  const { user } = useAuth();
  const { canLogTrade, isPro, usage, incrementUsage } = useUsageLimits();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pair, setPair] = useState('');
  const [session, setSession] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [lotSize, setLotSize] = useState('0.01');

  const pnl = (() => {
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const lot = parseFloat(lotSize);
    if (isNaN(entry) || isNaN(exit) || isNaN(lot)) return null;
    const pipValue = pair === 'XAU/USD' ? 100 : pair === 'USD/JPY' ? 1000 : 100000;
    return parseFloat(((exit - entry) * lot * pipValue).toFixed(2));
  })();

  const rrRatio = (() => {
    if (pnl === null) return null;
    return Math.abs(pnl / 100);
  })();

  const handleSubmit = async () => {
    if (!user || !pair || !session || !entryPrice || !exitPrice) {
      toast.error('Fill all fields');
      return;
    }
    if (pnl === null) return;

    if (!canLogTrade) {
      toast.error('Daily trade log limit reached (5/day). Upgrade to Pro for unlimited.');
      return;
    }

    const allowed = await incrementUsage('trade_logs_count');
    if (!allowed) {
      toast.error('Daily limit reached. Upgrade to Pro for unlimited.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('trades').insert({
      user_id: user.id,
      account_id: accountId,
      pair,
      session,
      entry_price: parseFloat(entryPrice),
      exit_price: parseFloat(exitPrice),
      lot_size: parseFloat(lotSize),
      pnl,
      rr_ratio: rrRatio,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const { data: account } = await supabase
      .from('user_accounts')
      .select('current_profit, current_daily_loss')
      .eq('id', accountId)
      .maybeSingle();

    if (account) {
      const newDailyLoss = account.current_daily_loss + (pnl < 0 ? Math.abs(pnl) : 0);
      const updates: Record<string, number> = {
        current_profit: account.current_profit + (pnl > 0 ? pnl : 0),
      };
      if (pnl < 0) {
        updates.current_daily_loss = newDailyLoss;
      }
      await supabase.from('user_accounts').update(updates).eq('id', accountId);

      // Check breach thresholds and send Telegram alerts for Pro users
      if (isPro && pnl < 0) {
        const { data: fullAccount } = await supabase
          .from('user_accounts')
          .select('account_size, firm_id, telegram_chat_id')
          .eq('id', accountId)
          .maybeSingle();

        if (fullAccount && fullAccount.telegram_chat_id && fullAccount.firm_id) {
          const { data: firmData } = await supabase
            .from('prop_firms')
            .select('daily_loss_limit')
            .eq('id', fullAccount.firm_id)
            .maybeSingle();

          if (firmData) {
            const dailyLossLimit = fullAccount.account_size * firmData.daily_loss_limit / 100;
            const lossPct = (newDailyLoss / dailyLossLimit) * 100;
            const remaining = Math.max(0, dailyLossLimit - newDailyLoss).toFixed(2);

            const thresholds = [
              { pct: 95, msg: `🚨 <b>ARIA CRITICAL</b>\n95% of daily limit reached.\nONE more losing trade could breach your account. $${remaining} remaining.` },
              { pct: 85, msg: `🔴 <b>ARIA Alert</b>\nDaily loss at 85% — high risk.\nConsider stopping for today. $${remaining} remaining.` },
              { pct: 70, msg: `⚠️ <b>ARIA Alert</b>\nDaily loss at 70% of limit.\n$${remaining} remaining today. Trade carefully.` },
            ];

            for (const t of thresholds) {
              if (lossPct >= t.pct) {
                try {
                  await supabase.functions.invoke('send-telegram-alert', {
                    body: {
                      chat_id: fullAccount.telegram_chat_id,
                      text: t.msg,
                      user_id: user.id,
                      account_id: accountId,
                      alert_type: `daily_loss_${t.pct}`,
                      threshold_pct: t.pct,
                    },
                  });
                  toast.info(`Telegram alert sent (${t.pct}% threshold)`);
                } catch (e) {
                  console.error('Telegram alert failed:', e);
                }
                break;
              }
            }
          }
        }
      }
    }

    toast.success('Trade logged');
    setOpen(false);
    resetForm();
    onTradeLogged();
    setLoading(false);
  };

  const resetForm = () => {
    setPair('');
    setSession('');
    setEntryPrice('');
    setExitPrice('');
    setLotSize('0.01');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gold" size="sm">
          <Plus className="h-4 w-4 mr-1" /> Log Trade
          {!isPro && <span className="ml-1 text-[10px] opacity-60">({usage.trade_logs_count}/5)</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground">Log Trade</DialogTitle>
        </DialogHeader>
        {!canLogTrade ? (
          <div className="py-6 text-center">
            <p className="font-body text-sm text-muted-foreground mb-4">
              You've reached the daily limit of 5 trade logs.
            </p>
            <Link to="/pricing">
              <Button variant="gold">Upgrade to Pro</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground">Pair</label>
                <Select value={pair} onValueChange={setPair}>
                  <SelectTrigger className="mt-1 bg-background border-border"><SelectValue placeholder="Select pair" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {pairs.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground">Session</label>
                <Select value={session} onValueChange={setSession}>
                  <SelectTrigger className="mt-1 bg-background border-border"><SelectValue placeholder="Select session" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {sessions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground">Entry</label>
                <Input type="number" step="any" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} className="mt-1 bg-background border-border" />
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground">Exit</label>
                <Input type="number" step="any" value={exitPrice} onChange={e => setExitPrice(e.target.value)} className="mt-1 bg-background border-border" />
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground">Lot Size</label>
                <Input type="number" step="0.01" value={lotSize} onChange={e => setLotSize(e.target.value)} className="mt-1 bg-background border-border" />
              </div>
            </div>
            {pnl !== null && (
              <div className="rounded-lg border border-border bg-background p-3 font-body text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated P&L</span>
                  <span className={pnl >= 0 ? 'text-safe' : 'text-danger'}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}</span>
                </div>
              </div>
            )}
            <Button onClick={handleSubmit} disabled={loading} variant="gold" className="w-full">
              {loading ? 'Saving...' : 'Save Trade'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LogTradeDialog;
