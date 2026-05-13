ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS external_source TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS contacts_user_external_unique 
  ON public.contacts(user_id, external_source, external_id) 
  WHERE external_id IS NOT NULL;