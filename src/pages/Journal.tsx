import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, ArrowLeft, Search, Download } from 'lucide-react';
import TradeImportDialog from '@/components/TradeImportDialog';

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
  const avgRR = filtered.length > 0
    ? (filtered.reduce((s, t) => s + (t.rr_ratio ?? 0), 0) / filtered.length).toFixed(1)
    : '0';

  const exportCSV = () => {
    const headers = ['Date', 'Pair', 'Session', 'Entry', 'Exit', 'Lot Size', 'RR', 'P&L'];
    const rows = filtered.map(t => [
      new Date(t.created_at).toLocaleDateString(),
      t.pair,
      t.session ?? '',
      t.entry_price,
      t.exit_price,
      t.lot_size,
      t.rr_ratio?.toFixed(1) ?? '',
      t.pnl.toFixed(2),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-journal-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-display text-base sm:text-lg font-semibold tracking-wide">Trade Journal</span>
        </div>
        <div className="flex items-center gap-2">
          <TradeImportDialog onImported={() => window.location.reload()} />
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 border-border text-muted-foreground hover:text-foreground">
            <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
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
          <div className="rounded-lg border border-border bg-card p-4">
            <span className="font-body text-xs text-muted-foreground">Avg RR</span>
            <div className="mt-1 font-display text-2xl font-semibold text-primary">{avgRR}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Filter by pair..." value={filterPair} onChange={(e) => setFilterPair(e.target.value)} className="pl-9 bg-card border-border" />
          </div>
          <Select value={filterSession} onValueChange={setFilterSession}>
            <SelectTrigger className="w-full sm:w-[140px] bg-card border-border"><SelectValue placeholder="Session" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              <SelectItem value="London">London</SelectItem>
              <SelectItem value="New York">New York</SelectItem>
              <SelectItem value="Asian">Asian</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full sm:w-[160px] bg-card border-border" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] font-body text-sm">
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
