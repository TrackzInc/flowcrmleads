import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTasks, useContacts } from '@/hooks/useStore';
import { Task } from '@/types';
import { generateId, formatDate, isOverdue } from '@/lib/helpers';
import { Plus, AlertTriangle, CheckCircle2, Circle } from 'lucide-react';

export default function TarefasPage() {
  const [tasks, setTasks] = useTasks();
  const [contacts] = useContacts();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('pending');

  const [form, setForm] = useState({ title: '', dueDate: new Date().toISOString().split('T')[0], contactId: '' });

  const handleSave = () => {
    if (!form.title) return;
    const task: Task = { id: generateId(), title: form.title, dueDate: form.dueDate, contactId: form.contactId || undefined, done: false, createdAt: new Date().toISOString() };
    setTasks(prev => [task, ...prev]);
    setOpen(false);
    setForm({ title: '', dueDate: new Date().toISOString().split('T')[0], contactId: '' });
  };

  const toggle = (id: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

  const filtered = useMemo(() => {
    return tasks
      .filter(t => filter === 'all' || (filter === 'pending' ? !t.done : t.done))
      .sort((a, b) => {
        if (!a.done && isOverdue(a.dueDate)) return -1;
        if (!b.done && isOverdue(b.dueDate)) return 1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [tasks, filter]);

  const overdue = tasks.filter(t => !t.done && isOverdue(t.dueDate)).length;
  const today = tasks.filter(t => !t.done && t.dueDate === new Date().toISOString().split('T')[0]).length;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tarefas</h1>
            <div className="flex gap-3 text-sm mt-1">
              {overdue > 0 && <span className="text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {overdue} atrasada(s)</span>}
              {today > 0 && <span className="text-primary">{today} para hoje</span>}
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
                <Button onClick={handleSave} className="w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>Pendentes</Button>
          <Button size="sm" variant={filter === 'done' ? 'default' : 'outline'} onClick={() => setFilter('done')}>Concluídas</Button>
          <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>Todas</Button>
        </div>

        <div className="space-y-2">
          {filtered.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma tarefa</p>}
          {filtered.map(t => {
            const contact = t.contactId ? contacts.find(c => c.id === t.contactId) : null;
            const overdue = !t.done && isOverdue(t.dueDate);
            return (
              <Card key={t.id} className={overdue ? 'border-destructive/50' : ''}>
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <Checkbox checked={t.done} onCheckedChange={() => toggle(t.id)} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${t.done ? 'line-through text-muted-foreground' : 'font-medium'}`}>{t.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={overdue ? 'text-destructive font-medium' : ''}>{formatDate(t.dueDate)}</span>
                      {contact && <span>· {contact.name}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => remove(t.id)}>Excluir</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
