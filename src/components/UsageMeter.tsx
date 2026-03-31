interface UsageMeterProps {
  label: string;
  used: number;
  max: number;
  isPro: boolean;
}

const UsageMeter = ({ label, used, max, isPro }: UsageMeterProps) => {
  const pct = isPro ? 0 : Math.min((used / max) * 100, 100);
  const color = pct >= 100 ? 'bg-danger' : pct >= 60 ? 'bg-warning' : 'bg-primary';

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-body text-xs text-muted-foreground">{label}</span>
        <span className="font-body text-xs font-medium text-foreground">
          {isPro ? 'Unlimited' : `${used}/${max} today`}
        </span>
      </div>
      {!isPro && (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
};

export default UsageMeter;
