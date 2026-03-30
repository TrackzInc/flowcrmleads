export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  contactId?: string;
}

export type ContactStatus = 'novo' | 'em_contato' | 'negociacao' | 'fechado' | 'perdido';
export type LeadTag = 'frio' | 'morno' | 'quente' | 'cliente_potencial';
export type LeadStage = 'novo_lead' | 'contato_iniciado' | 'respondeu' | 'em_negociacao' | 'fechado' | 'perdido';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  origin: string;
  status: ContactStatus;
  notes: string;
  nextContactDate?: string;
  createdAt: string;
  tag?: LeadTag;
  interest?: string;
  stage?: LeadStage;
  isLead?: boolean;
}

export interface Interaction {
  id: string;
  contactId: string;
  date: string;
  type: string;
  note: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  type: 'abordagem' | 'followup' | 'fechamento';
}

export interface Task {
  id: string;
  contactId?: string;
  title: string;
  dueDate: string;
  done: boolean;
  createdAt: string;
}

export const CATEGORIES_INCOME = ['Serviço', 'Produto', 'Consultoria', 'Comissão', 'Outros'];
export const CATEGORIES_EXPENSE = ['Ferramenta', 'Marketing', 'Alimentação', 'Transporte', 'Impostos', 'Outros'];
export const ORIGINS = ['Instagram', 'Google', 'Indicação', 'Cold', 'LinkedIn', 'WhatsApp', 'Outro'];

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  novo: 'Novo',
  em_contato: 'Em Contato',
  negociacao: 'Negociação',
  fechado: 'Fechado',
  perdido: 'Perdido',
};

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  novo_lead: 'Novo Lead',
  contato_iniciado: 'Contato Iniciado',
  respondeu: 'Respondeu',
  em_negociacao: 'Em Negociação',
  fechado: 'Fechado',
  perdido: 'Perdido',
};

export const LEAD_TAG_LABELS: Record<LeadTag, string> = {
  frio: 'Frio',
  morno: 'Morno',
  quente: 'Quente',
  cliente_potencial: 'Cliente Potencial',
};
