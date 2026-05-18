import { useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Plus, Search, AlertCircle, Clock, Calendar } from 'lucide-react';
import { useProjects, useUpdateProject, Project } from '@/hooks/useProjects';
import {
  PROJECT_STAGES,
  PROJECT_STAGE_LABELS,
  PROJECT_STAGE_COLORS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  ProjectPriority,
  daysBetween,
} from '@/lib/projectConstants';
import { NewProjectDialog } from '@/components/projects/NewProjectDialog';
import { ProjectDetailDrawer } from '@/components/projects/ProjectDetailDrawer';
import { formatCurrency } from '@/lib/helpers';

function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: project.id });
  const overdue = project.deadline && daysBetween(new Date(), new Date(project.deadline)) < 0;
  const stalled = daysBetween(project.stage_changed_at) >= 5;

  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      className={`cursor-grab active:cursor-grabbing transition shadow-sm hover:shadow-md ${
        isDragging ? 'opacity-40' : ''
      } ${overdue ? 'border-red-300' : ''}`}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-tight">{project.name}</p>
          <Badge className={`text-[10px] px-1.5 py-0 ${PRIORITY_COLORS[project.priority as ProjectPriority]}`}>
            {PRIORITY_LABELS[project.priority as ProjectPriority] ?? project.priority}
          </Badge>
        </div>
        {project.company && (
          <p className="text-[11px] text-muted-foreground truncate">{project.company}</p>
        )}
        <Progress value={project.progress ?? 0} className="h-1.5" />
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {daysBetween(project.stage_changed_at)}d na etapa
          </span>
          {project.deadline && (
            <span className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-medium' : ''}`}>
              {overdue && <AlertCircle className="h-3 w-3" />}
              <Calendar className="h-3 w-3" />
              {new Date(project.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </span>
          )}
        </div>
        {(project.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.tags!.slice(0, 3).map(t => (
              <Badge key={t} variant="secondary" className="text-[9px] px-1 py-0">{t}</Badge>
            ))}
          </div>
        )}
        {Number(project.value) > 0 && (
          <p className="text-[11px] font-semibold text-primary">{formatCurrency(Number(project.value))}</p>
        )}
        {stalled && !overdue && (
          <p className="text-[10px] text-amber-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Parado há {daysBetween(project.stage_changed_at)}d
          </p>
        )}
        {project.assignee && (
          <p className="text-[10px] text-muted-foreground">@{project.assignee}</p>
        )}
      </CardContent>
    </Card>
  );
}

function Column({
  stage,
  projects,
  onOpen,
}: {
  stage: string;
  projects: Project[];
  onOpen: (p: Project) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={`min-w-[260px] w-[260px] flex-shrink-0 bg-muted/40 rounded-lg border-t-4 ${
        PROJECT_STAGE_COLORS[stage as keyof typeof PROJECT_STAGE_COLORS]
      } ${isOver ? 'ring-2 ring-primary/40' : ''}`}
    >
      <div className="p-3 pb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {PROJECT_STAGE_LABELS[stage as keyof typeof PROJECT_STAGE_LABELS]}
        </h3>
        <Badge variant="secondary" className="text-xs">{projects.length}</Badge>
      </div>
      <div className="p-2 space-y-2 min-h-[120px]">
        {projects.map(p => (
          <ProjectCard key={p.id} project={p} onOpen={() => onOpen(p)} />
        ))}
      </div>
    </div>
  );
}

export default function ProjetosPage() {
  const { data: projects = [] } = useProjects();
  const updateProject = useUpdateProject();
  const [newOpen, setNewOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [dragging, setDragging] = useState<Project | null>(null);
  const [search, setSearch] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return projects;
    return projects.filter(p =>
      [p.name, p.company, p.notes, ...(p.tags ?? [])].filter(Boolean).join(' ').toLowerCase().includes(q),
    );
  }, [projects, search]);

  const byStage = useMemo(() => {
    const map: Record<string, Project[]> = {};
    PROJECT_STAGES.forEach(s => (map[s] = []));
    filtered.forEach(p => {
      if (map[p.status]) map[p.status].push(p);
      else (map[p.status] = [p]);
    });
    return map;
  }, [filtered]);

  const handleDragStart = (e: DragStartEvent) => {
    setDragging(projects.find(p => p.id === e.active.id) ?? null);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setDragging(null);
    if (!e.over) return;
    const id = String(e.active.id);
    const newStatus = String(e.over.id);
    const p = projects.find(p => p.id === id);
    if (!p || p.status === newStatus) return;
    await updateProject.mutateAsync({ id, status: newStatus });
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Projetos</h1>
            <p className="text-sm text-muted-foreground">Central operacional pós-fechamento</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar projeto..."
                className="pl-8 w-[220px]"
              />
            </div>
            <Button onClick={() => setNewOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Novo projeto
            </Button>
          </div>
        </div>

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {PROJECT_STAGES.map(stage => (
              <Column
                key={stage}
                stage={stage}
                projects={byStage[stage] ?? []}
                onOpen={p => {
                  setActiveProject(p);
                  setDetailOpen(true);
                }}
              />
            ))}
          </div>
          <DragOverlay>
            {dragging && (
              <Card className="w-[240px] shadow-lg">
                <CardContent className="p-3">
                  <p className="text-sm font-medium">{dragging.name}</p>
                </CardContent>
              </Card>
            )}
          </DragOverlay>
        </DndContext>

        <NewProjectDialog open={newOpen} onOpenChange={setNewOpen} />
        <ProjectDetailDrawer
          project={activeProject}
          open={detailOpen}
          onOpenChange={v => {
            setDetailOpen(v);
            if (!v) setActiveProject(null);
          }}
        />
      </div>
    </AppLayout>
  );
}