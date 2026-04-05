import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Wallet, Plus, CircleDot, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface Account {
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
  id: string;
  name: string;
  daily_loss_limit: number;
  max_drawdown: number;
  profit_target: number;
}

const Accounts = () => {
  const { user } = useAuth();
  const { isPro, maxAccounts } = useUsageLimits();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [firms, setFirms] = useState<PropFirm[]>([]);
  const [firmMap, setFirmMap] = useState<Record<string, PropFirm>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState('');
  const [accountSize, setAccountSize] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const [{ data: accts }, { data: firmData }] = await Promise.all([
      supabase.from('user_accounts').select('*').eq('user_id', user.id),
      supabase.from('prop_firms').select('*'),
    ]);
    if (accts) setAccounts(accts);
    if (firmData) {
      setFirms(firmData);
      const map: Record<string, PropFirm> = {};
      firmData.forEach((f) => { map[f.id] = f; });
      setFirmMap(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCreate = async () => {
    if (!user || !selectedFirm || !accountSize) return;
    if (accounts.length >= maxAccounts) {
      toast.error(isPro ? 'Maximum 5 accounts on Pro plan' : 'Free users can only have 1 account. Upgrade to Pro for up to 5.');
      return;
    }
    setCreating(true);
    const { error } = await supabase.from('user_accounts').insert({
      user_id: user.id,
      firm_id: selectedFirm,
      account_size: parseFloat(accountSize),
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Account added');
      setOpen(false);
      setSelectedFirm('');
      setAccountSize('');
      fetchData();
    }
    setCreating(false);
  };

  const atLimit = accounts.length >= maxAccounts;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Wallet className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-semibold tracking-wide">Accounts</span>
          <span className="font-body text-xs text-muted-foreground">{accounts.length}/{maxAccounts}</span>
        </div>
        {atLimit && !isPro ? (
          <Link to="/pricing">
            <Button variant="gold" size="sm" className="gap-1.5">
              <Crown className="h-3.5 w-3.5" /> Upgrade for more
            </Button>
          </Link>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" size="sm" className="gap-1.5" disabled={atLimit}>
                <Plus className="h-4 w-4" /> Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-display text-foreground">Add Prop Firm Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground">Prop Firm</label>
                  <Select value={selectedFirm} onValueChange={setSelectedFirm}>
                    <SelectTrigger className="mt-2 bg-background border-border"><SelectValue placeholder="Select firm" /></SelectTrigger>
                    <SelectContent>
                      {firms.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground">Account Size ($)</label>
                  <Input type="number" placeholder="e.g. 100000" value={accountSize} onChange={(e) => setAccountSize(e.target.value)} className="mt-2 bg-background border-border" />
                </div>
                <Button onClick={handleCreate} disabled={creating || !selectedFirm || !accountSize} variant="gold" className="w-full">
                  {creating ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </header>

      <main className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="font-body text-muted-foreground">No accounts yet. Add your first prop firm account.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((a) => {
              const f = a.firm_id ? firmMap[a.firm_id] : null;
              return (
                <div key={a.id} className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg text-foreground">{f?.name ?? 'Unknown Firm'}</span>
                    <span className="flex items-center gap-1.5 rounded-full bg-safe/10 px-2 py-0.5 font-body text-xs text-safe capitalize">
                      <CircleDot className="h-2.5 w-2.5" /> {a.status}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2 font-body text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Account Size</span>
                      <span className="text-foreground">${a.account_size.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Challenge Day</span>
                      <span className="text-primary">{a.challenge_day} / 30</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current P&L</span>
                      <span className={a.current_profit >= 0 ? 'text-safe' : 'text-danger'}>
                        {a.current_profit >= 0 ? '+' : ''}${a.current_profit.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Daily Loss</span>
                      <span className="text-danger">${a.current_daily_loss.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Drawdown</span>
                      <span className="text-danger">${a.current_drawdown.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Accounts;
