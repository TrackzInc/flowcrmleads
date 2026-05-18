import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Project = Tables<'projects'>;
export type ProjectChecklistItem = Tables<'project_checklist_items'>;
export type ProjectComment = Tables<'project_comments'>;
export type ProjectTemplate = Tables<'project_templates'>;

export function useProjects() {
  const { user } = useAuth();
  return useQuery<Project[]>({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useInsertProject() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (p: Omit<TablesInsert<'projects'>, 'user_id'>) => {
      const { data, error } = await supabase
        .from('projects')
        .insert({ ...p, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'projects'> & { id: string }) => {
      const { error } = await supabase.from('projects').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useProjectTemplates() {
  const { user } = useAuth();
  return useQuery<ProjectTemplate[]>({
    queryKey: ['project_templates', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_templates')
        .select('*')
        .order('is_system', { ascending: false })
        .order('name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useProjectChecklist(projectId?: string) {
  const { user } = useAuth();
  return useQuery<ProjectChecklistItem[]>({
    queryKey: ['project_checklist', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_checklist_items')
        .select('*')
        .eq('project_id', projectId)
        .order('position', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!projectId,
  });
}

export function useInsertChecklistItem() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (item: Omit<TablesInsert<'project_checklist_items'>, 'user_id'>) => {
      const { error } = await supabase
        .from('project_checklist_items')
        .insert({ ...item, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ['project_checklist', v.project_id] }),
  });
}

export function useUpdateChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      project_id,
      ...updates
    }: TablesUpdate<'project_checklist_items'> & { id: string; project_id: string }) => {
      const { error } = await supabase
        .from('project_checklist_items')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ['project_checklist', v.project_id] }),
  });
}

export function useDeleteChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; project_id: string }) => {
      const { error } = await supabase
        .from('project_checklist_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ['project_checklist', v.project_id] }),
  });
}

export function useProjectComments(projectId?: string) {
  const { user } = useAuth();
  return useQuery<ProjectComment[]>({
    queryKey: ['project_comments', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_comments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!projectId,
  });
}

export function useInsertComment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (c: Omit<TablesInsert<'project_comments'>, 'user_id'>) => {
      const { error } = await supabase
        .from('project_comments')
        .insert({ ...c, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ['project_comments', v.project_id] }),
  });
}

/**
 * Cria um projeto a partir de um template, semeando a checklist.
 */
export async function createProjectFromTemplate(opts: {
  user_id: string;
  template: ProjectTemplate;
  name: string;
  contact_id?: string | null;
  company?: string;
  value?: number;
  notes?: string;
}) {
  const pipeline = Array.isArray(opts.template.pipeline)
    ? (opts.template.pipeline as string[])
    : [];
  const initialStatus = pipeline[0] ?? 'aguardando_pagamento';

  const { data: project, error: projErr } = await supabase
    .from('projects')
    .insert({
      user_id: opts.user_id,
      name: opts.name,
      contact_id: opts.contact_id ?? null,
      company: opts.company ?? '',
      project_type: opts.template.project_type,
      value: opts.value ?? 0,
      notes: opts.notes ?? '',
      template_id: opts.template.id,
      status: initialStatus,
      start_date: new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();
  if (projErr) throw projErr;

  const checklist = Array.isArray(opts.template.checklist)
    ? (opts.template.checklist as string[])
    : [];
  if (checklist.length > 0) {
    const rows = checklist.map((label, idx) => ({
      project_id: project.id,
      user_id: opts.user_id,
      label,
      position: idx,
    }));
    const { error: chkErr } = await supabase
      .from('project_checklist_items')
      .insert(rows);
    if (chkErr) throw chkErr;
  }

  return project;
}