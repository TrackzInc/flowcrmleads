import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useContacts } from '@/hooks/useStore';
import { LEAD_STAGE_LABELS, LeadStage } from '@/types';
import { ArrowRight } from 'lucide-react';

const PIPELINE_STAGES: LeadStage[] = ['novo_lead', 'contato_iniciado', 'respondeu', 'em_negociacao', 'fechado'];

export function PipelineAnalytics() {
  const { data: contacts = [] } = useContacts();

  const stages = useMemo(() => {
    const leads = contacts.filter(c => c.is_lead);
    return PIPELINE_STAGES.map((stage, i) => {
      const count = leads.filter(l => l.stage === stage).length;
      const prevCount = i > 0 ? leads.filter(l => l.stage === PIPELINE_STAGES[i - 1]).length : 0;
      // Conversion rate: what % of previous stage advanced to this stage
      // For first stage, no rate
      const rate = i > 0 && prevCount > 0 ? Math.round((count / prevCount) * 100) : null;
      return { stage, label: LEAD_STAGE_LABELS[stage], count, rate };
    });
  }, [contacts]);

  const total = stages.reduce((s, st) => s + st.count, 0);
  if (total === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">📈 Conversão por Etapa</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-1 overflow-x-auto">
          {stages.map((st, i) => (
            <div key={st.stage} className="flex items-center gap-1">
              <div className="text-center min-w-[80px]">
                <p className="text-2xl font-bold">{st.count}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{st.label}</p>
                {st.rate !== null && (
                  <p className="text-[10px] mt-1 font-medium text-primary">{st.rate}%</p>
                )}
              </div>
              {i < stages.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
