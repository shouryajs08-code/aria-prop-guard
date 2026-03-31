import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';

interface ProBadgeProps {
  className?: string;
  showUpgradeLink?: boolean;
}

const ProBadge = ({ className = '', showUpgradeLink = true }: ProBadgeProps) => {
  const badge = (
    <span className={`inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider text-primary ${className}`}>
      <Crown className="h-3 w-3" />
      PRO
    </span>
  );

  if (showUpgradeLink) {
    return <Link to="/pricing">{badge}</Link>;
  }
  return badge;
};

export default ProBadge;
