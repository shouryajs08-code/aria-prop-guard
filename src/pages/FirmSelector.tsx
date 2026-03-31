import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface PropFirm {
  id: string;
  name: string;
  daily_loss_limit: number;
  max_drawdown: number;
  profit_target: number;
  min_trading_days: number | null;
}

const FirmSelector = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [firms, setFirms] = useState<PropFirm[]>([]);
  const [selectedFirm, setSelectedFirm] = useState<string | null>(null);
  const [accountSize, setAccountSize] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkExisting = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('user_accounts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      if (data && data.length > 0) {
        navigate('/dashboard', { replace: true });
        return;
      }
      setChecking(false);
    };
    checkExisting();
  }, [user, navigate]);

  useEffect(() => {
    const fetchFirms = async () => {
      const { data } = await supabase.from('prop_firms').select('*');
      if (data) setFirms(data);
    };
    fetchFirms();
  }, []);

  const handleSubmit = async () => {
    if (!selectedFirm || !accountSize || !user) return;
    const size = parseFloat(accountSize);
    if (isNaN(size) || size <= 0) {
      toast.error('Enter a valid account size');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('user_accounts').insert({
      user_id: user.id,
      firm_id: selectedFirm,
      account_size: size,
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Create trial subscription if none exists
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (!existingSub || existingSub.length === 0) {
      await supabase.from('subscriptions').insert({
        user_id: user.id,
        plan: 'pro',
        status: 'trialing',
      });
    }

    navigate('/dashboard');
  };

  const selected = firms.find(f => f.id === selectedFirm);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-10">
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-primary">Setup Your Account</span>
          <h1 className="mt-4 font-display text-4xl font-light text-foreground">Choose Your Firm</h1>
          <p className="mt-3 font-body text-sm text-muted-foreground">Select the prop firm you're trading with</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {firms.map((firm) => (
            <button
              key={firm.id}
              onClick={() => setSelectedFirm(firm.id)}
              className={`rounded-lg border p-4 text-left transition-all ${
                selectedFirm === firm.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className="font-display text-lg text-foreground">{firm.name}</div>
              <div className="mt-2 space-y-1 font-body text-xs text-muted-foreground">
                <div>Daily Loss: <span className="text-danger">{firm.daily_loss_limit}%</span></div>
                <div>Max DD: <span className="text-danger">{firm.max_drawdown}%</span></div>
                <div>Target: <span className="text-safe">{firm.profit_target}%</span></div>
              </div>
            </button>
          ))}
        </div>

        {selected && (
          <div className="mt-8 space-y-4">
            <div>
              <label className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground">Account Size ($)</label>
              <Input
                type="number"
                placeholder="e.g. 100000"
                value={accountSize}
                onChange={(e) => setAccountSize(e.target.value)}
                className="mt-2 bg-card border-border text-foreground"
              />
            </div>
            <Button onClick={handleSubmit} disabled={loading} className="w-full" variant="gold">
              {loading ? 'Creating...' : `Start with ${selected.name}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FirmSelector;
