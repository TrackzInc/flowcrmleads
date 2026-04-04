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
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'contacts'> & { id: string }) => {
      const { error } = await supabase.from('contacts').update(updates).eq('id', id);
      if (error) throw error;
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
