import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useServices, useInsertService, useUpdateService, useDeleteService } from '@/hooks/useStore';
import { formatCurrency } from '@/lib/helpers';
import { Plus, Pencil, Trash2, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_SERVICES = [
  'Landing Page', 'Site Institucional', 'Tráfego Pago', 'Designer Freela', 'Consultoria', 'Comissão',
];

const RECURRENCE_OPTIONS = [
  { value: 'unico', label: 'Único', months: 0 },
  { value: 'mensal', label: 'Mensal', months: 1 },
  { value: 'trimestral', label: 'Trimestral', months: 3 },
  { value: 'semestral', label: 'Semestral', months: 6 },
  { value: 'anual', label: 'Anual', months: 12 },
];

export const getRecurrenceMonths = (rec: string) =>
  RECURRENCE_OPTIONS.find(o => o.value === rec)?.months ?? 0;

export const getRecurrenceLabel = (rec: string) =>
  RECURRENCE_OPTIONS.find(o => o.value === rec)?.label ?? 'Único';

export const annualizedValue = (price: number, recurrence: string) => {
  const months = getRecurrenceMonths(recurrence);
  if (months === 0) return price;
  return price * (12 / months);
};

export default function ServicosPage() {
  const { data: services = [] } = useServices();
  const insertService = useInsertService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', price: '', recurrence: 'unico' });

  const resetForm = () => { setForm({ name: '', price: '', recurrence: 'unico' }); setEditingId(null); };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    try {
      if (editingId) {
        await updateService.mutateAsync({ id: editingId, name: form.name, price: parseFloat(form.price), recurrence: form.recurrence });
      } else {
        await insertService.mutateAsync({ name: form.name, price: parseFloat(form.price), recurrence: form.recurrence });
      }
      setOpen(false);
      resetForm();
    } catch { toast.error('Erro ao salvar serviço'); }
  };

  const handleEdit = (s: any) => {
    setEditingId(s.id);
    setForm({ name: s.name, price: String(s.price), recurrence: s.recurrence || 'unico' });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try { await deleteService.mutateAsync(id); } catch { toast.error('Erro ao excluir'); }
  };

  const addDefaults = async () => {
    for (const name of DEFAULT_SERVICES) {
      if (!services.find(s => s.name === name)) {
        await insertService.mutateAsync({ name, price: 0 });
      }
    }
    toast.success('Serviços padrão adicionados');
  };

  const totalRevenuePotential = services.reduce((s, svc) => s + (svc.price || 0), 0);
  const totalAnnualized = services.reduce((s, svc) => s + annualizedValue(svc.price || 0, (svc as any).recurrence || 'unico'), 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Serviços & Preços</h1>
            <p className="text-sm text-muted-foreground">Gerencie seus serviços e valores cobrados</p>
          </div>
          <div className="flex gap-2">
            {services.length === 0 && (
              <Button variant="outline" size="sm" onClick={addDefaults}>
                Carregar Padrões
              </Button>
            )}
            <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Serviço</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingId ? 'Editar' : 'Novo'} Serviço</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome do Serviço *</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Landing Page" />
                  </div>
                  <div>
                    <Label>Preço (R$) *</Label>
                    <Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0,00" />
                  </div>
                  <div>
                    <Label>Recorrência *</Label>
                    <Select value={form.recurrence} onValueChange={v => setForm(f => ({ ...f, recurrence: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {RECURRENCE_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.price && form.recurrence !== 'unico' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Anualizado: {formatCurrency(annualizedValue(parseFloat(form.price) || 0, form.recurrence))}
                      </p>
                    )}
                  </div>
                  <Button onClick={handleSave} className="w-full" disabled={insertService.isPending || updateService.isPending}>
                    Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardContent className="pt-4 pb-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Soma dos Serviços (preço base)</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalRevenuePotential)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Receita anualizada potencial</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(totalAnnualized)}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {services.map(svc => (
            <Card key={svc.id} className="group">
              <CardContent className="py-4 px-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{svc.name}</p>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {getRecurrenceLabel((svc as any).recurrence || 'unico')}
                      </Badge>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(svc.price)}
                      {(svc as any).recurrence && (svc as any).recurrence !== 'unico' && (
                        <span className="text-xs text-muted-foreground font-normal ml-1">
                          /{getRecurrenceLabel((svc as any).recurrence).toLowerCase()}
                        </span>
                      )}
                    </p>
                    {(svc as any).recurrence && (svc as any).recurrence !== 'unico' && (
                      <p className="text-xs text-success">
                        {formatCurrency(annualizedValue(svc.price, (svc as any).recurrence))}/ano
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(svc)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(svc.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {services.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full text-center py-8">
              Nenhum serviço cadastrado. Clique em "Carregar Padrões" ou adicione manualmente.
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
