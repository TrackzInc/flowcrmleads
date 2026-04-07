import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/helpers';
import { Calendar, MessageCircle, CalendarPlus } from 'lucide-react';

interface Props {
  title: string;
  leads: any[];
  color: string;
  onDone: (id: string) => void;
  onReschedule: (id: string, target: 'tomorrow' | 'next_week' | string) => void;
  onWhatsApp: (lead: any) => void;
}

export function FollowupSection({ title, leads, color, onDone, onReschedule, onWhatsApp }: Props) {
  const [customDateId, setCustomDateId] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState('');

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
              <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
                {l.phone && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-success" onClick={() => onWhatsApp(l)}>
                    <MessageCircle className="h-3 w-3" />
                  </Button>
                )}
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onDone(l.id)}>Feito</Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onReschedule(l.id, 'tomorrow')}>
                  <CalendarPlus className="h-3 w-3 mr-1" /> Amanhã
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onReschedule(l.id, 'next_week')}>
                  Próx. Sem.
                </Button>
                {customDateId === l.id ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="date"
                      className="h-7 w-36 text-xs"
                      value={customDate}
                      onChange={e => setCustomDate(e.target.value)}
                    />
                    <Button size="sm" className="h-7 text-xs" onClick={() => { onReschedule(l.id, customDate); setCustomDateId(null); setCustomDate(''); }}>OK</Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => { setCustomDateId(l.id); setCustomDate(l.next_contact_date || ''); }}>
                    Outra data
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
