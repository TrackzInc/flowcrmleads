import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useTransactions, useContacts, useInsertTransaction, useUpdateTransaction, useDeleteTransaction } from '@/hooks/useStore';
import { CATEGORIES_INCOME, CATEGORIES_EXPENSE } from '@/types';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { toast } from 'sonner';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function CaixaPage() {
  const { data: transactions = [] } = useTransactions();
  const { data: contacts = [] } = useContacts();
  const insertTx = useInsertTransaction();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [form, setForm] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    contactId: '',
  });

  const resetForm = () => {
    setForm({ type: 'income', amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0], contactId: '' });
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.amount || !form.category) return;
    const payload = {
      type: form.type,
      amount: parseFloat(form.amount),
      category: form.category,
      description: form.description,
      date: form.date,
      contact_id: form.contactId && form.contactId !== 'none' ? form.contactId : null,
    };
    try {
      if (editingId) {
        await updateTx.mutateAsync({ id: editingId, ...payload });
      } else {
        await insertTx.mutateAsync(payload);
      }
      setOpen(false);
      resetForm();
    } catch {
      toast.error('Erro ao salvar transação');
    }
  };

  const handleDelete = async (id: string) => {
    try { await deleteTx.mutateAsync(id); } catch { toast.error('Erro ao excluir'); }
  };

  const handleEdit = (tx: any) => {
    setForm({ type: tx.type, amount: String(tx.amount), category: tx.category, description: tx.description || '', date: tx.date, contactId: tx.contact_id || '' });
    setEditingId(tx.id);
    setOpen(true);
  };

  const filtered = useMemo(() => {
    return transactions
      .filter(t => filterType === 'all' || t.type === filterType)
      .filter(t => filterCategory === 'all' || t.category === filterCategory)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, filterCategory]);

  const categories = form.type === 'income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Caixa</h1>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Transação</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingId ? 'Editar' : 'Nova'} Transação</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant={form.type === 'income' ? 'default' : 'outline'} className={form.type === 'income' ? 'bg-success hover:bg-success/90' : ''} onClick={() => setForm(f => ({ ...f, type: 'income', category: '' }))}>
                    <TrendingUp className="h-4 w-4 mr-1" /> Entrada
                  </Button>
                  <Button type="button" variant={form.type === 'expense' ? 'default' : 'outline'} className={form.type === 'expense' ? 'bg-destructive hover:bg-destructive/90' : ''} onClick={() => setForm(f => ({ ...f, type: 'expense', category: '' }))}>
                    <TrendingDown className="h-4 w-4 mr-1" /> Saída
                  </Button>
                </div>
                <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" /></div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Descrição</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalhe" /></div>
                <div><Label>Data</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
                <div>
                  <Label>Contato (opcional)</Label>
                  <Select value={form.contactId} onValueChange={v => setForm(f => ({ ...f, contactId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSave} className="w-full" disabled={insertTx.isPending || updateTx.isPending}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Entradas</p><p className="text-lg font-bold text-success">{formatCurrency(totalIncome)}</p></CardContent></Card>
          <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Saídas</p><p className="text-lg font-bold text-destructive">{formatCurrency(totalExpense)}</p></CardContent></Card>
          <Card className="col-span-2 md:col-span-1"><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Saldo</p><p className="text-lg font-bold">{formatCurrency(totalIncome - totalExpense)}</p></CardContent></Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Entradas</SelectItem>
                  <SelectItem value="expense">Saídas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {[...CATEGORIES_INCOME, ...CATEGORIES_EXPENSE].filter((v, i, a) => a.indexOf(v) === i).map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              {filtered.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma transação encontrada</p>}
              {filtered.map(tx => {
                const contact = tx.contact_id ? contacts.find(c => c.id === tx.contact_id) : null;
                return (
                  <Card key={tx.id}>
                    <CardContent className="py-3 px-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded ${tx.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                          {tx.type === 'income' ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{tx.description || tx.category}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(tx.date)} · {tx.category}{contact ? ` · ${contact.name}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(tx)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(tx.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Despesas por Categoria</CardTitle></CardHeader>
            <CardContent>
              {expenseByCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                        {expenseByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
