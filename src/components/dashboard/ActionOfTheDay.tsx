import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useContacts } from '@/hooks/useStore';
import { isOverdue, formatCurrency, whatsappLink } from '@/lib/helpers';
import { AlertTriangle, Clock, MessageCircle } from 'lucide-react';

export function ActionOfTheDay() {
  const { data: contacts = [] } = useContacts();
  const today = new Date().toISOString().split('T')[0];

  const leads = useMemo(() => contacts.filter(c => c.is_lead), [contacts]);

  const overdueLeads = useMemo(
    () => leads.filter(l => l.next_contact_date && isOverdue(l.next_contact_date)),
    [leads]
  );

  const todayLeads = useMemo(
    () => leads.filter(l => l.next_contact_date === today),
    [leads, today]
  );

  if (overdueLeads.length === 0 && todayLeads.length === 0) return null;

  const LeadRow = ({ lead, variant }: { lead: any; variant: 'overdue' | 'today' }) => (
    <div className={`flex items-center justify-between p-3 rounded-lg ${variant === 'overdue' ? 'bg-destructive/5 border border-destructive/20' : 'bg-warning/5 border border-warning/20'}`}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{lead.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {(lead.potential_value ?? 0) > 0 && (
            <span className="font-semibold text-primary">{formatCurrency(lead.potential_value!)}</span>
          )}
          <Badge variant="secondary" className="text-[10px]">{lead.stage}</Badge>
        </div>
      </div>
      {lead.phone && (
        <Button
          size="sm"
          variant="ghost"
          className="text-success h-8"
          onClick={() => window.open(whatsappLink(lead.phone || ''), '_blank')}
        >
          <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
        </Button>
      )}
    </div>
  );

  return (
    <Card className="border-2 border-primary/20 bg-primary/[0.02]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          🎯 Ação do Dia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {overdueLeads.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Atrasados ({overdueLeads.length})
            </p>
            {overdueLeads.slice(0, 5).map(l => <LeadRow key={l.id} lead={l} variant="overdue" />)}
          </div>
        )}
        {todayLeads.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-warning flex items-center gap-1">
              <Clock className="h-3 w-3" /> Para Hoje ({todayLeads.length})
            </p>
            {todayLeads.slice(0, 5).map(l => <LeadRow key={l.id} lead={l} variant="today" />)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
