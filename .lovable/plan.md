## Plano de Implementação

### 1. Banco de Dados (Migrations)
Criar tabelas no Supabase:
- `profiles` (id, user_id, name, created_at)
- `transactions` (id, user_id, type, amount, category, description, date, contact_id)
- `contacts` (id, user_id, name, phone, email, origin, status, notes, next_contact_date, created_at, tag, interest, stage, is_lead, potential_value)
- `interactions` (id, user_id, contact_id, date, type, note)
- `tasks` (id, user_id, contact_id, title, due_date, done, created_at)
- `message_templates` (id, user_id, name, content, type)
- RLS policies para todas as tabelas (usuário só vê seus dados)

### 2. Autenticação
- Criar `src/integrations/supabase/client.ts`
- Criar `src/contexts/AuthContext.tsx`
- Criar `src/pages/AuthPage.tsx` (login/cadastro)
- Proteger rotas no `App.tsx`

### 3. Data Layer (migrar localStorage → Supabase)
- Atualizar `src/hooks/useStore.ts` para usar queries Supabase
- Usar React Query para cache/fetch

### 4. Edição de Leads
- Adicionar modal de edição em `LeadsPage.tsx`
- Campo `potential_value` (valor potencial R$)

### 5. WhatsApp Fix
- Corrigir `whatsappLink()` para sempre incluir código 55
- Limpar formatação do número

### 6. Follow-ups / Tarefas
- Atualizar `TarefasPage.tsx` com separação: atrasados, hoje, futuros
- Mostrar nome do lead, valor potencial, status
- Ações: marcar como feito, atualizar próxima data

### 7. Dashboard com Métricas
- Total de leads por status
- Soma de valor potencial vs realizado
- Taxa de conversão
- Gráfico de leads por status
- Gráfico potencial vs realizado
