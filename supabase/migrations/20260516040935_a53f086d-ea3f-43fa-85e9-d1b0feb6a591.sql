-- Criar tabela para os leads do ProspectAi
CREATE TABLE IF NOT EXISTS public.prospectai_leads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    company_name TEXT,
    phone TEXT,
    email TEXT,
    segment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.prospectai_leads ENABLE ROW LEVEL SECURITY;

-- Política simples para leitura (todos autenticados podem ver para sincronizar)
CREATE POLICY "Users can view prospectai leads" 
ON public.prospectai_leads 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Inserir alguns dados de exemplo para que a sincronização funcione imediatamente
INSERT INTO public.prospectai_leads (name, company_name, phone, email, segment)
VALUES 
('João Silva', 'Silva Tech', '11999999999', 'joao@silvatech.com', 'Tecnologia'),
('Maria Oliveira', 'Oliveira Vendas', '11988888888', 'maria@oliveira.com', 'Varejo'),
('Pedro Santos', 'Santos Logística', '11977777777', 'pedro@santos.com', 'Logística')
ON CONFLICT DO NOTHING;
