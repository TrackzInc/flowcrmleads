import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useGoals, useUpsertGoal, useTransactions } from '@/hooks/useStore';
import { formatCurrency } from '@/lib/helpers';
import { Target, Pencil, Check } from 'lucide-react';

export function MonthlyGoal() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const { data: goals = [] } = useGoals();
  const { data: transactions = [] } = useTransactions();
  const upsertGoal = useUpsertGoal();

  const [editing, setEditing] = useState(false);
  const [targetInput, setTargetInput] = useState('');

  const goal = goals.find(g => g.month === currentMonth);
  const targetAmount = goal?.target_amount ?? 0;

  const monthlyIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income' && t.date.startsWith(currentMonth))
      .reduce((s, t) => s + t.amount, 0);
  }, [transactions, currentMonth]);

  const percentage = targetAmount > 0 ? Math.min((monthlyIncome / targetAmount) * 100, 100) : 0;

  const handleSave = async () => {
    const val = parseFloat(targetInput);
    if (isNaN(val) || val <= 0) return;
    await upsertGoal.mutateAsync({ month: currentMonth, target_amount: val });
    setEditing(false);
  };

  const startEdit = () => {
    setTargetInput(targetAmount > 0 ? String(targetAmount) : '');
    setEditing(true);
  };

  return (
    <Card className="border-2 border-accent/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2"><Target className="h-4 w-4" /> Meta do Mês</span>
          {!editing && (
            <Button variant="ghost" size="sm" className="h-7" onClick={startEdit}>
              <Pencil className="h-3 w-3 mr-1" /> {targetAmount > 0 ? 'Editar' : 'Definir Meta'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Ex: 10000"
              value={targetInput}
              onChange={e => setTargetInput(e.target.value)}
              className="h-8"
            />
            <Button size="sm" className="h-8" onClick={handleSave} disabled={upsertGoal.isPending}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ) : targetAmount > 0 ? (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vendido: <span className="font-semibold text-foreground">{formatCurrency(monthlyIncome)}</span></span>
              <span className="text-muted-foreground">Meta: <span className="font-semibold text-foreground">{formatCurrency(targetAmount)}</span></span>
            </div>
            <Progress value={percentage} className="h-3" />
            <p className="text-xs text-center text-muted-foreground">
              {percentage.toFixed(0)}% da meta atingida
              {monthlyIncome >= targetAmount && ' 🎉'}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            Defina sua meta mensal de vendas para acompanhar o progresso
          </p>
        )}
      </CardContent>
    </Card>
  );
}
