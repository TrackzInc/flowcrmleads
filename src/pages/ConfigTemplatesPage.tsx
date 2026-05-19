import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Settings2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { TemplateEditorDrawer } from '@/components/projects/TemplateEditorDrawer';

export default function ConfigTemplatesPage() {
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['project-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_templates')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
      toast.success('Template excluído com sucesso');
    },
    onError: () => {
      toast.error('Erro ao excluir template');
    },
  });

  const handleCreate = () => {
    setEditingTemplate(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setIsDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este template?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50/50">
        <AppSidebar />
        <main className="flex-1 p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Templates de projeto</h1>
              <p className="text-slate-500">Configure os modelos operacionais para seus projetos.</p>
            </div>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Template
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">Carregando templates...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates?.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{template.name}</CardTitle>
                      {template.is_system && (
                        <span className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                          Sistema
                        </span>
                      )}
                    </div>
                    <CardDescription>
                      Duração padrão: {template.default_duration_days} dias
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-2"
                        onClick={() => handleEdit(template)}
                      >
                        <Settings2 className="h-4 w-4" />
                        Editar
                      </Button>
                      {!template.is_system && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive hover:text-destructive gap-2"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <TemplateEditorDrawer 
            open={isDrawerOpen} 
            onOpenChange={setIsDrawerOpen}
            template={editingTemplate}
          />
        </main>
      </div>
    </SidebarProvider>
  );
}
