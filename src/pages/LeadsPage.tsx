import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useContacts } from '@/hooks/useStore';
import { Contact, LeadStage, LeadTag, LEAD_STAGE_LABELS, LEAD_TAG_LABELS, ORIGINS } from '@/types';
import { generateId, whatsappLink } from '@/lib/helpers';
import { Plus, MessageCircle, GripVertical } from 'lucide-react';

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

export default function LeadsPage() {
  const [contacts, setContacts] = useContacts();
  const [open, setOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', origin: '', tag: 'frio' as LeadTag, interest: '',
  });

  const resetForm = () => setForm({ name: '', phone: '', email: '', origin: '', tag: 'frio', interest: '' });

  const handleSave = () => {
    if (!form.name) return;
    const lead: Contact = {
      id: generateId(),
      name: form.name,
      phone: form.phone,
      email: form.email,
      origin: form.origin,
      status: 'novo',
      notes: '',
      createdAt: new Date().toISOString(),
      tag: form.tag,
      interest: form.interest,
      stage: 'novo_lead',
      isLead: true,
    };
    setContacts(prev => [lead, ...prev]);
    setOpen(false);
    resetForm();
  };

  const leads = useMemo(() => contacts.filter(c => c.isLead), [contacts]);

  const handleDrop = (stage: LeadStage) => {
    if (!dragId) return;
    setContacts(prev => prev.map(c => c.id === dragId ? { ...c, stage, status: stage === 'fechado' ? 'fechado' : stage === 'perdido' ? 'perdido' : c.status } : c));
    setDragId(null);
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
                <div><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+5511999999999" /></div>
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
                <Button onClick={handleSave} className="w-full">Salvar</Button>
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
                className={`min-w-[240px] flex-shrink-0 bg-muted/50 rounded-lg border-t-4 ${stageColors[stage]}`}
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
                  {stageleads.map(lead => (
                    <Card
                      key={lead.id}
                      draggable
                      onDragStart={() => setDragId(lead.id)}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{lead.name}</p>
                          <GripVertical className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          {lead.tag && <Badge className={`text-[10px] px-1.5 py-0 ${tagColors[lead.tag]}`}>{LEAD_TAG_LABELS[lead.tag]}</Badge>}
                          {lead.origin && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{lead.origin}</Badge>}
                        </div>
                        {lead.interest && <p className="text-xs text-muted-foreground">{lead.interest}</p>}
                        {lead.phone && (
                          <Button variant="ghost" size="sm" className="h-6 text-xs p-0 text-success" onClick={() => window.open(whatsappLink(lead.phone), '_blank')}>
                            <MessageCircle className="h-3 w-3 mr-1" /> WhatsApp
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
