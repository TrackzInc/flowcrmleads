import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useContacts, useInsertContact, useUpdateContact, useInteractions, useInsertTask } from '@/hooks/useStore';
import { LeadStage, LeadTag, LEAD_STAGE_LABELS, LEAD_TAG_LABELS, ORIGINS, CONTACT_STATUS_LABELS, ContactStatus } from '@/types';
import { formatCurrency } from '@/lib/helpers';
import { Plus, GripVertical, Pencil, MessageCircle, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { WhatsAppTemplateSelector } from '@/components/WhatsAppTemplateSelector';

const STAGES: LeadStage[] = ['novo_lead', 'contato_iniciado', 'respondeu', 'em_negociacao', 'fechado', 'perdido'];

const stageColors: Record<LeadStage, string> = {
  novo_lead: 'border-t-blue-400',
  contato_iniciado: 'border-t-amber-400',
  respondeu: 'border-t-yellow-400',
  em_negociacao: 'border-t-orange-400',
  fechado: 'border-t-emerald-400',
  perdido: 'border-t-red-400',
};

const tagColors: Record<LeadTag, string> = {
  frio: 'bg-blue-100 text-blue-700',
  morno: 'bg-amber-100 text-amber-700',
  quente: 'bg-red-100 text-red-700',
  cliente_potencial: 'bg-emerald-100 text-emerald-700',
};

function getRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'hoje';
  if (days === 1) return 'há 1 dia';
  return `há ${days} dias`;
}

export default function LeadsPage() {
  const { data: contacts = [] } = useContacts();
  const { data: interactions = [] } = useInteractions();
  const insertContact = useInsertContact();
  const updateContact = useUpdateContact();
  const insertTask = useInsertTask();

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [waOpen, setWaOpen] = useState(false);
  const [waLead, setWaLead] = useState<any>(null);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', origin: '', tag: 'frio' as LeadTag, interest: '', potential_value: '',
  });

  const [editForm, setEditForm] = useState({
    name: '', phone: '', email: '', origin: '', status: 'novo' as ContactStatus,
    notes: '', next_contact_date: '', tag: 'frio' as LeadTag, interest: '', potential_value: '',
  });

  const resetForm = () => setForm({ name: '', phone: '', email: '', origin: '', tag: 'frio', interest: '', potential_value: '' });

  const handleSave = async () => {
    if (!form.name) return;
    try {
      await insertContact.mutateAsync({
        name: form.name, phone: form.phone, email: form.email, origin: form.origin,
        tag: form.tag, interest: form.interest, stage: 'novo_lead', is_lead: true, status: 'novo',
        potential_value: form.potential_value ? parseFloat(form.potential_value) : 0,
      });
      setOpen(false);
      resetForm();
    } catch { toast.error('Erro ao salvar lead'); }
  };

  const openEdit = (lead: any) => {
    setEditingLead(lead);
    setEditForm({
      name: lead.name, phone: lead.phone || '', email: lead.email || '', origin: lead.origin || '',
      status: lead.status || 'novo', notes: lead.notes || '', next_contact_date: lead.next_contact_date || '',
      tag: (lead.tag as LeadTag) || 'frio', interest: lead.interest || '',
      potential_value: lead.potential_value ? String(lead.potential_value) : '',
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingLead || !editForm.name) return;
    try {
      await updateContact.mutateAsync({
        id: editingLead.id,
        name: editForm.name, phone: editForm.phone, email: editForm.email, origin: editForm.origin,
        status: editForm.status, notes: editForm.notes,
        next_contact_date: editForm.next_contact_date || null,
        tag: editForm.tag, interest: editForm.interest,
        potential_value: editForm.potential_value ? parseFloat(editForm.potential_value) : 0,
      });
      setEditOpen(false);
      setEditingLead(null);
    } catch { toast.error('Erro ao atualizar lead'); }
  };

  const leads = useMemo(() => contacts.filter(c => c.is_lead), [contacts]);

  // Last interaction per contact
  const lastInteractionMap = useMemo(() => {
    const map: Record<string, string> = {};
    interactions.forEach(i => {
      if (!map[i.contact_id] || i.date > map[i.contact_id]) {
        map[i.contact_id] = i.date;
      }
    });
    return map;
  }, [interactions]);

  const handleDrop = async (stage: LeadStage) => {
    if (!dragId) return;
    const lead = leads.find(l => l.id === dragId);
    try {
      await updateContact.mutateAsync({
        id: dragId, stage,
        status: stage === 'fechado' ? 'fechado' : stage === 'perdido' ? 'perdido' : undefined,
      });
      // Post-sale automation: create follow-up task 30 days after closing
      if (stage === 'fechado' && lead) {
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + 30);
        await insertTask.mutateAsync({
          title: `Follow-up pós-venda: ${lead.name}`,
          due_date: followUpDate.toISOString().split('T')[0],
          contact_id: dragId,
        });
        toast.success('Tarefa de pós-venda criada automaticamente (30 dias)');
      }
    } catch { toast.error('Erro ao mover lead'); }
    setDragId(null);
  };

  const openWhatsApp = (lead: any) => {
    setWaLead(lead);
    setWaOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Leads & Prospecção</h1>
          <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Lead</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="11999999999" /></div>
                <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div>
                  <Label>Origem</Label>
                  <Select value={form.origin} onValueChange={v => setForm(f => ({ ...f, origin: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{ORIGINS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tag</Label>
                  <Select value={form.tag} onValueChange={v => setForm(f => ({ ...f, tag: v as LeadTag }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(LEAD_TAG_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Interesse</Label><Input value={form.interest} onChange={e => setForm(f => ({ ...f, interest: e.target.value }))} placeholder="Ex: consultoria, design..." /></div>
                <div><Label>Valor Potencial (R$)</Label><Input type="number" step="0.01" value={form.potential_value} onChange={e => setForm(f => ({ ...f, potential_value: e.target.value }))} placeholder="0,00" /></div>
                <Button onClick={handleSave} className="w-full" disabled={insertContact.isPending}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const stageleads = leads.filter(l => l.stage === stage);
            return (
              <div
                key={stage}
                className={`min-w-[260px] flex-shrink-0 bg-muted/50 rounded-lg border-t-4 ${stageColors[stage]}`}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(stage)}
              >
                <div className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{LEAD_STAGE_LABELS[stage]}</h3>
                    <Badge variant="secondary" className="text-xs">{stageleads.length}</Badge>
                  </div>
                </div>
                <div className="p-2 space-y-2 min-h-[100px]">
                  {stageleads.map(lead => {
                    const lastContact = lastInteractionMap[lead.id];
                    const daysSinceContact = lastContact ? Math.floor((Date.now() - new Date(lastContact).getTime()) / 86400000) : null;
                    const isHighValue = (lead.potential_value ?? 0) >= 5000;
                    const isStale = daysSinceContact !== null && daysSinceContact > 7;

                    return (
                      <Card
                        key={lead.id}
                        draggable
                        onDragStart={() => setDragId(lead.id)}
                        className={`cursor-grab active:cursor-grabbing ${isHighValue ? 'ring-1 ring-primary/30 bg-primary/[0.02]' : ''} ${isStale ? 'border-warning/50' : ''}`}
                      >
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">{lead.name}</p>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); openEdit(lead); }}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <GripVertical className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-wrap">
                            {lead.tag && <Badge className={`text-[10px] px-1.5 py-0 ${tagColors[lead.tag as LeadTag] || ''}`}>{LEAD_TAG_LABELS[lead.tag as LeadTag] || lead.tag}</Badge>}
                            {lead.origin && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{lead.origin}</Badge>}
                          </div>
                          {(lead.potential_value ?? 0) > 0 && (
                            <p className={`text-xs font-semibold ${isHighValue ? 'text-primary' : 'text-muted-foreground'}`}>
                              {formatCurrency(lead.potential_value!)}
                            </p>
                          )}
                          {lastContact && (
                            <p className={`text-[10px] flex items-center gap-1 ${isStale ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                              {isStale && <AlertCircle className="h-3 w-3" />}
                              <Clock className="h-3 w-3" /> {getRelativeTime(lastContact)}
                            </p>
                          )}
                          {lead.interest && <p className="text-xs text-muted-foreground truncate">{lead.interest}</p>}
                          {lead.phone && (
                            <Button variant="ghost" size="sm" className="h-6 text-xs p-0 text-success" onClick={e => { e.stopPropagation(); openWhatsApp(lead); }}>
                              <MessageCircle className="h-3 w-3 mr-1" /> WhatsApp
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Edit Lead Dialog */}
        <Dialog open={editOpen} onOpenChange={v => { setEditOpen(v); if (!v) setEditingLead(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Lead</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              <div><Label>Nome *</Label><Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>Telefone</Label><Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div><Label>Email</Label><Input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div>
                <Label>Origem</Label>
                <Select value={editForm.origin} onValueChange={v => setEditForm(f => ({ ...f, origin: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{ORIGINS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v as ContactStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(CONTACT_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tag</Label>
                <Select value={editForm.tag} onValueChange={v => setEditForm(f => ({ ...f, tag: v as LeadTag }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(LEAD_TAG_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Interesse</Label><Input value={editForm.interest} onChange={e => setEditForm(f => ({ ...f, interest: e.target.value }))} /></div>
              <div><Label>Valor Potencial (R$)</Label><Input type="number" step="0.01" value={editForm.potential_value} onChange={e => setEditForm(f => ({ ...f, potential_value: e.target.value }))} /></div>
              <div><Label>Próximo Contato</Label><Input type="date" value={editForm.next_contact_date} onChange={e => setEditForm(f => ({ ...f, next_contact_date: e.target.value }))} /></div>
              <div><Label>Observações</Label><Textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <div className="flex gap-2">
                <Button onClick={handleEditSave} className="flex-1" disabled={updateContact.isPending}>Salvar Alterações</Button>
                <Button variant="outline" onClick={() => { setEditOpen(false); setEditingLead(null); }}>Cancelar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* WhatsApp Template Selector */}
        {waLead && (
          <WhatsAppTemplateSelector
            open={waOpen}
            onOpenChange={v => { setWaOpen(v); if (!v) setWaLead(null); }}
            phone={waLead.phone || ''}
            leadName={waLead.name}
          />
        )}
      </div>
    </AppLayout>
  );
}
