import { Shield } from 'lucide-react';

const ProSuccessOverlay = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in duration-300">
    <Shield className="h-16 w-16 text-primary mb-6 animate-in zoom-in duration-500" />
    <h1 className="font-display text-4xl font-semibold text-primary tracking-wide">
      Welcome to ARIA Pro
    </h1>
    <p className="mt-3 font-body text-lg text-muted-foreground">
      All features unlocked
    </p>
    <div className="mt-8 h-1 w-32 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary animate-[expandWidth_2s_ease-in-out_forwards]" />
    </div>
    <style>{`
      @keyframes expandWidth {
        from { width: 0%; }
        to { width: 100%; }
      }
    `}</style>
  </div>
);

export default ProSuccessOverlay;
