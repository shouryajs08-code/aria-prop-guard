import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const pairs = ['EUR/USD', 'GBP/USD', 'AUD/USD', 'XAU/USD', 'USD/JPY'];
const sessions = ['London', 'New York', 'Asian', 'Off-session'];

interface Props {
  accountId: string;
  onTradeLogged: () => void;
}

const LogTradeDialog = ({ accountId, onTradeLogged }: Props) => {
  const { user } = useAuth();
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
    // Simplified P&L: (exit - entry) * lot * 100000 for forex, adjust for gold
    const pipValue = pair === 'XAU/USD' ? 100 : pair === 'USD/JPY' ? 1000 : 100000;
    return parseFloat(((exit - entry) * lot * pipValue).toFixed(2));
  })();

  const rrRatio = (() => {
    if (pnl === null) return null;
    // Simple RR based on absolute P&L ratio (placeholder)
    return Math.abs(pnl / 100);
  })();

  const handleSubmit = async () => {
    if (!user || !pair || !session || !entryPrice || !exitPrice) {
      toast.error('Fill all fields');
      return;
    }
    if (pnl === null) return;

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

    // Update user_accounts
    const { data: account } = await supabase
      .from('user_accounts')
      .select('current_profit, current_daily_loss')
      .eq('id', accountId)
      .maybeSingle();

    if (account) {
      const updates: Record<string, number> = {
        current_profit: account.current_profit + (pnl > 0 ? pnl : 0),
      };
      if (pnl < 0) {
        updates.current_daily_loss = account.current_daily_loss + Math.abs(pnl);
      }
      await supabase.from('user_accounts').update(updates).eq('id', accountId);
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
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground">Log Trade</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground">Pair</label>
              <Select value={pair} onValueChange={setPair}>
                <SelectTrigger className="mt-1 bg-background border-border">
                  <SelectValue placeholder="Select pair" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {pairs.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground">Session</label>
              <Select value={session} onValueChange={setSession}>
                <SelectTrigger className="mt-1 bg-background border-border">
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
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
              {rrRatio !== null && (
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">RR Ratio</span>
                  <span className="text-primary">{rrRatio.toFixed(1)}</span>
                </div>
              )}
            </div>
          )}
          <Button onClick={handleSubmit} disabled={loading} variant="gold" className="w-full">
            {loading ? 'Saving...' : 'Save Trade'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LogTradeDialog;
