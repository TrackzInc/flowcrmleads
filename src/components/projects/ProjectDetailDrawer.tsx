import { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Project,
  useProjectChecklist,
  useInsertChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
  useProjectComments,
  useInsertComment,
  useUpdateProject,
  useDeleteProject,
  useProjectFiles,
  useUploadProjectFile,
  useDeleteProjectFile,
  FileCategoriesMetadata,
} from '@/hooks/useProjects';
import {
  PROJECT_STAGE_LABELS,
  PROJECT_STAGES,
  PRIORITY_LABELS,
  ProjectPriority,
  daysBetween,
} from '@/lib/projectConstants';
import {
  Trash2,
  Plus,
  Figma,
  FolderOpen,
  Globe,
  Server,
  Link as LinkIcon,
  FileIcon,
  FileText,
  FileImage,
  FileArchive,
  Download,
  AlertCircle,
  UploadCloud,
  X,
  MessageSquare,
  CheckCircle2,
  Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatFileSize } from '@/lib/helpers';
import { supabase } from '@/integrations/supabase/client';

type Props = {
  project: Project | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function ProjectDetailDrawer({ project, open, onOpenChange }: Props) {
  const { data: checklist = [] } = useProjectChecklist(project?.id);
  const { data: comments = [] } = useProjectComments(project?.id);
  const insertItem = useInsertChecklistItem();
  const updateItem = useUpdateChecklistItem();
  const deleteItem = useDeleteChecklistItem();
  const insertComment = useInsertComment();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [newItem, setNewItem] = useState('');
  const [newComment, setNewComment] = useState('');

  if (!project) return null;

  const completed = checklist.filter(c => c.done).length;
  const progress = checklist.length ? Math.round((completed / checklist.length) * 100) : project.progress ?? 0;

  const links = (project.links as Record<string, string>) ?? {};

  const setField = async (patch: Partial<Project>) => {
    try {
      await updateProject.mutateAsync({ id: project.id, ...patch });
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar');
    }
  };

  const setLink = (key: string, val: string) => {
    const next = { ...links, [key]: val };
    setField({ links: next as any, progress });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Input
              value={project.name}
              onChange={e => setField({ name: e.target.value })}
              className="text-lg font-semibold border-none px-0 focus-visible:ring-0"
            />
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-4">
          {/* Status + meta */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={project.status} onValueChange={v => setField({ status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_STAGES.map(s => (
                    <SelectItem key={s} value={s}>{PROJECT_STAGE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={project.priority} onValueChange={v => setField({ priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_LABELS) as ProjectPriority[]).map(p => (
                    <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Empresa</Label>
              <Input value={project.company ?? ''} onChange={e => setField({ company: e.target.value })} />
            </div>
            <div>
              <Label>Nicho</Label>
              <Input value={project.niche ?? ''} onChange={e => setField({ niche: e.target.value })} />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                value={project.value ?? 0}
                onChange={e => setField({ value: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Responsável</Label>
              <Input value={project.assignee ?? ''} onChange={e => setField({ assignee: e.target.value })} />
            </div>
            <div>
              <Label>Início</Label>
              <Input
                type="date"
                value={project.start_date ?? ''}
                onChange={e => setField({ start_date: e.target.value || null })}
              />
            </div>
            <div>
              <Label>Prazo final</Label>
              <Input
                type="date"
                value={project.deadline ?? ''}
                onChange={e => setField({ deadline: e.target.value || null })}
              />
            </div>
          </div>

          {/* Progresso */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Progresso</Label>
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} />
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>Tempo na etapa: {daysBetween(project.stage_changed_at)} dias</span>
              {project.deadline && (
                <span className={daysBetween(new Date(), new Date(project.deadline)) < 0 ? 'text-red-600 font-medium' : ''}>
                  {(() => {
                    const d = daysBetween(new Date(), new Date(project.deadline));
                    return d < 0 ? `Atrasado ${Math.abs(d)}d` : `${d}d para o prazo`;
                  })()}
                </span>
              )}
              {project.value ? <span>{formatCurrency(Number(project.value))}</span> : null}
            </div>
          </div>

          {/* Links rápidos */}
          <div>
            <Label className="mb-2 block">Links rápidos</Label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { key: 'figma', icon: Figma, label: 'Figma' },
                { key: 'drive', icon: FolderOpen, label: 'Drive' },
                { key: 'domain', icon: Globe, label: 'Domínio' },
                { key: 'hosting', icon: Server, label: 'Hospedagem' },
                { key: 'site', icon: LinkIcon, label: 'Site' },
              ].map(({ key, icon: Icon, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder={label}
                    value={links[key] ?? ''}
                    onChange={e => setLink(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Checklist */}
          <div>
            <Label className="mb-2 block">Checklist ({completed}/{checklist.length})</Label>
            <div className="space-y-1.5">
              {checklist.map(item => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <Checkbox
                    checked={item.done}
                    onCheckedChange={v =>
                      updateItem.mutate({ id: item.id, project_id: project.id, done: !!v })
                    }
                  />
                  <span className={`text-sm flex-1 ${item.done ? 'line-through text-muted-foreground' : ''}`}>
                    {item.label}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => deleteItem.mutate({ id: item.id, project_id: project.id })}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <Input
                  value={newItem}
                  placeholder="Adicionar item..."
                  onChange={e => setNewItem(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newItem.trim()) {
                      insertItem.mutate({
                        project_id: project.id,
                        label: newItem.trim(),
                        position: checklist.length,
                      });
                      setNewItem('');
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (!newItem.trim()) return;
                    insertItem.mutate({
                      project_id: project.id,
                      label: newItem.trim(),
                      position: checklist.length,
                    });
                    setNewItem('');
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
            <Label>Observações</Label>
            <Textarea
              value={project.notes ?? ''}
              onChange={e => setField({ notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Comentários (timeline) */}
          <div>
            <Label className="mb-2 block">Comentários internos</Label>
            <div className="flex gap-2 mb-3">
              <Input
                value={newComment}
                placeholder="Escreva um comentário..."
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newComment.trim()) {
                    insertComment.mutate({
                      project_id: project.id,
                      content: newComment.trim(),
                    });
                    setNewComment('');
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (!newComment.trim()) return;
                  insertComment.mutate({
                    project_id: project.id,
                    content: newComment.trim(),
                  });
                  setNewComment('');
                }}
              >
                Enviar
              </Button>
            </div>
            <div className="space-y-2 border-l-2 border-muted pl-3">
              {comments.map(c => (
                <div key={c.id} className="text-sm">
                  <p>{c.content}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(c.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum comentário ainda.</p>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (!confirm('Excluir este projeto?')) return;
                await deleteProject.mutateAsync(project.id);
                onOpenChange(false);
                toast.success('Projeto excluído');
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Excluir
            </Button>
            <Badge variant="secondary">{PROJECT_STAGE_LABELS[project.status as any] ?? project.status}</Badge>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}