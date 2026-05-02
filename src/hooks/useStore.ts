import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Contact = Tables<'contacts'>;
type Transaction = Tables<'transactions'>;
type Interaction = Tables<'interactions'>;
type Task = Tables<'tasks'>;
type MessageTemplate = Tables<'message_templates'>;

// Generic hook factory
function useSupabaseQuery<T>(table: string, key: string) {
  const { user } = useAuth();
  return useQuery<T[]>({
    queryKey: [key, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from(table as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as T[]) ?? [];
    },
    enabled: !!user,
  });
}

// === CONTACTS ===
export function useContacts() {
  return useSupabaseQuery<Contact>('contacts', 'contacts');
}

export function useInsertContact() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (contact: Omit<TablesInsert<'contacts'>, 'user_id'>) => {
      const { data, error } = await supabase.from('contacts').insert({ ...contact, user_id: user!.id }).select().single();
      if (error) throw error;
      // Dispara automações de "novo lead criado"
      try {
        await supabase.functions.invoke('trigger-automation', {
          body: { trigger_type: 'lead_created', contact_id: data.id },
        });
      } catch (e) { console.warn('trigger-automation failed', e); }
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'contacts'> & { id: string }) => {
      const { data: prev } = await supabase.from('contacts').select('stage').eq('id', id).single();
      const { error } = await supabase.from('contacts').update(updates).eq('id', id);
      if (error) throw error;
      // Dispara trigger se mudou o stage
      if (updates.stage && prev && prev.stage !== updates.stage) {
        try {
          await supabase.functions.invoke('trigger-automation', {
            body: { trigger_type: 'stage_changed', contact_id: id, extra: { from: prev.stage, to: updates.stage } },
          });
        } catch (e) { console.warn('trigger-automation failed', e); }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
}

// === TRANSACTIONS ===
export function useTransactions() {
  return useSupabaseQuery<Transaction>('transactions', 'transactions');
}

export function useInsertTransaction() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (tx: Omit<TablesInsert<'transactions'>, 'user_id'>) => {
      const { data, error } = await supabase.from('transactions').insert({ ...tx, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'transactions'> & { id: string }) => {
      const { error } = await supabase.from('transactions').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });
}

// === INTERACTIONS ===
export function useInteractions(contactId?: string) {
  const { user } = useAuth();
  return useQuery<Interaction[]>({
    queryKey: ['interactions', user?.id, contactId],
    queryFn: async () => {
      if (!user) return [];
      let q = supabase.from('interactions').select('*').eq('user_id', user.id).order('date', { ascending: false });
      if (contactId) q = q.eq('contact_id', contactId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useInsertInteraction() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (i: Omit<TablesInsert<'interactions'>, 'user_id'>) => {
      const { error } = await supabase.from('interactions').insert({ ...i, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interactions'] }),
  });
}

// === TASKS ===
export function useTasks() {
  return useSupabaseQuery<Task>('tasks', 'tasks');
}

export function useInsertTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (t: Omit<TablesInsert<'tasks'>, 'user_id'>) => {
      const { error } = await supabase.from('tasks').insert({ ...t, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'tasks'> & { id: string }) => {
      const { error } = await supabase.from('tasks').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

// === TEMPLATES ===
export function useTemplates() {
  return useSupabaseQuery<MessageTemplate>('message_templates', 'templates');
}

export function useInsertTemplate() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (t: Omit<TablesInsert<'message_templates'>, 'user_id'>) => {
      const { error } = await supabase.from('message_templates').insert({ ...t, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'message_templates'> & { id: string }) => {
      const { error } = await supabase.from('message_templates').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('message_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

// === SERVICES ===
type Service = Tables<'services'>;

export function useServices() {
  return useSupabaseQuery<Service>('services', 'services');
}

export function useInsertService() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (s: Omit<TablesInsert<'services'>, 'user_id'>) => {
      const { error } = await supabase.from('services').insert({ ...s, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'services'> & { id: string }) => {
      const { error } = await supabase.from('services').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}

// === GOALS ===
type Goal = Tables<'goals'>;

export function useGoals() {
  return useSupabaseQuery<Goal>('goals', 'goals');
}

export function useUpsertGoal() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ month, target_amount }: { month: string; target_amount: number }) => {
      const { error } = await supabase.from('goals').upsert(
        { user_id: user!.id, month, target_amount },
        { onConflict: 'user_id,month' }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

// === APPOINTMENTS ===
type Appointment = Tables<'appointments'>;

export function useAppointments() {
  return useSupabaseQuery<Appointment>('appointments', 'appointments');
}

export function useInsertAppointment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (a: Omit<TablesInsert<'appointments'>, 'user_id'>) => {
      const { error } = await supabase.from('appointments').insert({ ...a, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

// === CUSTOM FIELDS ===
type CustomField = Tables<'custom_fields'>;
type CustomFieldValue = Tables<'custom_field_values'>;

export function useCustomFields() {
  return useSupabaseQuery<CustomField>('custom_fields', 'custom_fields');
}

export function useInsertCustomField() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (f: Omit<TablesInsert<'custom_fields'>, 'user_id'>) => {
      const { error } = await supabase.from('custom_fields').insert({ ...f, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom_fields'] }),
  });
}

export function useDeleteCustomField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_fields').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom_fields'] });
      qc.invalidateQueries({ queryKey: ['custom_field_values'] });
    },
  });
}

export function useCustomFieldValues(contactId?: string) {
  const { user } = useAuth();
  return useQuery<CustomFieldValue[]>({
    queryKey: ['custom_field_values', user?.id, contactId],
    queryFn: async () => {
      if (!user || !contactId) return [];
      const { data, error } = await supabase
        .from('custom_field_values')
        .select('*')
        .eq('contact_id', contactId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!contactId,
  });
}

export function useUpsertCustomFieldValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contact_id, custom_field_id, value }: { contact_id: string; custom_field_id: string; value: string }) => {
      // Try to find existing
      const { data: existing } = await supabase
        .from('custom_field_values')
        .select('id')
        .eq('contact_id', contact_id)
        .eq('custom_field_id', custom_field_id)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase.from('custom_field_values').update({ value }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('custom_field_values').insert({ contact_id, custom_field_id, value });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom_field_values'] }),
  });
}

// === AUTOMATIONS ===
type Automation = Tables<'automations'>;
type AutomationStep = Tables<'automation_steps'>;
type MessageLog = Tables<'message_logs'>;

export function useAutomations() {
  return useSupabaseQuery<Automation>('automations', 'automations');
}

export function useInsertAutomation() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (a: Omit<TablesInsert<'automations'>, 'user_id'>) => {
      const { data, error } = await supabase.from('automations').insert({ ...a, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  });
}

export function useUpdateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'automations'> & { id: string }) => {
      const { error } = await supabase.from('automations').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  });
}

export function useDeleteAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('automations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  });
}

export function useAutomationSteps(automationId?: string) {
  return useQuery<AutomationStep[]>({
    queryKey: ['automation_steps', automationId],
    queryFn: async () => {
      if (!automationId) return [];
      const { data, error } = await supabase
        .from('automation_steps')
        .select('*')
        .eq('automation_id', automationId)
        .order('step_order', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!automationId,
  });
}

export function useReplaceSteps() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ automationId, steps }: { automationId: string; steps: Omit<TablesInsert<'automation_steps'>, 'automation_id'>[] }) => {
      await supabase.from('automation_steps').delete().eq('automation_id', automationId);
      if (steps.length > 0) {
        const { error } = await supabase.from('automation_steps').insert(
          steps.map((s, i) => ({ ...s, automation_id: automationId, step_order: i }))
        );
        if (error) throw error;
      }
    },
    onSuccess: (_, { automationId }) => qc.invalidateQueries({ queryKey: ['automation_steps', automationId] }),
  });
}

export function useMessageLogs() {
  const { user } = useAuth();
  return useQuery<MessageLog[]>({
    queryKey: ['message_logs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('message_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}
