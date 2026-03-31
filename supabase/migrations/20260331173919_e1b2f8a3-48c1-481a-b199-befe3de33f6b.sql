
CREATE TABLE public.usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  trade_logs_count integer NOT NULL DEFAULT 0,
  ai_analyses_count integer NOT NULL DEFAULT 0,
  pre_trade_count integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, date)
);

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
ON public.usage_tracking FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
ON public.usage_tracking FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
ON public.usage_tracking FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
