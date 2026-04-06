import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useContacts, useInteractions } from '@/hooks/useStore';
import { UserPlus, Phone, Trophy } from 'lucide-react';

export function WeeklyProgress() {
  const { data: contacts = [] } = useContacts();
  const { data: interactions = [] } = useInteractions();

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const leads = contacts.filter(c => c.is_lead);
    const createdThisWeek = leads.filter(l => new Date(l.created_at) >= weekAgo).length;
    const contactedThisWeek = new Set(
      interactions.filter(i => new Date(i.date) >= weekAgo).map(i => i.contact_id)
    ).size;
    const closedThisWeek = leads.filter(
      l => l.stage === 'fechado' && new Date(l.updated_at) >= weekAgo
    ).length;

    return { createdThisWeek, contactedThisWeek, closedThisWeek };
  }, [contacts, interactions]);

  const items = [
    { label: 'Criados na semana', value: stats.createdThisWeek, icon: UserPlus, color: 'text-primary' },
    { label: 'Contatados', value: stats.contactedThisWeek, icon: Phone, color: 'text-warning' },
    { label: 'Fechados', value: stats.closedThisWeek, icon: Trophy, color: 'text-success' },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map(item => (
        <Card key={item.label}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-lg font-bold">{item.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
