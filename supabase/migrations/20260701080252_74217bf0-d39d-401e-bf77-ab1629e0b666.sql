
CREATE TABLE public.ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('email','research','planner')),
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.ai_generations TO authenticated;
GRANT ALL ON public.ai_generations TO service_role;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ai_generations select" ON public.ai_generations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own ai_generations insert" ON public.ai_generations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ai_generations delete" ON public.ai_generations FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX ai_generations_user_kind_idx ON public.ai_generations (user_id, kind, created_at DESC);
