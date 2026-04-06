import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useTasks, useContacts, useInsertTask, useUpdateTask, useDeleteTask, useUpdateContact } from '@/hooks/useStore';
import { formatDate, formatCurrency, isOverdue } from '@/lib/helpers';
import { Plus, AlertTriangle, MessageCircle, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { WhatsAppTemplateSelector } from '@/components/WhatsAppTemplateSelector';

export default function TarefasPage() {
  const { data: tasks = [] } = useTasks();
  const { data: contacts = [] } = useContacts();
  const insertTask = useInsertTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const updateContact = useUpdateContact();

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('pending');
  const [form, setForm] = useState({ title: '', dueDate: new Date().toISOString().split('T')[0], contactId: '' });
  const [waOpen, setWaOpen] = useState(false);
  const [waLead, setWaLead] = useState<any>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');

  // Follow-up leads
  const leadsWithFollowup = useMemo(() => contacts.filter(c => c.is_lead && c.next_contact_date), [contacts]);
  const overdueLeads = useMemo(() => leadsWithFollowup.filter(l => isOverdue(l.next_contact_date)), [leadsWithFollowup]);
  const todayLeads = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return leadsWithFollowup.filter(l => l.next_contact_date === today);
  }, [leadsWithFollowup]);
  const futureLeads = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return leadsWithFollowup.filter(l => l.next_contact_date! > today);
  }, [leadsWithFollowup]);

  const handleSave = async () => {
    if (!form.title) return;
    try {
      await insertTask.mutateAsync({
        title: form.title,
        due_date: form.dueDate,
        contact_id: form.contactId && form.contactId !== 'none' ? form.contactId : null,
      });
      setOpen(false);
      setForm({ title: '', dueDate: new Date().toISOString().split('T')[0], contactId: '' });
    } catch { toast.error('Erro ao criar tarefa'); }
  };

  const toggle = async (id: string, done: boolean) => {
    try { await updateTask.mutateAsync({ id, done: !done }); } catch { toast.error('Erro'); }
  };

  const remove = async (id: string) => {
    try { await deleteTask.mutateAsync(id); } catch { toast.error('Erro ao excluir'); }
  };

  const markFollowupDone = async (leadId: string) => {
    try {
      await updateContact.mutateAsync({ id: leadId, next_contact_date: null });
      toast.success('Follow-up marcado como feito');
    } catch { toast.error('Erro'); }
  };

  const reschedule = async (leadId: string) => {
    if (!rescheduleDate) return;
    try {
      await updateContact.mutateAsync({ id: leadId, next_contact_date: rescheduleDate });
      setRescheduleId(null);
      setRescheduleDate('');
      toast.success('Reagendado');
    } catch { toast.error('Erro ao reagendar'); }
  };

  const openWhatsApp = (lead: any) => {
    setWaLead(lead);
    setWaOpen(true);
  };

  const filtered = useMemo(() => {
    return tasks
      .filter(t => filter === 'all' || (filter === 'pending' ? !t.done : t.done))
      .sort((a, b) => {
        if (!a.done && isOverdue(a.due_date)) return -1;
        if (!b.done && isOverdue(b.due_date)) return 1;
        return new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime();
      });
  }, [tasks, filter]);

  const overdueCount = tasks.filter(t => !t.done && isOverdue(t.due_date)).length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = tasks.filter(t => !t.done && t.due_date === todayStr).length;

  const FollowupSection = ({ title, leads, color }: { title: string; leads: any[]; color: string }) => {
    if (leads.length === 0) return null;
    return (
      <div className="space-y-2">
        <h3 className={`text-sm font-semibold ${color}`}>{title} ({leads.length})</h3>
        {leads.map(l => (
          <Card key={l.id} className={color === 'text-destructive' ? 'border-destructive/30' : color === 'text-warning' ? 'border-warning/30' : ''}>
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{l.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <Calendar className="h-3 w-3" />
                    <span className={color}>{formatDate(l.next_contact_date!)}</span>
                    <Badge variant="secondary" className="text-[10px]">{l.stage}</Badge>
                    {(l.potential_value ?? 0) > 0 && <span className="text-primary font-medium">{formatCurrency(l.potential_value!)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {l.phone && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-success" onClick={() => openWhatsApp(l)}>
                      <MessageCircle className="h-3 w-3" />
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => markFollowupDone(l.id)}>Feito</Button>
                  {rescheduleId === l.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="date"
                        className="h-7 w-36 text-xs"
                        value={rescheduleDate}
                        onChange={e => setRescheduleDate(e.target.value)}
                      />
                      <Button size="sm" className="h-7 text-xs" onClick={() => reschedule(l.id)}>OK</Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setRescheduleId(l.id); setRescheduleDate(l.next_contact_date || ''); }}>
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tarefas & Follow-ups</h1>
            <div className="flex gap-3 text-sm mt-1">
              {overdueCount > 0 && <span className="text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {overdueCount} atrasada(s)</span>}
              {todayCount > 0 && <span className="text-primary">{todayCount} para hoje</span>}
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Tarefa</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Follow-up com João" /></div>
                <div><Label>Data</Label><Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
                <div>
                  <Label>Contato (opcional)</Label>
                  <Select value={form.contactId} onValueChange={v => setForm(f => ({ ...f, contactId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSave} className="w-full" disabled={insertTask.isPending}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Follow-up sections */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Follow-ups de Leads</h2>
          <FollowupSection title="Atrasados" leads={overdueLeads} color="text-destructive" />
          <FollowupSection title="Hoje" leads={todayLeads} color="text-warning" />
          <FollowupSection title="Futuros" leads={futureLeads} color="text-muted-foreground" />
          {leadsWithFollowup.length === 0 && <p className="text-sm text-muted-foreground">Nenhum follow-up agendado</p>}
        </div>

        {/* Tasks section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Tarefas</h2>
          <div className="flex gap-2">
            <Button size="sm" variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>Pendentes</Button>
            <Button size="sm" variant={filter === 'done' ? 'default' : 'outline'} onClick={() => setFilter('done')}>Concluídas</Button>
            <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>Todas</Button>
          </div>
          <div className="space-y-2">
            {filtered.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma tarefa</p>}
            {filtered.map(t => {
              const contact = t.contact_id ? contacts.find(c => c.id === t.contact_id) : null;
              const overdue = !t.done && isOverdue(t.due_date);
              return (
                <Card key={t.id} className={overdue ? 'border-destructive/50' : ''}>
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    <Checkbox checked={!!t.done} onCheckedChange={() => toggle(t.id, !!t.done)} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${t.done ? 'line-through text-muted-foreground' : 'font-medium'}`}>{t.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {t.due_date && <span className={overdue ? 'text-destructive font-medium' : ''}>{formatDate(t.due_date)}</span>}
                        {contact && <span>· {contact.name}</span>}
                        {contact && (contact.potential_value ?? 0) > 0 && (
                          <span className="text-primary font-medium">{formatCurrency(contact.potential_value!)}</span>
                        )}
                      </div>
                    </div>
                    {contact?.phone && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-success" onClick={() => openWhatsApp(contact)}>
                        <MessageCircle className="h-3 w-3" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => remove(t.id)}>Excluir</Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {waLead && (
          <WhatsAppTemplateSelector
            open={waOpen}
            onOpenChange={v => { setWaOpen(v); if (!v) setWaLead(null); }}
            phone={waLead.phone || ''}
            leadName={waLead.name}
          />
        )}
      </div>
    </AppLayout>
  );
}
