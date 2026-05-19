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
  const { data: files = [] } = useProjectFiles(project?.id);

  const insertItem = useInsertChecklistItem();
  const updateItem = useUpdateChecklistItem();
  const deleteItem = useDeleteChecklistItem();
  const insertComment = useInsertComment();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const uploadFile = useUploadProjectFile();
  const deleteFile = useDeleteProjectFile();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [newItem, setNewItem] = useState('');
  const [newComment, setNewComment] = useState('');

  if (!project) return null;

  const completed = checklist.filter(c => c.done).length;
  const progress = checklist.length ? Math.round((completed / checklist.length) * 100) : project.progress ?? 0;

  const categories = (project.file_categories as string[]) || [];
  const metadata = (project.file_categories_metadata as FileCategoriesMetadata) || {};

  const pendingCategories = categories.filter(cat => (metadata[cat]?.status || 'Pendente') === 'Pendente');

  const getFileIcon = (contentType?: string | null) => {
    if (!contentType) return FileIcon;
    if (contentType.startsWith('image/')) return FileImage;
    if (contentType.includes('pdf')) return FileText;
    if (contentType.includes('zip') || contentType.includes('rar')) return FileArchive;
    return FileText;
  };

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

        <Tabs defaultValue="geral" className="mt-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="arquivos" className="relative">
              Arquivos
              {pendingCategories.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="comentarios">Notas</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-6 pt-4">
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
          </TabsContent>

          <TabsContent value="checklist" className="pt-4 space-y-4">
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
          </TabsContent>

          <TabsContent value="arquivos" className="pt-4 space-y-4">
            {pendingCategories.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Categorias Pendentes</p>
                  <p className="text-xs text-amber-700">Ainda existem {pendingCategories.length} categorias esperando arquivos.</p>
                </div>
              </div>
            )}

            <Accordion type="single" collapsible className="space-y-2">
              {categories.map((category) => {
                const categoryFiles = files.filter(f => f.category === category);
                const catMeta = metadata[category] || { status: 'Pendente', observation: '' };
                const Icon = categoryFiles.length > 0 ? CheckCircle2 : Paperclip;

                return (
                  <AccordionItem key={category} value={category} className="border rounded-lg px-2 bg-white">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3 text-left w-full mr-2">
                        <Icon className={`h-4 w-4 shrink-0 ${categoryFiles.length > 0 ? 'text-green-500' : 'text-slate-400'}`} />
                        <span className="text-sm font-medium flex-1">{category}</span>
                        <Badge variant="outline" className={`text-[10px] font-medium ${
                          catMeta.status === 'Aprovado' ? 'bg-green-50 text-green-700 border-green-200' :
                          catMeta.status === 'Recebido' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          catMeta.status === 'Em revisão' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {catMeta.status}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 px-1">
                      {/* Lista de arquivos */}
                      <div className="space-y-2">
                        {categoryFiles.map(file => {
                          const FileIconComp = getFileIcon(file.content_type);
                          return (
                            <div key={file.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-md group">
                              <FileIconComp className="h-4 w-4 text-slate-400" />
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-xs font-medium truncate">{file.name}</span>
                                <span className="text-[10px] text-slate-400">
                                  {formatFileSize(file.size)} • {new Date(file.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7" 
                                  onClick={async () => {
                                    const { data } = await supabase.storage.from('project-files').createSignedUrl(file.file_path, 60);
                                    if (data?.signedUrl) window.open(data.signedUrl);
                                  }}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => deleteFile.mutate({ id: file.id, projectId: project.id, filePath: file.file_path })}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Área de Upload */}
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !activeCategory) return;
                            
                            try {
                              const promise = uploadFile.mutateAsync({ projectId: project.id, category: activeCategory, file });
                              toast.promise(promise, {
                                loading: 'Enviando arquivo...',
                                success: 'Arquivo enviado!',
                                error: 'Erro ao enviar'
                              });
                              
                              await promise;
                              
                              // Auto update status to Recebido
                              const newMeta = { ...metadata };
                              newMeta[activeCategory] = {
                                ...catMeta,
                                status: 'Recebido'
                              };
                              setField({ file_categories_metadata: newMeta });
                              
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full gap-2 border-dashed"
                          onClick={() => {
                            setActiveCategory(category);
                            fileInputRef.current?.click();
                          }}
                        >
                          <UploadCloud className="h-4 w-4" />
                          Anexar arquivo
                        </Button>
                      </div>

                      {/* Status e Obs */}
                      <div className="grid grid-cols-1 gap-3 pt-2">
                        <div>
                          <Label className="text-[10px] uppercase text-slate-400 font-bold mb-1.5 block">Status da Categoria</Label>
                          <Select 
                            value={catMeta.status} 
                            onValueChange={(v: any) => {
                              const newMeta = { ...metadata };
                              newMeta[category] = { ...catMeta, status: v };
                              setField({ file_categories_metadata: newMeta });
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pendente">Pendente</SelectItem>
                              <SelectItem value="Recebido">Recebido</SelectItem>
                              <SelectItem value="Em revisão">Em revisão</SelectItem>
                              <SelectItem value="Aprovado">Aprovado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-[10px] uppercase text-slate-400 font-bold mb-1.5 block">Observação</Label>
                          <Textarea 
                            className="text-xs min-h-[60px]"
                            placeholder="Adicione uma nota..."
                            value={catMeta.observation}
                            onBlur={(e) => {
                              const newMeta = { ...metadata };
                              newMeta[category] = { ...catMeta, observation: e.target.value };
                              setField({ file_categories_metadata: newMeta });
                            }}
                            onChange={(e) => {
                              // We use onBlur to save to database to avoid too many updates, but we could sync state if needed
                            }}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </TabsContent>

          <TabsContent value="comentarios" className="pt-4 space-y-6">
            {/* Notas */}
            <div>
              <Label>Observações do Projeto</Label>
              <Textarea
                value={project.notes ?? ''}
                onChange={e => setField({ notes: e.target.value })}
                rows={5}
                className="mt-1"
                placeholder="Notas gerais sobre o projeto..."
              />
            </div>

            {/* Comentários (timeline) */}
            <div>
              <Label className="mb-2 block flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Comentários internos
              </Label>
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
              <div className="space-y-4 border-l-2 border-slate-100 pl-4 py-2">
                {comments.map(c => (
                  <div key={c.id} className="text-sm bg-slate-50 p-3 rounded-lg relative group">
                    <p className="text-slate-700 whitespace-pre-wrap">{c.content}</p>
                    <p className="text-[10px] text-slate-400 mt-2">
                      {new Date(c.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Nenhum comentário ainda.</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-8 mt-8 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-destructive hover:bg-destructive/5"
            onClick={async () => {
              if (!confirm('Excluir este projeto?')) return;
              await deleteProject.mutateAsync(project.id);
              onOpenChange(false);
              toast.success('Projeto excluído');
            }}
          >
            <Trash2 className="h-4 w-4 mr-1.5" /> Excluir Projeto
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Status Atual:</span>
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
              {PROJECT_STAGE_LABELS[project.status as any] ?? project.status}
            </Badge>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}