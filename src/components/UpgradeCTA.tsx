import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';

interface UpgradeCTAProps {
  collapsed?: boolean;
}

const UpgradeCTA = ({ collapsed = false }: UpgradeCTAProps) => {
  if (collapsed) {
    return (
      <Link to="/pricing" className="flex items-center justify-center rounded-md bg-primary/10 p-2 text-primary hover:bg-primary/20 transition-colors">
        <Crown className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <Link
      to="/pricing"
      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/20 px-3 py-2.5 font-body text-xs text-primary font-medium hover:from-primary/20 hover:to-primary/10 transition-all"
    >
      <Crown className="h-3.5 w-3.5 shrink-0" />
      <span>Upgrade to Pro</span>
    </Link>
  );
};

export default UpgradeCTA;
