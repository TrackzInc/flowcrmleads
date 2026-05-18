
-- Projects module: core tables, RLS, triggers, templates seed

-- 1. projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  company TEXT DEFAULT '',
  niche TEXT DEFAULT '',
  project_type TEXT NOT NULL DEFAULT 'personalizado',
  value NUMERIC DEFAULT 0,
  start_date DATE,
  deadline DATE,
  priority TEXT NOT NULL DEFAULT 'media',
  assignee TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'aguardando_pagamento',
  progress INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  links JSONB NOT NULL DEFAULT '{}'::jsonb,
  template_id UUID,
  stage_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_projects_user ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);

-- update timestamps + stage_changed_at
CREATE OR REPLACE FUNCTION public.projects_update_trigger()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.stage_changed_at = now();
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_projects_update BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.projects_update_trigger();

-- 2. project_checklist_items
CREATE TABLE public.project_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  label TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own checklist" ON public.project_checklist_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own checklist" ON public.project_checklist_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own checklist" ON public.project_checklist_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own checklist" ON public.project_checklist_items FOR DELETE USING (auth.uid() = user_id);

-- 3. project_comments
CREATE TABLE public.project_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  author_name TEXT DEFAULT '',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own comments" ON public.project_comments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own comments" ON public.project_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own comments" ON public.project_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own comments" ON public.project_comments FOR DELETE USING (auth.uid() = user_id);

-- 4. project_templates
CREATE TABLE public.project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  project_type TEXT NOT NULL,
  pipeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  file_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select templates" ON public.project_templates FOR SELECT USING (is_system OR auth.uid() = user_id);
CREATE POLICY "insert own templates" ON public.project_templates FOR INSERT WITH CHECK (auth.uid() = user_id AND NOT is_system);
CREATE POLICY "update own templates" ON public.project_templates FOR UPDATE USING (auth.uid() = user_id AND NOT is_system);
CREATE POLICY "delete own templates" ON public.project_templates FOR DELETE USING (auth.uid() = user_id AND NOT is_system);

-- Seed system templates
INSERT INTO public.project_templates (name, project_type, pipeline, checklist, file_categories, is_system) VALUES
('Site Institucional', 'site',
 '["aguardando_pagamento","briefing_pendente","briefing_recebido","wireframe","design","desenvolvimento","revisao","ajustes","aguardando_cliente","entregue","pos_venda"]'::jsonb,
 '["briefing","referências","copy","homepage","páginas internas","revisão","responsividade","SEO básico","entrega"]'::jsonb,
 '["Briefing","Referências","Logos","Imagens","Contratos","Entregáveis","Documentos"]'::jsonb, true),
('Landing Page', 'landing',
 '["aguardando_pagamento","briefing_pendente","briefing_recebido","wireframe","design","desenvolvimento","revisao","ajustes","aguardando_cliente","entregue","pos_venda"]'::jsonb,
 '["briefing","copy","wireframe","design","desenvolvimento","integração formulário","responsividade","entrega"]'::jsonb,
 '["Briefing","Referências","Imagens","Contratos","Entregáveis"]'::jsonb, true),
('Identidade Visual', 'identidade',
 '["aguardando_pagamento","briefing_pendente","briefing_recebido","design","revisao","ajustes","aguardando_cliente","entregue","pos_venda"]'::jsonb,
 '["briefing","referências","conceito","primeira proposta","ajustes","exportação","entrega"]'::jsonb,
 '["Briefing","Referências","Logos","Entregáveis","Documentos"]'::jsonb, true),
('E-commerce', 'ecommerce',
 '["aguardando_pagamento","briefing_pendente","briefing_recebido","wireframe","design","desenvolvimento","revisao","ajustes","aguardando_cliente","entregue","pos_venda"]'::jsonb,
 '["briefing","catálogo de produtos","copy","design","desenvolvimento","integração pagamento","frete","SEO","responsividade","entrega"]'::jsonb,
 '["Briefing","Referências","Logos","Imagens","Produtos","Contratos","Entregáveis"]'::jsonb, true),
('Projeto Personalizado', 'personalizado',
 '["aguardando_pagamento","briefing_pendente","briefing_recebido","design","desenvolvimento","revisao","ajustes","aguardando_cliente","entregue","pos_venda"]'::jsonb,
 '["briefing","planejamento","execução","revisão","entrega"]'::jsonb,
 '["Briefing","Referências","Documentos","Entregáveis"]'::jsonb, true);
