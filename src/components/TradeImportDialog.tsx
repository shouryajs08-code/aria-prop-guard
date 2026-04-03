import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FileUp, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onImported: () => void;
}

function detectSession(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const h = d.getUTCHours();
    if (h >= 0 && h < 8) return 'Asian';
    if (h >= 7 && h < 16) return 'London';
    if (h >= 12 && h < 21) return 'New York';
    return 'Off-session';
  } catch {
    return 'Off-session';
  }
}

function parseCSV(text: string): string[][] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  return lines.map(l => l.split(/[,;\t]/).map(c => c.replace(/^"|"$/g, '').trim()));
}

function parseHTM(html: string): string[][] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const rows = doc.querySelectorAll('tr');
  const result: string[][] = [];
  rows.forEach(row => {
    const cells: string[] = [];
    row.querySelectorAll('td, th').forEach(cell => {
      cells.push((cell.textContent || '').trim());
    });
    if (cells.length > 0) result.push(cells);
  });
  return result;
}

interface ParsedTrade {
  pair: string;
  session: string;
  entry_price: number;
  exit_price: number;
  lot_size: number;
  pnl: number;
  rr_ratio: number | null;
  created_at: string;
  rule_compliant: boolean;
}

const TradeImportDialog = ({ onImported }: Props) => {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ total: number; violations: number } | null>(null);

  const processFile = async (file: File) => {
    if (!user) return;
    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      let rows: string[][];

      if (file.name.endsWith('.htm') || file.name.endsWith('.html')) {
        rows = parseHTM(text);
      } else {
        rows = parseCSV(text);
      }

      if (rows.length < 2) {
        toast.error('File appears empty or invalid');
        setImporting(false);
        return;
      }

      // Find header row - look for 'Ticket' or 'Order' or 'Profit'
      let headerIdx = rows.findIndex(r =>
        r.some(c => /ticket|order/i.test(c)) && r.some(c => /profit/i.test(c))
      );
      if (headerIdx === -1) headerIdx = 0;

      const headers = rows[headerIdx].map(h => h.toLowerCase());
      const dataRows = rows.slice(headerIdx + 1);

      // Map columns
      const getIdx = (keywords: string[]) =>
        headers.findIndex(h => keywords.some(k => h.includes(k)));

      const typeIdx = getIdx(['type']);
      const sizeIdx = getIdx(['size', 'volume', 'lots']);
      const itemIdx = getIdx(['item', 'symbol', 'pair']);
      const openTimeIdx = getIdx(['open time', 'open date']);
      const openPriceIdx = (() => {
        // First "price" column
        const priceIndices = headers.reduce<number[]>((acc, h, i) => {
          if (h.includes('price')) acc.push(i);
          return acc;
        }, []);
        return priceIndices[0] ?? -1;
      })();
      const closePriceIdx = (() => {
        const priceIndices = headers.reduce<number[]>((acc, h, i) => {
          if (h.includes('price')) acc.push(i);
          return acc;
        }, []);
        return priceIndices.length > 1 ? priceIndices[1] : priceIndices[0] ?? -1;
      })();
      const profitIdx = getIdx(['profit']);

      // Get user account for rule compliance check
      const { data: accounts } = await supabase
        .from('user_accounts')
        .select('id, account_size, firm_id')
        .eq('user_id', user.id)
        .limit(1);

      const account = accounts?.[0];
      let firmLimits: { daily_loss_limit: number } | null = null;
      if (account?.firm_id) {
        const { data } = await supabase
          .from('prop_firms')
          .select('daily_loss_limit')
          .eq('id', account.firm_id)
          .maybeSingle();
        firmLimits = data;
      }

      const trades: ParsedTrade[] = [];
      let violations = 0;

      for (const row of dataRows) {
        if (row.length < 5) continue;

        // Only process buy/sell trades
        const tradeType = typeIdx >= 0 ? row[typeIdx]?.toLowerCase() : '';
        if (tradeType && !tradeType.includes('buy') && !tradeType.includes('sell')) continue;

        const pair = itemIdx >= 0 ? row[itemIdx] : '';
        if (!pair || pair.length < 3) continue;

        const entryPrice = parseFloat(row[openPriceIdx] || '0');
        const exitPrice = parseFloat(row[closePriceIdx] || '0');
        const lotSize = sizeIdx >= 0 ? parseFloat(row[sizeIdx] || '0.01') : 0.01;
        const pnl = profitIdx >= 0 ? parseFloat(row[profitIdx] || '0') : 0;
        const openTime = openTimeIdx >= 0 ? row[openTimeIdx] : '';

        if (isNaN(entryPrice) || isNaN(exitPrice) || entryPrice === 0) continue;

        const session = detectSession(openTime);
        const rr = pnl !== 0 ? Math.abs(pnl / (lotSize * 100)) : null;

        // Rule compliance: check if single trade loss > daily limit
        let compliant = true;
        if (firmLimits && account && pnl < 0) {
          const maxDailyLoss = account.account_size * firmLimits.daily_loss_limit / 100;
          if (Math.abs(pnl) > maxDailyLoss * 0.5) {
            compliant = false;
            violations++;
          }
        }

        trades.push({
          pair: pair.replace(/[^A-Za-z/]/g, '').toUpperCase(),
          session,
          entry_price: entryPrice,
          exit_price: exitPrice,
          lot_size: lotSize,
          pnl,
          rr_ratio: rr ? parseFloat(rr.toFixed(2)) : null,
          created_at: openTime ? new Date(openTime).toISOString() : new Date().toISOString(),
          rule_compliant: compliant,
        });
      }

      if (trades.length === 0) {
        toast.error('No valid trades found in file');
        setImporting(false);
        return;
      }

      // Batch insert
      const batchSize = 50;
      for (let i = 0; i < trades.length; i += batchSize) {
        const batch = trades.slice(i, i + batchSize).map(t => ({
          user_id: user.id,
          account_id: account?.id || null,
          ...t,
        }));
        const { error } = await supabase.from('trades').insert(batch);
        if (error) {
          console.error('Import batch error:', error);
          toast.error(`Import error: ${error.message}`);
        }
      }

      setResult({ total: trades.length, violations });
      toast.success(`${trades.length} trades imported!`);
      onImported();
    } catch (e) {
      console.error('Import failed:', e);
      toast.error('Failed to parse file');
    }
    setImporting(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setResult(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-border text-muted-foreground hover:text-foreground">
          <Upload className="h-3.5 w-3.5" /> Import MT4/MT5
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground">Import Trade History</DialogTitle>
        </DialogHeader>
        {result ? (
          <div className="py-6 space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-safe/30 bg-safe/5 p-4">
              <Check className="h-5 w-5 text-safe" />
              <div>
                <p className="font-body text-sm font-medium text-foreground">{result.total} trades imported</p>
                <p className="font-body text-xs text-muted-foreground">Successfully added to your journal</p>
              </div>
            </div>
            {result.violations > 0 && (
              <div className="flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/5 p-4">
                <AlertTriangle className="h-5 w-5 text-danger" />
                <div>
                  <p className="font-body text-sm font-medium text-foreground">{result.violations} rule violations found</p>
                  <p className="font-body text-xs text-muted-foreground">Trades exceeding 50% of daily loss limit</p>
                </div>
              </div>
            )}
            <Button variant="gold" className="w-full" onClick={() => { setOpen(false); setResult(null); }}>Done</Button>
          </div>
        ) : (
          <div className="py-6 space-y-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <FileUp className="h-10 w-10 text-muted-foreground" />
              <div className="text-center">
                <p className="font-body text-sm font-medium text-foreground">
                  {importing ? 'Importing...' : 'Click to upload'}
                </p>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  Supports .csv and .htm from MT4/MT5 history export
                </p>
              </div>
              {importing && (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.htm,.html"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) processFile(f);
                e.target.value = '';
              }}
            />
            <div className="rounded-md border border-border bg-background p-3">
              <p className="font-body text-xs text-muted-foreground mb-1 font-medium">Expected columns:</p>
              <p className="font-body text-[10px] text-muted-foreground">
                Ticket, Open Time, Type, Size, Item, Price, S/L, T/P, Close Time, Price, Commission, Swap, Profit
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TradeImportDialog;
