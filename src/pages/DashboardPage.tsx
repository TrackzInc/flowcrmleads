import { useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactions, useContacts, useTasks } from '@/hooks/useStore';
import { formatCurrency, isOverdue, formatDate } from '@/lib/helpers';
import { TrendingUp, TrendingDown, Wallet, Users, AlertTriangle, CheckSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function DashboardPage() {
  const [transactions] = useTransactions();
  const [contacts] = useContacts();
  const [tasks] = useTasks();

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

  const overdueTasks = tasks.filter(t => !t.done && isOverdue(t.dueDate));
  const todayTasks = tasks.filter(t => !t.done && t.dueDate === now.toISOString().split('T')[0]);

  const chartData = useMemo(() => {
    const last6 = Array.from({ length: 6 }, (_, i) => {
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
    return last6;
  }, [transactions, currentMonth, currentYear]);

  const activeLeads = contacts.filter(c => c.isLead && c.stage !== 'fechado' && c.stage !== 'perdido').length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo Total</p>
                  <p className="text-lg font-bold">{formatCurrency(stats.balance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Entradas (mês)</p>
                  <p className="text-lg font-bold text-success">{formatCurrency(stats.income)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saídas (mês)</p>
                  <p className="text-lg font-bold text-destructive">{formatCurrency(stats.expense)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <Users className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Leads Ativos</p>
                  <p className="text-lg font-bold">{activeLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Fluxo de Caixa - Últimos 6 meses</CardTitle>
            </CardHeader>
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="h-4 w-4" /> Tarefas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overdueTasks.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{overdueTasks.length} atrasada(s)</span>
                </div>
              )}
              {todayTasks.length > 0 ? (
                todayTasks.slice(0, 5).map(t => (
                  <div key={t.id} className="text-sm p-2 rounded bg-muted">
                    {t.title}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma tarefa para hoje</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
