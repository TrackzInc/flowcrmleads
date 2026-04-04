import { useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactions, useContacts, useTasks } from '@/hooks/useStore';
import { formatCurrency, isOverdue, formatDate } from '@/lib/helpers';
import { TrendingUp, TrendingDown, Wallet, Users, AlertTriangle, CheckSquare, Target, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const STATUS_COLORS = ['#3b82f6', '#f59e0b', '#eab308', '#10b981', '#ef4444'];

export default function DashboardPage() {
  const { data: transactions = [] } = useTransactions();
  const { data: contacts = [] } = useContacts();
  const { data: tasks = [] } = useTasks();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const stats = useMemo(() => {
    const monthTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: totalIncome - totalExpense, monthBalance: income - expense };
  }, [transactions, currentMonth, currentYear]);

  const leads = useMemo(() => contacts.filter(c => c.is_lead), [contacts]);

  const leadStats = useMemo(() => {
    const total = leads.length;
    const byStatus = {
      novo_lead: leads.filter(l => l.stage === 'novo_lead').length,
      contato_iniciado: leads.filter(l => l.stage === 'contato_iniciado').length,
      respondeu: leads.filter(l => l.stage === 'respondeu').length,
      em_negociacao: leads.filter(l => l.stage === 'em_negociacao').length,
      fechado: leads.filter(l => l.stage === 'fechado').length,
      perdido: leads.filter(l => l.stage === 'perdido').length,
    };
    const totalPotential = leads.reduce((s, l) => s + (l.potential_value || 0), 0);
    const closedLeads = leads.filter(l => l.stage === 'fechado');
    const totalClosed = closedLeads.reduce((s, l) => s + (l.potential_value || 0), 0);
    const conversionRate = total > 0 ? (closedLeads.length / total) * 100 : 0;
    return { total, byStatus, totalPotential, totalClosed, conversionRate, closedCount: closedLeads.length };
  }, [leads]);

  const leadsByStageChart = useMemo(() => [
    { name: 'Novo', value: leadStats.byStatus.novo_lead },
    { name: 'Contato', value: leadStats.byStatus.contato_iniciado },
    { name: 'Respondeu', value: leadStats.byStatus.respondeu },
    { name: 'Negociação', value: leadStats.byStatus.em_negociacao },
    { name: 'Fechado', value: leadStats.byStatus.fechado },
    { name: 'Perdido', value: leadStats.byStatus.perdido },
  ].filter(s => s.value > 0), [leadStats]);

  const overdueTasks = tasks.filter(t => !t.done && isOverdue(t.due_date));
  const todayTasks = tasks.filter(t => !t.done && t.due_date === now.toISOString().split('T')[0]);

  const chartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(currentYear, currentMonth - (5 - i), 1);
      const month = d.toLocaleDateString('pt-BR', { month: 'short' });
      const txs = transactions.filter(t => {
        const td = new Date(t.date);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });
      return {
        month,
        entradas: txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        saidas: txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions, currentMonth, currentYear]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        {/* Financial KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><Wallet className="h-5 w-5 text-primary" /></div>
                <div><p className="text-xs text-muted-foreground">Saldo Total</p><p className="text-lg font-bold">{formatCurrency(stats.balance)}</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10"><TrendingUp className="h-5 w-5 text-success" /></div>
                <div><p className="text-xs text-muted-foreground">Entradas (mês)</p><p className="text-lg font-bold text-success">{formatCurrency(stats.income)}</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10"><TrendingDown className="h-5 w-5 text-destructive" /></div>
                <div><p className="text-xs text-muted-foreground">Saídas (mês)</p><p className="text-lg font-bold text-destructive">{formatCurrency(stats.expense)}</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10"><Target className="h-5 w-5 text-info" /></div>
                <div><p className="text-xs text-muted-foreground">Total de Leads</p><p className="text-lg font-bold">{leadStats.total}</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lead Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Em Negociação</p>
              <p className="text-lg font-bold text-warning">{leadStats.byStatus.em_negociacao}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Fechados</p>
              <p className="text-lg font-bold text-success">{leadStats.closedCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Valor Potencial</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(leadStats.totalPotential)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
              <p className="text-lg font-bold">{leadStats.conversionRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Cash flow chart */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-base">Fluxo de Caixa - Últimos 6 meses</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={v => `R$${v}`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="entradas" fill="hsl(152, 60%, 40%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="saidas" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Tarefas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overdueTasks.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" /><span>{overdueTasks.length} atrasada(s)</span>
                </div>
              )}
              {todayTasks.length > 0 ? (
                todayTasks.slice(0, 5).map(t => (
                  <div key={t.id} className="text-sm p-2 rounded bg-muted">{t.title}</div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma tarefa para hoje</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Leads by stage + Potential vs Closed */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Leads por Etapa</CardTitle></CardHeader>
            <CardContent>
              {leadsByStageChart.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sem leads</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={leadsByStageChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                        {leadsByStageChart.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" /> Potencial vs Realizado</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64 flex flex-col items-center justify-center space-y-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Valor Potencial Total</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(leadStats.totalPotential)}</p>
                </div>
                <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-success h-full rounded-full transition-all"
                    style={{ width: `${leadStats.totalPotential > 0 ? Math.min((leadStats.totalClosed / leadStats.totalPotential) * 100, 100) : 0}%` }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Valor Realizado (Fechado)</p>
                  <p className="text-3xl font-bold text-success">{formatCurrency(leadStats.totalClosed)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
