import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Plus, 
  Settings2, 
  Trash2, 
  Monitor, 
  Layout, 
  ShoppingCart, 
  Palette, 
  Wrench,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { TemplateEditorDrawer } from '@/components/projects/TemplateEditorDrawer';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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

  const getTemplateIcon = (projectType: string) => {
    switch (projectType) {
      case 'site':
        return <Monitor className="h-5 w-5 text-blue-500" />;
      case 'landing':
        return <Layout className="h-5 w-5 text-indigo-500" />;
      case 'ecommerce':
        return <ShoppingCart className="h-5 w-5 text-emerald-500" />;
      case 'identidade':
        return <Palette className="h-5 w-5 text-purple-500" />;
      case 'manutencao':
        return <Wrench className="h-5 w-5 text-orange-500" />;
      default:
        return <FileText className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-white">
        <AppSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Templates de projeto</h1>
                <p className="text-slate-500 mt-1">Configure os modelos operacionais para seus projetos.</p>
              </div>
              <Button onClick={handleCreate} className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                Novo Template
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64 text-slate-400">
                <div className="animate-pulse">Carregando templates...</div>
              </div>
            ) : (
              <div className="space-y-1">
                {templates?.map((template, index) => (
                  <div key={template.id}>
                    <div className="group flex items-center justify-between py-4 px-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          {getTemplateIcon(template.project_type)}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{template.name}</span>
                            {template.is_system && (
                              <Badge variant="secondary" className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none text-[10px] h-4 px-1.5 uppercase font-bold">
                                Sistema
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-slate-500">
                            Duração padrão: {template.default_duration_days} dias
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-slate-600 gap-2 hover:bg-white hover:shadow-sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Settings2 className="h-4 w-4" />
                          Editar
                        </Button>
                        {!template.is_system && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-slate-400 hover:text-destructive hover:bg-white hover:shadow-sm"
                            onClick={() => handleDelete(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {index < (templates?.length || 0) - 1 && (
                      <Separator className="bg-slate-100/80" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

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
