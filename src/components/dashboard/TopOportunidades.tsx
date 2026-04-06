import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useContacts } from '@/hooks/useStore';
import { formatCurrency, whatsappLink } from '@/lib/helpers';
import { MessageCircle, Crown } from 'lucide-react';
import { LEAD_STAGE_LABELS, LeadStage } from '@/types';

export function TopOportunidades() {
  const { data: contacts = [] } = useContacts();

  const topLeads = useMemo(() => {
    return contacts
      .filter(c => c.is_lead && c.stage !== 'perdido' && c.stage !== 'fechado' && (c.potential_value ?? 0) > 0)
      .sort((a, b) => (b.potential_value ?? 0) - (a.potential_value ?? 0))
      .slice(0, 5);
  }, [contacts]);

  if (topLeads.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Crown className="h-4 w-4 text-warning" /> Top Oportunidades
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {topLeads.map((lead, i) => (
          <div key={lead.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
            <span className="text-sm font-bold text-muted-foreground w-5 text-center">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{lead.name}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-primary">{formatCurrency(lead.potential_value!)}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {LEAD_STAGE_LABELS[lead.stage as LeadStage] || lead.stage}
                </Badge>
              </div>
            </div>
            {lead.phone && (
              <Button variant="ghost" size="sm" className="h-7 text-success" onClick={() => window.open(whatsappLink(lead.phone || ''), '_blank')}>
                <MessageCircle className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
