import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Brain, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface Analysis {
  id: string;
  session_description: string;
  analysis: string;
  created_at: string;
}

const AICoach = () => {
  const { user } = useAuth();
  const { canUseAI, isPro, usage, incrementUsage } = useUsageLimits();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<string | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('ai_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setHistory(data as Analysis[]);
      });
  }, [user]);

  const handleAnalyse = async () => {
    if (!description.trim()) return;

    if (!canUseAI) {
      toast.error('Daily AI analysis limit reached. Upgrade to Pro for unlimited.');
      return;
    }

    const allowed = await incrementUsage('ai_analyses_count');
    if (!allowed) {
      toast.error('Daily limit reached. Upgrade to Pro for unlimited.');
      return;
    }

    setLoading(true);
    setCurrentAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: { session_description: description },
      });

      if (error) throw error;
      setCurrentAnalysis(data.analysis);
      setHistory((prev) => [
        { id: crypto.randomUUID(), session_description: description, analysis: data.analysis, created_at: new Date().toISOString() },
        ...prev,
      ]);
      setDescription('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to analyse session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-16 items-center gap-4 border-b border-border px-6">
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Brain className="h-5 w-5 text-primary" />
        <span className="font-display text-lg font-semibold tracking-wide">
          <span className="text-primary">ARIA</span> AI Coach
        </span>
        {!isPro && (
          <span className="ml-auto font-body text-xs text-muted-foreground">
            {usage.ai_analyses_count}/3 used today
          </span>
        )}
      </header>

      <main className="mx-auto max-w-2xl p-6">
        <h1 className="font-display text-2xl font-light">Post-Session Analysis</h1>
        <p className="mt-2 font-body text-sm text-muted-foreground">
          Describe your trading session and ARIA will provide actionable coaching.
        </p>

        <div className="mt-6 space-y-4">
          <Textarea
            placeholder="Today I took 3 trades on EURUSD London session, won 2 lost 1, RR was 1:2 on winners..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="border-border bg-card font-body text-sm"
          />
          <Button
            variant="gold"
            onClick={handleAnalyse}
            disabled={loading || !description.trim()}
            className="w-full"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Analyse Session'}
          </Button>
        </div>

        {currentAnalysis && (
          <div className="mt-8 rounded-lg border border-border bg-card p-6 border-l-4 border-l-primary">
            <h2 className="mb-4 font-display text-lg font-semibold text-primary">ARIA's Analysis</h2>
            <div className="prose prose-invert prose-sm max-w-none font-body text-foreground">
              <ReactMarkdown>{currentAnalysis}</ReactMarkdown>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-xl font-light">History</h2>
            <div className="mt-4 space-y-4">
              {history.map((item) => (
                <details key={item.id} className="rounded-lg border border-border bg-card">
                  <summary className="cursor-pointer px-4 py-3 font-body text-sm text-muted-foreground hover:text-foreground">
                    {new Date(item.created_at).toLocaleDateString()} — {item.session_description.slice(0, 60)}…
                  </summary>
                  <div className="border-t border-border px-4 py-4 border-l-4 border-l-primary prose prose-invert prose-sm max-w-none font-body text-foreground">
                    <ReactMarkdown>{item.analysis}</ReactMarkdown>
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AICoach;
