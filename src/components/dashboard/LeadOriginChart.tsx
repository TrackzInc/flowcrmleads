import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useContacts, useTransactions } from '@/hooks/useStore';
import { formatCurrency } from '@/lib/helpers';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function LeadOriginChart() {
  const { data: contacts = [] } = useContacts();
  const { data: transactions = [] } = useTransactions();

  const originData = useMemo(() => {
    const closedLeads = contacts.filter(c => c.is_lead && c.stage === 'fechado');
    const map: Record<string, { count: number; revenue: number }> = {};

    closedLeads.forEach(lead => {
      const origin = lead.origin || 'Desconhecido';
      if (!map[origin]) map[origin] = { count: 0, revenue: 0 };
      map[origin].count++;
      // Sum transactions linked to this contact
      const linkedTx = transactions.filter(t => t.type === 'income' && t.contact_id === lead.id);
      map[origin].revenue += linkedTx.reduce((s, t) => s + t.amount, 0) + (lead.potential_value || 0);
    });

    return Object.entries(map)
      .map(([name, data]) => ({ name, value: data.revenue, count: data.count }))
      .sort((a, b) => b.value - a.value);
  }, [contacts, transactions]);

  if (originData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">De onde vêm os lucros?</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground text-center py-8">Sem dados de leads fechados</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">De onde vêm os lucros?</CardTitle></CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={originData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                innerRadius={35}
                paddingAngle={2}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ strokeWidth: 1 }}
                fontSize={11}
              >
                {originData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 space-y-1">
          {originData.map((d, i) => (
            <div key={d.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span>{d.name}</span>
                <span className="text-muted-foreground">({d.count} leads)</span>
              </div>
              <span className="font-medium">{formatCurrency(d.value)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
