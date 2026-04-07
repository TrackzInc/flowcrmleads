
-- Goals table for monthly sales targets
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month TEXT NOT NULL,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Custom fields table
CREATE TABLE public.custom_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  options JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own custom_fields" ON public.custom_fields FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own custom_fields" ON public.custom_fields FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own custom_fields" ON public.custom_fields FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own custom_fields" ON public.custom_fields FOR DELETE USING (auth.uid() = user_id);

-- Custom field values
CREATE TABLE public.custom_field_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL,
  custom_field_id UUID NOT NULL REFERENCES public.custom_fields(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own field values" ON public.custom_field_values FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.contacts WHERE contacts.id = contact_id AND contacts.user_id = auth.uid()));
CREATE POLICY "Users can insert own field values" ON public.custom_field_values FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.contacts WHERE contacts.id = contact_id AND contacts.user_id = auth.uid()));
CREATE POLICY "Users can update own field values" ON public.custom_field_values FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.contacts WHERE contacts.id = contact_id AND contacts.user_id = auth.uid()));
CREATE POLICY "Users can delete own field values" ON public.custom_field_values FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.contacts WHERE contacts.id = contact_id AND contacts.user_id = auth.uid()));
