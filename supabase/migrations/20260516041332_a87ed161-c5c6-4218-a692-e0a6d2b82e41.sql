-- Tabela para histórico de buscas do ProspectAi
CREATE TABLE IF NOT EXISTS public.prospectai_searches (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.prospectai_searches ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Users can view their own prospectai searches" 
ON public.prospectai_searches 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prospectai searches" 
ON public.prospectai_searches 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Dados de exemplo para buscas
INSERT INTO public.prospectai_searches (user_id, query, results_count, status)
SELECT 
    id as user_id, 
    'Empresas de Tecnologia em São Paulo' as query, 
    45 as results_count, 
    'completed' as status
FROM auth.users
LIMIT 1
ON CONFLICT DO NOTHING;
