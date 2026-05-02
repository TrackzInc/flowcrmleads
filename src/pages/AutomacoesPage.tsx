import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useAutomations, useInsertAutomation, useUpdateAutomation, useDeleteAutomation,
  useAutomationSteps, useReplaceSteps, useMessageLogs,
} from '@/hooks/useStore';
import { Plus, Trash2, Zap, Pencil, ArrowDown, Mail, MessageCircle, Tag, GitBranch, ListTodo, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { LEAD_STAGE_LABELS } from '@/types';

const TRIGGER_LABELS: Record<string, string> = {
  lead_created: 'Novo lead criado',
  stage_changed: 'Lead mudou de status',
  email_opened: 'Lead abriu email',
  email_clicked: 'Lead clicou em link',
  no_reply: 'Lead não respondeu (tempo decorrido)',
};

const ACTION_META: Record<string, { label: string; icon: any }> = {
  send_email: { label: 'Enviar email', icon: Mail },
  send_whatsapp: { label: 'Enviar WhatsApp', icon: MessageCircle },
  add_tag: { label: 'Adicionar tag', icon: Tag },
  move_stage: { label: 'Mover no pipeline', icon: GitBranch },
  create_task: { label: 'Criar tarefa', icon: ListTodo },
  wait: { label: 'Aguardar', icon: Clock },
};

interface StepDraft {
  action_type: string;
  delay_minutes: number;
  action_config: any;
}

function StepEditor({ steps, onChange }: { steps: StepDraft[]; onChange: (s: StepDraft[]) => void }) {
  const update = (i: number, patch: Partial<StepDraft>) => {
    const copy = [...steps];
    copy[i] = { ...copy[i], ...patch };
    onChange(copy);
  };
  const remove = (i: number) => onChange(steps.filter((_, idx) => idx !== i));
  const add = () => onChange([...steps, { action_type: 'send_email', delay_minutes: 0, action_config: {} }]);

  return (
    <div className="space-y-3">
      {steps.map((s, i) => {
        const Icon = ACTION_META[s.action_type]?.icon || Zap;
        return (
          <div key={i}>
            {i > 0 && (
              <div className="flex items-center justify-center my-2">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <Card className="border-2">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Passo {i + 1}</span>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(i)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Ação</Label>
                    <Select value={s.action_type} onValueChange={v => update(i, { action_type: v, action_config: {} })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ACTION_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Aguardar antes (minutos)</Label>
                    <Input type="number" min={0} value={s.delay_minutes} onChange={e => update(i, { delay_minutes: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>

                {s.action_type === 'send_email' && (
                  <>
                    <Input placeholder="Assunto (use {{nome}}, {{email}})" value={s.action_config.subject || ''} onChange={e => update(i, { action_config: { ...s.action_config, subject: e.target.value } })} />
                    <Textarea placeholder="Corpo do email" rows={3} value={s.action_config.content || ''} onChange={e => update(i, { action_config: { ...s.action_config, content: e.target.value } })} />
                  </>
                )}
                {s.action_type === 'send_whatsapp' && (
                  <Textarea placeholder="Mensagem WhatsApp (use {{nome}})" rows={3} value={s.action_config.content || ''} onChange={e => update(i, { action_config: { ...s.action_config, content: e.target.value } })} />
                )}
                {s.action_type === 'add_tag' && (
                  <Input placeholder="Nome da tag" value={s.action_config.tag || ''} onChange={e => update(i, { action_config: { ...s.action_config, tag: e.target.value } })} />
                )}
                {s.action_type === 'move_stage' && (
                  <Select value={s.action_config.stage || ''} onValueChange={v => update(i, { action_config: { ...s.action_config, stage: v } })}>
                    <SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(LEAD_STAGE_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {s.action_type === 'create_task' && (
                  <Input placeholder="Título da tarefa (use {{nome}})" value={s.action_config.title || ''} onChange={e => update(i, { action_config: { ...s.action_config, title: e.target.value } })} />
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
      <Button variant="outline" size="sm" className="w-full" onClick={add}><Plus className="h-3 w-3 mr-1" /> Adicionar passo</Button>
    </div>
  );
}

function AutomationDialog({ open, onOpenChange, automationId }: { open: boolean; onOpenChange: (v: boolean) => void; automationId?: string }) {
  const { data: automations = [] } = useAutomations();
  const insert = useInsertAutomation();
  const update = useUpdateAutomation();
  const replaceSteps = useReplaceSteps();
  const { data: existingSteps = [] } = useAutomationSteps(automationId);

  const editing = automations.find(a => a.id === automationId);
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('lead_created');
  const [active, setActive] = useState(true);
  const [steps, setSteps] = useState<StepDraft[]>([]);

  useEffect(() => {
    if (open) {
      setName(editing?.name || '');
      setTrigger(editing?.trigger_type || 'lead_created');
      setActive(editing?.active ?? true);
      setSteps(existingSteps.map(s => ({
        action_type: s.action_type,
        delay_minutes: s.delay_minutes,
        action_config: s.action_config || {},
      })));
    }
  }, [open, editing?.id, existingSteps.length]);

  const save = async () => {
    if (!name.trim()) { toast.error('Nome obrigatório'); return; }
    try {
      let id = automationId;
      if (id) {
        await update.mutateAsync({ id, name, trigger_type: trigger, active });
      } else {
        const created = await insert.mutateAsync({ name, trigger_type: trigger, active, trigger_config: {} });
        id = created.id;
      }
      await replaceSteps.mutateAsync({ automationId: id!, steps: steps.map(s => ({ action_type: s.action_type, delay_minutes: s.delay_minutes, action_config: s.action_config, step_order: 0 })) });
      toast.success('Automação salva');
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{automationId ? 'Editar' : 'Nova'} Automação</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Boas-vindas novo lead" />
          </div>
          <div>
            <Label>Gatilho</Label>
            <Select value={trigger} onValueChange={setTrigger}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TRIGGER_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={active} onCheckedChange={setActive} />
            <Label>Ativa</Label>
          </div>
          <div>
            <Label className="text-base">Fluxo de ações</Label>
            <p className="text-xs text-muted-foreground mb-2">As ações são executadas em ordem. Use variáveis: {'{{nome}}, {{email}}, {{telefone}}'}</p>
            <StepEditor steps={steps} onChange={setSteps} />
          </div>
          <Button className="w-full" onClick={save}>Salvar Automação</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AutomacoesPage() {
  const { data: automations = [] } = useAutomations();
  const update = useUpdateAutomation();
  const del = useDeleteAutomation();
  const { data: logs = [] } = useMessageLogs();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();

  const stats = {
    total: logs.length,
    sent: logs.filter(l => l.status === 'sent').length,
    pending: logs.filter(l => l.status === 'pending').length,
    error: logs.filter(l => l.status === 'error').length,
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Zap className="h-6 w-6 text-primary" /> Automações</h1>
            <p className="text-sm text-muted-foreground">Crie fluxos automáticos de Email e WhatsApp para seus leads</p>
          </div>
          <Button onClick={() => { setEditingId(undefined); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Nova Automação
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total enviadas</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Entregues</p><p className="text-2xl font-bold text-success">{stats.sent}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Pendentes</p><p className="text-2xl font-bold text-warning">{stats.pending}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Erros</p><p className="text-2xl font-bold text-destructive">{stats.error}</p></CardContent></Card>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-3">Fluxos</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {automations.map(a => (
              <Card key={a.id}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">{a.name}</p>
                      <Badge variant="outline" className="mt-1 text-[10px]">{TRIGGER_LABELS[a.trigger_type] || a.trigger_type}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={a.active} onCheckedChange={v => update.mutate({ id: a.id, active: v })} />
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingId(a.id); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { if (confirm('Excluir?')) del.mutate(a.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {automations.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full text-center py-8">
                Nenhuma automação criada. Clique em "Nova Automação" para começar.
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-3">Logs de mensagens (últimas 50)</h2>
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.slice(0, 50).map(l => {
                  const Icon = l.status === 'sent' ? CheckCircle : l.status === 'error' ? XCircle : AlertCircle;
                  const color = l.status === 'sent' ? 'text-success' : l.status === 'error' ? 'text-destructive' : 'text-warning';
                  return (
                    <div key={l.id} className="flex items-center gap-3 py-2 border-b last:border-0 text-sm">
                      <Icon className={`h-4 w-4 ${color}`} />
                      <Badge variant="outline" className="text-[10px]">{l.channel}</Badge>
                      <span className="flex-1 truncate">{l.recipient}</span>
                      <span className="text-xs text-muted-foreground">{l.subject || l.content?.slice(0, 40)}</span>
                      <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                  );
                })}
                {logs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma mensagem registrada ainda.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AutomationDialog open={open} onOpenChange={setOpen} automationId={editingId} />
    </AppLayout>
  );
}