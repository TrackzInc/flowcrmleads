import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useServices, useInsertService, useUpdateService, useDeleteService } from '@/hooks/useStore';
import { formatCurrency } from '@/lib/helpers';
import { Plus, Pencil, Trash2, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_SERVICES = [
  'Landing Page', 'Site Institucional', 'Tráfego Pago', 'Designer Freela', 'Consultoria', 'Comissão',
];

export default function ServicosPage() {
  const { data: services = [] } = useServices();
  const insertService = useInsertService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', price: '' });

  const resetForm = () => { setForm({ name: '', price: '' }); setEditingId(null); };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    try {
      if (editingId) {
        await updateService.mutateAsync({ id: editingId, name: form.name, price: parseFloat(form.price) });
      } else {
        await insertService.mutateAsync({ name: form.name, price: parseFloat(form.price) });
      }
      setOpen(false);
      resetForm();
    } catch { toast.error('Erro ao salvar serviço'); }
  };

  const handleEdit = (s: any) => {
    setEditingId(s.id);
    setForm({ name: s.name, price: String(s.price) });
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
                  <Button onClick={handleSave} className="w-full" disabled={insertService.isPending || updateService.isPending}>
                    Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Soma dos Serviços</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalRevenuePotential)}</p>
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
                    <p className="font-medium text-sm">{svc.name}</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(svc.price)}</p>
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
