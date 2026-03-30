import { useLocalStorage } from './useLocalStorage';
import { Transaction, Contact, Interaction, MessageTemplate, Task } from '@/types';

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  { id: '1', name: 'Abordagem Inicial', type: 'abordagem', content: 'Olá! Tudo bem? Vi seu perfil e acredito que posso ajudar com [serviço]. Podemos conversar?' },
  { id: '2', name: 'Follow-up', type: 'followup', content: 'Oi! Passando para saber se teve a chance de pensar na nossa conversa. Estou à disposição!' },
  { id: '3', name: 'Fechamento', type: 'fechamento', content: 'Olá! Gostaria de formalizar nossa parceria. Posso enviar a proposta final?' },
];

export function useTransactions() {
  return useLocalStorage<Transaction[]>('microsaas_transactions', []);
}

export function useContacts() {
  return useLocalStorage<Contact[]>('microsaas_contacts', []);
}

export function useInteractions() {
  return useLocalStorage<Interaction[]>('microsaas_interactions', []);
}

export function useTemplates() {
  return useLocalStorage<MessageTemplate[]>('microsaas_templates', DEFAULT_TEMPLATES);
}

export function useTasks() {
  return useLocalStorage<Task[]>('microsaas_tasks', []);
}
