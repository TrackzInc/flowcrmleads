import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Using standard shadcn Drawer component
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle,
  DrawerFooter
} from "@/components/ui/drawer";

interface SortableItemProps {
  id: string;
  onRemove: (id: string) => void;
  children: React.ReactNode;
}

function SortableItem({ id, onRemove, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 bg-white p-3 rounded-lg border shadow-sm mb-2 group">
      <div {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-600">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex-1">{children}</div>
      <Button 
        variant="ghost" 
        size="sm" 
        className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-opacity"
        onClick={() => onRemove(id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function TemplateEditorDrawer({ open, onOpenChange, template }: any) {
  const queryClient = useQueryClient();
  const [pipeline, setPipeline] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [fileCategories, setFileCategories] = useState<any[]>([]);

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      name: '',
      default_duration_days: 28,
    }
  });

  useEffect(() => {
    if (template) {
      reset({
        name: template.name,
        default_duration_days: template.default_duration_days,
      });
      setPipeline(template.pipeline || []);
      setChecklist(template.checklist || []);
      setTasks(template.tasks || []);
      setFileCategories(template.file_categories || []);
    } else {
      reset({
        name: '',
        default_duration_days: 28,
      });
      setPipeline([]);
      setChecklist([]);
      setTasks([]);
      setFileCategories([]);
    }
  }, [template, reset]);

  const saveMutation = useMutation({
    mutationFn: async (formData: any) => {
      const payload = {
        ...formData,
        pipeline,
        checklist,
        tasks,
        file_categories: fileCategories,
        project_type: 'custom', // Default for user templates
        user_id: (await supabase.auth.getUser()).data.user?.id,
      };

      if (template) {
        const { error } = await supabase
          .from('project_templates')
          .update(payload)
          .eq('id', template.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('project_templates')
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
      toast.success(template ? 'Template atualizado' : 'Template criado');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao salvar template');
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any, items: any[], setItems: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((item) => (typeof item === 'string' ? item === active.id : item.id === active.id));
      const newIndex = items.findIndex((item) => (typeof item === 'string' ? item === over.id : item.id === over.id));
      setItems(arrayMove(items, oldIndex, newIndex));
    }
  };

  const addItem = (setItems: any, defaultItem: any) => {
    setItems((prev: any) => [...prev, defaultItem]);
  };

  const removeItem = (setItems: any, id: string, idField?: string) => {
    setItems((prev: any) => prev.filter((item: any) => (idField ? item[idField] !== id : item !== id)));
  };

  const updateItem = (setItems: any, id: string, field: string, value: any, idField: string = 'id') => {
    setItems((prev: any) => prev.map((item: any) => item[idField] === id ? { ...item, [field]: value } : item));
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="mx-auto w-full max-w-4xl overflow-hidden flex flex-col h-full">
          <DrawerHeader>
            <DrawerTitle>
              {template ? `Editar Template: ${template.name}` : 'Novo Template de Projeto'}
            </DrawerTitle>
          </DrawerHeader>

          <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="flex-1 overflow-hidden flex flex-col">
            <Tabs defaultValue="geral" className="flex-1 flex flex-col overflow-hidden px-6">
              <TabsList className="grid grid-cols-5 mb-6">
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="kanban">Kanban</TabsTrigger>
                <TabsTrigger value="checklist">Checklist</TabsTrigger>
                <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
                <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 pr-4">
                <TabsContent value="geral" className="space-y-4 pt-2">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome do template</Label>
                    <Input id="name" {...register('name')} placeholder="Ex: Site Institucional" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="duration">Duração padrão (dias)</Label>
                    <Input id="duration" type="number" {...register('default_duration_days')} placeholder="28" />
                  </div>
                </TabsContent>

                <TabsContent value="kanban" className="pt-2">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, pipeline, setPipeline)}>
                    <SortableContext items={pipeline} strategy={verticalListSortingStrategy}>
                      {pipeline.map((step) => (
                        <SortableItem key={step} id={step} onRemove={(id) => removeItem(setPipeline, id)}>
                          <Input 
                            value={step} 
                            onChange={(e) => {
                              const newVal = e.target.value;
                              setPipeline(prev => prev.map(s => s === step ? newVal : s));
                            }} 
                            className="bg-transparent border-none focus-visible:ring-0 px-0"
                          />
                        </SortableItem>
                      ))}
                    </SortableContext>
                  </DndContext>
                  <Button type="button" variant="outline" size="sm" className="w-full mt-2 gap-2" onClick={() => addItem(setPipeline, `Nova Etapa ${pipeline.length + 1}`)}>
                    <Plus className="h-4 w-4" /> Adicionar Etapa
                  </Button>
                </TabsContent>

                <TabsContent value="checklist" className="pt-2">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, checklist, setChecklist)}>
                    <SortableContext items={checklist.map(c => c.id || c.label)} strategy={verticalListSortingStrategy}>
                      {checklist.map((item, idx) => {
                        const id = item.id || `item-${idx}`;
                        return (
                          <SortableItem key={id} id={id} onRemove={() => setChecklist(prev => prev.filter((_, i) => i !== idx))}>
                            <Input 
                              value={item.label} 
                              onChange={(e) => {
                                const newVal = e.target.value;
                                setChecklist(prev => prev.map((c, i) => i === idx ? { ...c, label: newVal } : c));
                              }}
                              placeholder="Título do item"
                              className="bg-transparent border-none focus-visible:ring-0 px-0"
                            />
                          </SortableItem>
                        );
                      })}
                    </SortableContext>
                  </DndContext>
                  <Button type="button" variant="outline" size="sm" className="w-full mt-2 gap-2" onClick={() => addItem(setChecklist, { label: '', id: crypto.randomUUID() })}>
                    <Plus className="h-4 w-4" /> Adicionar Item
                  </Button>
                </TabsContent>

                <TabsContent value="tarefas" className="pt-2">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, tasks, setTasks)}>
                    <SortableContext items={tasks.map(t => t.id || t.title)} strategy={verticalListSortingStrategy}>
                      {tasks.map((task, idx) => {
                        const id = task.id || `task-${idx}`;
                        return (
                          <SortableItem key={id} id={id} onRemove={() => setTasks(prev => prev.filter((_, i) => i !== idx))}>
                            <div className="flex gap-4">
                              <Input 
                                value={task.title} 
                                onChange={(e) => {
                                  const newVal = e.target.value;
                                  setTasks(prev => prev.map((t, i) => i === idx ? { ...t, title: newVal } : t));
                                }}
                                placeholder="Título da tarefa"
                                className="flex-1 bg-transparent border-none focus-visible:ring-0 px-0"
                              />
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">Dia</span>
                                <Input 
                                  type="number"
                                  value={task.day_offset} 
                                  onChange={(e) => {
                                    const newVal = parseInt(e.target.value);
                                    setTasks(prev => prev.map((t, i) => i === idx ? { ...t, day_offset: newVal } : t));
                                  }}
                                  className="w-16 h-8 text-center"
                                />
                              </div>
                            </div>
                          </SortableItem>
                        );
                      })}
                    </SortableContext>
                  </DndContext>
                  <Button type="button" variant="outline" size="sm" className="w-full mt-2 gap-2" onClick={() => addItem(setTasks, { title: '', day_offset: 0, id: crypto.randomUUID() })}>
                    <Plus className="h-4 w-4" /> Adicionar Tarefa
                  </Button>
                </TabsContent>

                <TabsContent value="arquivos" className="pt-2">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, fileCategories, setFileCategories)}>
                    <SortableContext items={fileCategories.map(f => f.id || f.name)} strategy={verticalListSortingStrategy}>
                      {fileCategories.map((file, idx) => {
                        const id = file.id || `file-${idx}`;
                        return (
                          <SortableItem key={id} id={id} onRemove={() => setFileCategories(prev => prev.filter((_, i) => i !== idx))}>
                            <div className="space-y-1">
                              <Input 
                                value={file.name} 
                                onChange={(e) => {
                                  const newVal = e.target.value;
                                  setFileCategories(prev => prev.map((f, i) => i === idx ? { ...f, name: newVal } : f));
                                }}
                                placeholder="Nome da categoria"
                                className="font-medium bg-transparent border-none focus-visible:ring-0 px-0 h-auto py-0"
                              />
                              <Input 
                                value={file.description} 
                                onChange={(e) => {
                                  const newVal = e.target.value;
                                  setFileCategories(prev => prev.map((f, i) => i === idx ? { ...f, description: newVal } : f));
                                }}
                                placeholder="Descrição (opcional)"
                                className="text-xs text-slate-500 bg-transparent border-none focus-visible:ring-0 px-0 h-auto py-0"
                              />
                            </div>
                          </SortableItem>
                        );
                      })}
                    </SortableContext>
                  </DndContext>
                  <Button type="button" variant="outline" size="sm" className="w-full mt-2 gap-2" onClick={() => addItem(setFileCategories, { name: '', description: '', id: crypto.randomUUID() })}>
                    <Plus className="h-4 w-4" /> Adicionar Categoria
                  </Button>
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <DrawerFooter className="px-6 border-t mt-auto">
              <div className="flex gap-3 justify-end w-full">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </DrawerFooter>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
