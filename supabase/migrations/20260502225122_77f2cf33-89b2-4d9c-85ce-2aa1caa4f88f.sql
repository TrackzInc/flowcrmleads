
-- 1. Recorrência em serviços
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS recurrence text NOT NULL DEFAULT 'unico';

-- 2. Opt-in nos contatos
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS optin_email boolean NOT NULL DEFAULT false;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS optin_whatsapp boolean NOT NULL DEFAULT false;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- 3. Automations
CREATE TABLE public.automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  trigger_type text NOT NULL, -- 'lead_created', 'stage_changed', 'email_opened', 'email_clicked', 'no_reply'
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own automations" ON public.automations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own automations" ON public.automations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own automations" ON public.automations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own automations" ON public.automations FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER automations_updated_at BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Automation steps (ordered)
CREATE TABLE public.automation_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  step_order int NOT NULL,
  action_type text NOT NULL, -- 'send_email', 'send_whatsapp', 'add_tag', 'move_stage', 'create_task', 'wait'
  action_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  delay_minutes int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own steps" ON public.automation_steps FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.automations a WHERE a.id = automation_id AND a.user_id = auth.uid())
);
CREATE POLICY "Users insert own steps" ON public.automation_steps FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.automations a WHERE a.id = automation_id AND a.user_id = auth.uid())
);
CREATE POLICY "Users update own steps" ON public.automation_steps FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.automations a WHERE a.id = automation_id AND a.user_id = auth.uid())
);
CREATE POLICY "Users delete own steps" ON public.automation_steps FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.automations a WHERE a.id = automation_id AND a.user_id = auth.uid())
);

-- 5. Automation runs (queue de execução)
CREATE TABLE public.automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  automation_id uuid NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL,
  current_step int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending, running, completed, error, paused
  next_run_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_automation_runs_pending ON public.automation_runs(next_run_at) WHERE status IN ('pending', 'running');

ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own runs" ON public.automation_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own runs" ON public.automation_runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own runs" ON public.automation_runs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own runs" ON public.automation_runs FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER automation_runs_updated_at BEFORE UPDATE ON public.automation_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Message logs
CREATE TABLE public.message_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid,
  automation_id uuid,
  channel text NOT NULL, -- 'email' | 'whatsapp'
  recipient text NOT NULL,
  subject text,
  content text,
  status text NOT NULL DEFAULT 'pending', -- pending, sent, delivered, read, error
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_message_logs_user_created ON public.message_logs(user_id, created_at DESC);

ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own logs" ON public.message_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own logs" ON public.message_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
