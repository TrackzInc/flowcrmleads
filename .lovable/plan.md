## Módulo Projetos — Plano de Implementação

Vou criar um módulo operacional completo de Projetos, integrado ao CRM atual (Lovable Cloud / Supabase). Por ser uma feature grande, proponho entregar em **3 fases incrementais** para garantir qualidade e poder validar contigo a cada etapa.

---

### Fase 1 — Fundação + Kanban + Integração com Leads

**Backend (migrations)**
- Tabela `projects`: nome, cliente (contact_id), empresa, nicho, tipo, valor, data início, prazo, prioridade, responsável, status (coluna kanban), progresso, tags, posição, observações, links rápidos (figma/drive/domínio/hospedagem/site), template usado, timestamps por estágio (para "tempo parado").
- Tabela `project_checklist_items`: item, concluído, ordem.
- Tabela `project_comments`: texto, autor, timestamp (timeline).
- Tabela `project_templates`: nome, tipo, pipeline (jsonb), checklist (jsonb), categorias de arquivos (jsonb).
- Tabela `project_files`: nome, tamanho, categoria, URL, é_pendente_cliente.
- Tabela `project_files_pending`: itens pendentes do cliente (logo, fotos, textos…).
- RLS em todas, isoladas por `user_id`.
- Seed dos 5 templates iniciais (Site institucional, Landing Page, Identidade Visual, E-commerce, Personalizado).

**Frontend**
- Reorganizar sidebar na ordem pedida: Dashboard, Leads, Agenda, Follow-ups, Clientes, **Projetos**, Financeiro, Configurações (mapeando para as páginas existentes — ex: Caixa → Financeiro, Calendário → Agenda).
- Página `/projetos` com Kanban (11 colunas), drag-and-drop (`@dnd-kit`), cards com: prazo, prioridade, responsável, barra de progresso, tags, tempo parado, badge de atraso.
- Modal "Novo Projeto" com seleção de template.
- Modal/drawer de detalhes do projeto: informações, links rápidos, checklist dinâmica, comentários (timeline), arquivos.
- Hook automático: quando um Lead muda para estágio `fechado`, abrir modal "Escolha template para criar projeto" e gerar projeto completo (pipeline + checklist + categorias).

### Fase 2 — Visualizações múltiplas + Templates editáveis

- Toggle de visualização: Kanban / Lista / Tabela / Calendário (mesma fonte de dados).
- CRUD completo de templates (criar, duplicar, editar, salvar fluxo próprio).
- Página "Cliente" expandida: abas Projetos ativos / anteriores / Pagamentos / Reuniões / Histórico.

### Fase 3 — Arquivos + Alertas + Polimento

- Sistema de arquivos com Lovable Cloud Storage: upload múltiplo, drag-and-drop, miniaturas, categorias, links externos, área "Arquivos pendentes do cliente".
- Sistema de alertas no Dashboard: projeto parado X dias, atrasado, briefing pendente, cliente sem resposta.
- Busca global, filtros rápidos, refinamentos visuais (animações Trello/Linear/Notion), tema claro/escuro polido.

---

### Detalhes técnicos
- Stack: React + Vite + Tailwind + shadcn (já em uso); `@dnd-kit/core` para drag-and-drop; `date-fns` para cálculos de tempo parado/atraso; React Query para cache.
- Templates armazenados no banco (jsonb) — fácil de editar sem deploy.
- "Tempo parado": coluna `stage_changed_at` atualizada via trigger ao mover de status.
- Storage: bucket `project-files` no Lovable Cloud, com RLS por `user_id` no path.
- Reaproveita `contacts` (clientes) e `tasks` existentes — sem duplicar dados.

---

### Confirmação

Posso começar pela **Fase 1** agora? Ela já entrega o valor principal: Kanban funcional, criação por template e automação Lead-Fechado → Projeto. Depois seguimos para 2 e 3.
