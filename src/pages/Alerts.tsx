import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Bell, MessageCircle } from 'lucide-react';

interface Alert {
  id: string;
  alert_type: string;
  message: string;
  channel: string | null;
  sent_at: string | null;
  threshold_pct: number | null;
}

const Alerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false });
      if (data) setAlerts(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border px-6 py-4">
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Bell className="h-5 w-5 text-primary" />
        <span className="font-display text-lg font-semibold tracking-wide">Alerts</span>
      </header>

      <main className="flex-1 p-6">
        {/* WhatsApp banner */}
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-5 py-3">
          <MessageCircle className="h-5 w-5 text-primary" />
          <div>
            <span className="font-body text-sm font-medium text-primary">WhatsApp Alerts — Coming Soon</span>
            <p className="font-body text-xs text-muted-foreground mt-0.5">Get real-time risk alerts directly on WhatsApp.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="font-body text-muted-foreground">No alerts yet. Alerts will appear here when risk thresholds are breached.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((a) => (
              <div key={a.id} className="rounded-lg border border-border bg-card px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-body text-xs font-medium text-primary uppercase tracking-wider">
                    {a.alert_type}
                  </span>
                  <span className="font-body text-xs text-muted-foreground">
                    {a.sent_at ? new Date(a.sent_at).toLocaleString() : '—'}
                  </span>
                </div>
                <p className="mt-2 font-body text-sm text-foreground">{a.message}</p>
                {a.threshold_pct != null && (
                  <span className="mt-1 inline-block font-body text-xs text-muted-foreground">
                    Threshold: {a.threshold_pct}%
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Alerts;
