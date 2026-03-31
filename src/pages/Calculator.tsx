import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calculator as CalcIcon } from 'lucide-react';

const PIP_VALUE = 10; // standard pip value per lot for most forex pairs

const Calculator = () => {
  const [accountSize, setAccountSize] = useState('');
  const [riskPct, setRiskPct] = useState('');
  const [slPips, setSlPips] = useState('');
  const [result, setResult] = useState<{ lotSize: number; dollarRisk: number } | null>(null);

  const calculate = () => {
    const acct = parseFloat(accountSize);
    const risk = parseFloat(riskPct);
    const sl = parseFloat(slPips);
    if (!acct || !risk || !sl || sl <= 0) return;

    const dollarRisk = (acct * risk) / 100;
    const lotSize = dollarRisk / (sl * PIP_VALUE);

    setResult({ lotSize: Math.floor(lotSize * 100) / 100, dollarRisk });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border px-6 py-4">
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <CalcIcon className="h-5 w-5 text-primary" />
        <span className="font-display text-lg font-semibold tracking-wide">Position Size Calculator</span>
      </header>

      <main className="flex flex-1 items-start justify-center p-6 pt-16">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-border bg-card p-8">
            <h2 className="font-display text-2xl font-light text-foreground mb-6">Calculate Lot Size</h2>
            <p className="font-body text-xs text-muted-foreground mb-6" style={{ opacity: 0.5 }}>
              Formula: (Account × Risk%) ÷ (SL pips × Pip value)
            </p>

            <div className="space-y-4">
              <div>
                <label className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground">Account Size ($)</label>
                <Input
                  type="number"
                  placeholder="e.g. 100000"
                  value={accountSize}
                  onChange={(e) => setAccountSize(e.target.value)}
                  className="mt-2 bg-background border-border"
                />
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground">Risk (%)</label>
                <Input
                  type="number"
                  placeholder="e.g. 1"
                  value={riskPct}
                  onChange={(e) => setRiskPct(e.target.value)}
                  className="mt-2 bg-background border-border"
                />
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground">Stop Loss (pips)</label>
                <Input
                  type="number"
                  placeholder="e.g. 20"
                  value={slPips}
                  onChange={(e) => setSlPips(e.target.value)}
                  className="mt-2 bg-background border-border"
                />
              </div>

              <Button onClick={calculate} variant="gold" className="w-full mt-2">
                Calculate
              </Button>
            </div>

            {result && (
              <div className="mt-8 space-y-4 rounded-lg border border-primary/30 bg-primary/5 p-5">
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-muted-foreground">Max Lot Size</span>
                  <span className="font-display text-2xl font-semibold text-primary">{result.lotSize}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-muted-foreground">Max Dollar Risk</span>
                  <span className="font-display text-2xl font-semibold text-foreground">${result.dollarRisk.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Calculator;
