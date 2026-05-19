import { 
  Monitor, 
  Layout, 
  ShoppingCart, 
  Palette, 
  Wrench,
  FileText 
} from 'lucide-react';

export const PROJECT_STAGES = [
  'aguardando_pagamento',
  'briefing_pendente',
  'briefing_recebido',
  'wireframe',
  'design',
  'desenvolvimento',
  'revisao',
  'ajustes',
  'aguardando_cliente',
  'entregue',
  'pos_venda',
] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];

export const PROJECT_STAGE_LABELS: Record<ProjectStage, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  briefing_pendente: 'Briefing pendente',
  briefing_recebido: 'Briefing recebido',
  wireframe: 'Wireframe',
  design: 'Design',
  desenvolvimento: 'Desenvolvimento',
  revisao: 'Revisão',
  ajustes: 'Ajustes',
  aguardando_cliente: 'Aguardando cliente',
  entregue: 'Entregue',
  pos_venda: 'Pós-venda',
};

export const PROJECT_STAGE_COLORS: Record<ProjectStage, string> = {
  aguardando_pagamento: 'border-t-amber-500',
  briefing_pendente: 'border-t-orange-400',
  briefing_recebido: 'border-t-yellow-400',
  wireframe: 'border-t-sky-400',
  design: 'border-t-violet-400',
  desenvolvimento: 'border-t-indigo-400',
  revisao: 'border-t-fuchsia-400',
  ajustes: 'border-t-pink-400',
  aguardando_cliente: 'border-t-blue-400',
  entregue: 'border-t-emerald-500',
  pos_venda: 'border-t-teal-400',
};

export type ProjectPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

export const PRIORITY_COLORS: Record<ProjectPriority, string> = {
  baixa: 'bg-slate-100 text-slate-700',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-amber-100 text-amber-800',
  urgente: 'bg-red-100 text-red-700',
};

export const PROJECT_TYPE_LABELS: Record<string, string> = {
  site: 'Site Institucional',
  landing: 'Landing Page',
  ecommerce: 'E-commerce',
  identidade: 'Identidade Visual',
  manutencao: 'Manutenção Mensal',
};

export const PROJECT_TYPE_ICONS: Record<string, any> = {
  site: Monitor,
  landing: Layout,
  ecommerce: ShoppingCart,
  identidade: Palette,
  manutencao: Wrench,
  default: FileText,
};

export function daysBetween(from: string | Date, to: Date = new Date()) {
  const f = typeof from === 'string' ? new Date(from) : from;
  if (!f || isNaN(f.getTime())) return 0;
  return Math.floor((to.getTime() - f.getTime()) / 86400000);
}