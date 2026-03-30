-- Create prop_firms table
CREATE TABLE public.prop_firms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  daily_loss_limit NUMERIC NOT NULL,
  max_drawdown NUMERIC NOT NULL,
  profit_target NUMERIC NOT NULL,
  min_trading_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prop_firms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prop firms are viewable by authenticated users"
  ON public.prop_firms FOR SELECT TO authenticated USING (true);

-- Create user_accounts table
CREATE TABLE public.user_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_id UUID REFERENCES public.prop_firms(id),
  account_size NUMERIC NOT NULL DEFAULT 0,
  challenge_day INTEGER NOT NULL DEFAULT 1,
  current_daily_loss NUMERIC NOT NULL DEFAULT 0,
  current_drawdown NUMERIC NOT NULL DEFAULT 0,
  current_profit NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own accounts"
  ON public.user_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own accounts"
  ON public.user_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own accounts"
  ON public.user_accounts FOR UPDATE USING (auth.uid() = user_id);

-- Create trades table
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.user_accounts(id) ON DELETE CASCADE,
  pair TEXT NOT NULL,
  session TEXT,
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC NOT NULL,
  lot_size NUMERIC NOT NULL DEFAULT 0.01,
  pnl NUMERIC NOT NULL DEFAULT 0,
  rr_ratio NUMERIC,
  rule_compliant BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trades"
  ON public.trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own trades"
  ON public.trades FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.user_accounts(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  threshold_pct NUMERIC,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  channel TEXT DEFAULT 'app'
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts"
  ON public.alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own alerts"
  ON public.alerts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seed prop_firms
INSERT INTO public.prop_firms (name, daily_loss_limit, max_drawdown, profit_target, min_trading_days) VALUES
  ('FTMO', 5, 10, 10, 4),
  ('FundingPips', 5, 10, 8, 0),
  ('Apex', 3, 6, 9, 0),
  ('The5ers', 4, 8, 8, 0),
  ('FundedNext', 5, 10, 10, 0),
  ('E8 Markets', 5, 8, 8, 0);