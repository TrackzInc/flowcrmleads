-- Update project_templates table
ALTER TABLE public.project_templates 
ADD COLUMN IF NOT EXISTS default_duration_days INTEGER DEFAULT 28,
ADD COLUMN IF NOT EXISTS tasks JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Update existing templates or delete and re-insert to match new structure
-- Using a clean slate for system templates to ensure consistency
DELETE FROM public.project_templates WHERE is_system = true;

INSERT INTO public.project_templates (name, project_type, default_duration_days, pipeline, checklist, tasks, file_categories, is_system) VALUES
('Site Institucional', 'site', 28,
 '["Briefing", "Wireframe", "Criação", "Revisão", "Entrega"]'::jsonb,
 '[
   {"label": "Receber briefing preenchido"},
   {"label": "Coletar referências visuais"},
   {"label": "Receber textos e copy"},
   {"label": "Criar wireframe das páginas"},
   {"label": "Desenvolver homepage"},
   {"label": "Desenvolver páginas internas"},
   {"label": "Revisão de responsividade"},
   {"label": "Aplicar SEO básico"},
   {"label": "Entrega e aprovação final"}
 ]'::jsonb,
 '[
   {"title": "Enviar formulário de briefing", "day_offset": 0},
   {"title": "Criar wireframe", "day_offset": 5},
   {"title": "Desenvolver homepage", "day_offset": 12},
   {"title": "Enviar para revisão", "day_offset": 20},
   {"title": "Publicar e entregar acesso", "day_offset": 28}
 ]'::jsonb,
 '[
   {"name": "Logotipo", "description": ".ai .svg .png"},
   {"name": "Fotos e imagens", "description": "alta resolução"},
   {"name": "Textos e copy", "description": ""},
   {"name": "Contrato assinado", "description": ".pdf"},
   {"name": "Entregáveis finais", "description": ""}
 ]'::jsonb, 
 true),

('Landing Page', 'landing', 14,
 '["Briefing", "Criação", "Revisão", "Publicação"]'::jsonb,
 '[
   {"label": "Receber briefing e objetivo"},
   {"label": "Definir oferta e CTA"},
   {"label": "Receber textos e copy"},
   {"label": "Criar layout desktop"},
   {"label": "Criar layout mobile"},
   {"label": "Integrar formulário ou botão"},
   {"label": "Revisão do cliente"},
   {"label": "Publicar e testar"}
 ]'::jsonb,
 '[
   {"title": "Enviar briefing", "day_offset": 0},
   {"title": "Criar layout completo", "day_offset": 5},
   {"title": "Enviar para revisão", "day_offset": 10},
   {"title": "Publicar", "day_offset": 14}
 ]'::jsonb,
 '[
   {"name": "Logotipo", "description": ""},
   {"name": "Imagem principal hero", "description": ""},
   {"name": "Textos e copy", "description": ""},
   {"name": "Contrato assinado", "description": ""}
 ]'::jsonb, 
 true),

('E-commerce', 'ecommerce', 35,
 '["Briefing", "Configuração", "Produtos", "Revisão", "Lançamento"]'::jsonb,
 '[
   {"label": "Receber briefing e catálogo"},
   {"label": "Configurar plataforma e domínio"},
   {"label": "Configurar pagamentos"},
   {"label": "Configurar frete"},
   {"label": "Cadastrar produtos"},
   {"label": "Configurar página inicial"},
   {"label": "Testes de checkout"},
   {"label": "Revisão do cliente"},
   {"label": "Lançamento e entrega de acesso"}
 ]'::jsonb,
 '[
   {"title": "Enviar briefing e lista de produtos", "day_offset": 0},
   {"title": "Configurar plataforma", "day_offset": 5},
   {"title": "Cadastrar produtos", "day_offset": 14},
   {"title": "Testes e revisão", "day_offset": 25},
   {"title": "Lançamento", "day_offset": 35}
 ]'::jsonb,
 '[
   {"name": "Logotipo", "description": ""},
   {"name": "Fotos dos produtos", "description": ""},
   {"name": "Descrições dos produtos", "description": ""},
   {"name": "Contrato assinado", "description": ""},
   {"name": "Credenciais de acesso", "description": ""}
 ]'::jsonb, 
 true),

('Identidade Visual', 'identidade', 28,
 '["Briefing", "Conceito", "Criação", "Revisão", "Entrega"]'::jsonb,
 '[
   {"label": "Receber briefing de marca"},
   {"label": "Pesquisa e moodboard"},
   {"label": "Apresentar conceito inicial"},
   {"label": "Desenvolver logotipo"},
   {"label": "Desenvolver paleta e tipografia"},
   {"label": "Criar manual da marca"},
   {"label": "Revisão e ajustes"},
   {"label": "Entrega dos arquivos"}
 ]'::jsonb,
 '[
   {"title": "Enviar briefing de marca", "day_offset": 0},
   {"title": "Apresentar moodboard", "day_offset": 5},
   {"title": "Apresentar conceito do logo", "day_offset": 12},
   {"title": "Enviar para revisão", "day_offset": 20},
   {"title": "Entregar arquivos finais", "day_offset": 28}
 ]'::jsonb,
 '[
   {"name": "Referências visuais do cliente", "description": ""},
   {"name": "Contrato assinado", "description": ""},
   {"name": "Arquivos finais da marca", "description": ".ai .pdf .png"}
 ]'::jsonb, 
 true),

('Manutenção Mensal', 'manutencao', 28,
 '["A fazer", "Em andamento", "Concluído"]'::jsonb,
 '[
   {"label": "Registrar solicitações do mês"},
   {"label": "Executar alterações"},
   {"label": "Backup do site"},
   {"label": "Relatório mensal enviado"},
   {"label": "Aprovação do cliente"}
 ]'::jsonb,
 '[
   {"title": "Levantar demandas do mês", "day_offset": 0},
   {"title": "Executar alterações", "day_offset": 5},
   {"title": "Enviar relatório", "day_offset": 25},
   {"title": "Renovação e faturamento", "day_offset": 28}
 ]'::jsonb,
 '[
   {"name": "Relatório do mês", "description": ".pdf"},
   {"name": "Arquivos de alteração", "description": ""},
   {"name": "Comprovante de pagamento", "description": ""}
 ]'::jsonb, 
 true);
