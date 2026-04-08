import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTasks, useContacts } from '@/hooks/useStore';
import { formatCurrency } from '@/lib/helpers';
import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { WhatsAppTemplateSelector } from '@/components/WhatsAppTemplateSelector';

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

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [waOpen, setWaOpen] = useState(false);
  const [waLead, setWaLead] = useState<any>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const leadsWithFollowup = useMemo(() => contacts.filter(c => c.is_lead && c.next_contact_date), [contacts]);

  // Build event map: date string -> items
  const eventMap = useMemo(() => {
    const map: Record<string, { type: 'task' | 'followup'; title: string; contact?: any; done?: boolean }[]> = {};
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
    return map;
  }, [tasks, contacts, leadsWithFollowup]);

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const todayStr = today.toISOString().split('T')[0];

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
                    className={`min-h-[80px] border rounded-md p-1 ${isToday ? 'bg-primary/5 border-primary/30' : 'border-border/50'}`}
                  >
                    <p className={`text-xs font-medium mb-1 ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{day}</p>
                    <div className="space-y-0.5">
                      {events.slice(0, 3).map((ev, idx) => (
                        <div
                          key={idx}
                          className={`text-[10px] px-1 py-0.5 rounded truncate cursor-pointer ${
                            ev.type === 'followup' ? 'bg-warning/15 text-warning' : ev.done ? 'bg-muted text-muted-foreground line-through' : 'bg-primary/10 text-primary'
                          }`}
                          title={ev.title}
                          onClick={() => { if (ev.contact?.phone) { setWaLead(ev.contact); setWaOpen(true); } }}
                        >
                          {ev.title}
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
