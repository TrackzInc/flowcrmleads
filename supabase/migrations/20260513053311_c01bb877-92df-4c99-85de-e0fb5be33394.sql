ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS cidade text DEFAULT '',
ADD COLUMN IF NOT EXISTS segmento text DEFAULT '';