import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useTasks, useContacts, useAppointments, useInsertAppointment, useDeleteAppointment } from '@/hooks/useStore';
import { ChevronLeft, ChevronRight, Plus, Clock, Trash2, CalendarIcon } from 'lucide-react';
import { WhatsAppTemplateSelector } from '@/components/WhatsAppTemplateSelector';
import { toast } from 'sonner';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function CalendarioPage() {
  const { data: tasks = [] } = useTasks();
  const { data: contacts = [] } = useContacts();
  const { data: appointments = [] } = useAppointments();
  const insertAppointment = useInsertAppointment();
  const deleteAppointment = useDeleteAppointment();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [waOpen, setWaOpen] = useState(false);
  const [waLead, setWaLead] = useState<any>(null);

  // New appointment dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');

  // Day detail dialog
  const [detailDate, setDetailDate] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const leadsWithFollowup = useMemo(() => contacts.filter(c => c.is_lead && c.next_contact_date), [contacts]);

  const eventMap = useMemo(() => {
    const map: Record<string, { type: 'task' | 'followup' | 'appointment'; title: string; contact?: any; done?: boolean; id?: string; time?: string | null }[]> = {};
    tasks.forEach(t => {
      if (!t.due_date) return;
      const key = t.due_date;
      if (!map[key]) map[key] = [];
      const contact = t.contact_id ? contacts.find(c => c.id === t.contact_id) : null;
      map[key].push({ type: 'task', title: t.title, contact, done: !!t.done });
    });
    leadsWithFollowup.forEach(l => {
      const key = l.next_contact_date!;
      if (!map[key]) map[key] = [];
      map[key].push({ type: 'followup', title: `Follow-up: ${l.name}`, contact: l });
    });
    appointments.forEach(a => {
      const key = a.date;
      if (!map[key]) map[key] = [];
      map[key].push({ type: 'appointment', title: a.title, id: a.id, time: a.time });
    });
    return map;
  }, [tasks, contacts, leadsWithFollowup, appointments]);

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const todayStr = today.toISOString().split('T')[0];

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setDetailDate(dateStr);
  };

  const openNewAppointment = () => {
    setNewTitle('');
    setNewTime('');
    setDetailDate(null);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!newTitle.trim()) { toast.error('Informe o compromisso'); return; }
    insertAppointment.mutate(
      { title: newTitle.trim(), date: selectedDate, time: newTime || null },
      {
        onSuccess: () => {
          toast.success('Compromisso adicionado!');
          setDialogOpen(false);
          setNewTitle('');
          setNewTime('');
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteAppointment.mutate(id, { onSuccess: () => toast.success('Compromisso removido') });
  };

  const detailEvents = detailDate ? (eventMap[detailDate] || []) : [];

  const formatTime = (t: string | null | undefined) => {
    if (!t) return '';
    return t.slice(0, 5);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Calendário</h1>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={prev}><ChevronLeft className="h-5 w-5" /></Button>
              <CardTitle className="text-lg">{MONTH_NAMES[month]} {year}</CardTitle>
              <Button variant="ghost" size="icon" onClick={next}><ChevronRight className="h-5 w-5" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px]" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const events = eventMap[dateStr] || [];
                const isToday = dateStr === todayStr;

                return (
                  <div
                    key={day}
                    onClick={() => handleDayClick(dateStr)}
                    className={`min-h-[80px] border rounded-md p-1 cursor-pointer hover:bg-accent/30 transition-colors ${isToday ? 'bg-primary/5 border-primary/30' : 'border-border/50'}`}
                  >
                    <p className={`text-xs font-medium mb-1 ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{day}</p>
                    <div className="space-y-0.5">
                      {events.slice(0, 3).map((ev, idx) => (
                        <div
                          key={idx}
                          className={`text-[10px] px-1 py-0.5 rounded truncate ${
                            ev.type === 'appointment'
                              ? 'bg-accent text-accent-foreground'
                              : ev.type === 'followup'
                              ? 'bg-warning/15 text-warning'
                              : ev.done
                              ? 'bg-muted text-muted-foreground line-through'
                              : 'bg-primary/10 text-primary'
                          }`}
                          title={ev.time ? `${formatTime(ev.time)} - ${ev.title}` : ev.title}
                        >
                          {ev.time ? `${formatTime(ev.time)} ` : ''}{ev.title}
                        </div>
                      ))}
                      {events.length > 3 && (
                        <p className="text-[10px] text-muted-foreground">+{events.length - 3} mais</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Day detail dialog */}
        <Dialog open={!!detailDate} onOpenChange={v => { if (!v) setDetailDate(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {detailDate && new Date(detailDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {detailEvents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento neste dia</p>
              )}
              {detailEvents.map((ev, idx) => (
                <div key={idx} className={`flex items-center justify-between p-2 rounded-md text-sm ${
                  ev.type === 'appointment' ? 'bg-accent/50' : ev.type === 'followup' ? 'bg-warning/10' : 'bg-primary/5'
                }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    {ev.time && <span className="text-xs font-mono text-muted-foreground flex-shrink-0">{formatTime(ev.time)}</span>}
                    <Badge variant={ev.type === 'appointment' ? 'secondary' : ev.type === 'followup' ? 'outline' : 'default'} className="text-[10px] flex-shrink-0">
                      {ev.type === 'appointment' ? 'Compromisso' : ev.type === 'followup' ? 'Follow-up' : 'Tarefa'}
                    </Badge>
                    <span className="truncate">{ev.title}</span>
                  </div>
                  {ev.type === 'appointment' && ev.id && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => handleDelete(ev.id!)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button onClick={openNewAppointment} className="w-full gap-2">
                <Plus className="h-4 w-4" /> Adicionar Compromisso
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New appointment dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Novo Compromisso</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Data</Label>
                <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
              </div>
              <div>
                <Label>Horário (opcional)</Label>
                <Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} />
              </div>
              <div>
                <Label>Compromisso</Label>
                <Input placeholder="Ex: Reunião com cliente" value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={insertAppointment.isPending}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
