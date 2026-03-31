import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, ArrowLeft, Search } from 'lucide-react';

interface Trade {
  id: string;
  pair: string;
  session: string | null;
  entry_price: number;
  exit_price: number;
  pnl: number;
  rr_ratio: number | null;
  lot_size: number;
  created_at: string;
}

const Journal = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPair, setFilterPair] = useState('');
  const [filterSession, setFilterSession] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchTrades = async () => {
      const { data } = await supabase
        .from('trades')
        .select('id, pair, session, entry_price, exit_price, pnl, rr_ratio, lot_size, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setTrades(data);
      setLoading(false);
    };
    fetchTrades();
  }, [user]);

  const filtered = trades.filter((t) => {
    if (filterPair && !t.pair.toLowerCase().includes(filterPair.toLowerCase())) return false;
    if (filterSession !== 'all' && t.session !== filterSession) return false;
    if (filterDate && !t.created_at.startsWith(filterDate)) return false;
    return true;
  });

  const totalPnl = filtered.reduce((s, t) => s + t.pnl, 0);
  const winRate = filtered.length > 0
    ? ((filtered.filter(t => t.pnl > 0).length / filtered.length) * 100).toFixed(0)
    : '0';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-semibold tracking-wide">Trade Journal</span>
        </div>
      </header>

      <main className="flex-1 p-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <span className="font-body text-xs text-muted-foreground">Total Trades</span>
            <div className="mt-1 font-display text-2xl font-semibold text-foreground">{filtered.length}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <span className="font-body text-xs text-muted-foreground">Net P&L</span>
            <div className={`mt-1 font-display text-2xl font-semibold ${totalPnl >= 0 ? 'text-safe' : 'text-danger'}`}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <span className="font-body text-xs text-muted-foreground">Win Rate</span>
            <div className="mt-1 font-display text-2xl font-semibold text-primary">{winRate}%</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter by pair..."
              value={filterPair}
              onChange={(e) => setFilterPair(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <Select value={filterSession} onValueChange={setFilterSession}>
            <SelectTrigger className="w-[140px] bg-card border-border">
              <SelectValue placeholder="Session" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              <SelectItem value="London">London</SelectItem>
              <SelectItem value="New York">New York</SelectItem>
              <SelectItem value="Asia">Asia</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-[160px] bg-card border-border"
          />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pair</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Session</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Entry → Exit</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Lot Size</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">RR</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">P&L</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No trades found.</td></tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-card/50">
                    <td className="px-4 py-3 text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium">{t.pair}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.session ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.entry_price} → {t.exit_price}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.lot_size}</td>
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
      </main>
    </div>
  );
};

export default Journal;
