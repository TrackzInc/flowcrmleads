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
import { useContacts, useTransactions, useInteractions, useTemplates } from '@/hooks/useStore';
import { Contact, ContactStatus, CONTACT_STATUS_LABELS, ORIGINS } from '@/types';
import { formatCurrency, formatDate, generateId, whatsappLink, isOverdue } from '@/lib/helpers';
import { Plus, Search, MessageCircle, Phone, Mail, ChevronRight, AlertTriangle } from 'lucide-react';

const statusColors: Record<ContactStatus, string> = {
  novo: 'status-novo',
  em_contato: 'status-contato',
  negociacao: 'status-negociacao',
  fechado: 'status-fechado',
  perdido: 'status-perdido',
};

export default function ContatosPage() {
  const [contacts, setContacts] = useContacts();
  const [transactions] = useTransactions();
  const [interactions, setInteractions] = useInteractions();
  const [templates] = useTemplates();
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [whatsappOpen, setWhatsappOpen] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', origin: '', status: 'novo' as ContactStatus, notes: '', nextContactDate: '',
  });

  const resetForm = () => setForm({ name: '', phone: '', email: '', origin: '', status: 'novo', notes: '', nextContactDate: '' });

  const handleSave = () => {
    if (!form.name) return;
    const contact: Contact = {
      id: generateId(), ...form, createdAt: new Date().toISOString(),
    };
    setContacts(prev => [contact, ...prev]);
    setOpen(false);
    resetForm();
  };

  const filtered = useMemo(() => {
    return contacts
      .filter(c => !c.isLead)
      .filter(c => filterStatus === 'all' || c.status === filterStatus)
      .filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [contacts, filterStatus, search]);

  const detail = detailId ? contacts.find(c => c.id === detailId) : null;
  const detailTx = detail ? transactions.filter(t => t.contactId === detail.id) : [];
  const detailRevenue = detailTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const detailInteractions = detail ? interactions.filter(i => i.contactId === detail.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

  const [interactionNote, setInteractionNote] = useState('');
  const addInteraction = () => {
    if (!detail || !interactionNote) return;
    setInteractions(prev => [...prev, { id: generateId(), contactId: detail.id, date: new Date().toISOString(), type: 'nota', note: interactionNote }]);
    setInteractionNote('');
  };

  if (detail) {
    return (
      <AppLayout>
        <div className="space-y-6 max-w-2xl">
          <Button variant="ghost" size="sm" onClick={() => setDetailId(null)}>← Voltar</Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{detail.name}</h1>
              <Badge className={statusColors[detail.status]}>{CONTACT_STATUS_LABELS[detail.status]}</Badge>
            </div>
            <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => window.open(whatsappLink(detail.phone), '_blank')}>
              <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
            </Button>
          </div>

          <Card>
            <CardContent className="pt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {detail.phone}</div>
              {detail.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {detail.email}</div>}
              <div>Origem: {detail.origin}</div>
              {detail.nextContactDate && (
                <div className={`flex items-center gap-1 ${isOverdue(detail.nextContactDate) ? 'text-destructive font-medium' : ''}`}>
                  {isOverdue(detail.nextContactDate) && <AlertTriangle className="h-3 w-3" />}
                  Próximo contato: {formatDate(detail.nextContactDate)}
                </div>
              )}
              {detail.notes && <div className="pt-2 border-t"><p className="text-muted-foreground">{detail.notes}</p></div>}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <p className="text-sm font-medium mb-1">Receita Gerada</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(detailRevenue)}</p>
              {detailTx.length > 0 && (
                <div className="mt-3 space-y-1">
                  {detailTx.slice(0, 5).map(t => (
                    <div key={t.id} className="text-xs flex justify-between">
                      <span>{t.description || t.category} · {formatDate(t.date)}</span>
                      <span className={t.type === 'income' ? 'text-success' : 'text-destructive'}>{formatCurrency(t.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 space-y-3">
              <p className="text-sm font-medium">Histórico de Interações</p>
              <div className="flex gap-2">
                <Input value={interactionNote} onChange={e => setInteractionNote(e.target.value)} placeholder="Adicionar nota..." className="flex-1" />
                <Button size="sm" onClick={addInteraction}>Adicionar</Button>
              </div>
              {detailInteractions.map(i => (
                <div key={i.id} className="text-sm p-2 rounded bg-muted">
                  <p>{i.note}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(i.date)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Contatos</h1>
          <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Contato</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Contato</DialogTitle></DialogHeader>
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
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as ContactStatus }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(CONTACT_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Próximo Contato</Label><Input type="date" value={form.nextContactDate} onChange={e => setForm(f => ({ ...f, nextContactDate: e.target.value }))} /></div>
                <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                <Button onClick={handleSave} className="w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar contato..." className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(CONTACT_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {filtered.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">Nenhum contato encontrado</p>}
          {filtered.map(c => {
            const revenue = transactions.filter(t => t.contactId === c.id && t.type === 'income').reduce((s, t) => s + t.amount, 0);
            return (
              <Card key={c.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setDetailId(c.id)}>
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${statusColors[c.status]}`}>{CONTACT_STATUS_LABELS[c.status]}</Badge>
                        {c.origin && <span>{c.origin}</span>}
                        {revenue > 0 && <span className="text-success font-medium">{formatCurrency(revenue)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {c.nextContactDate && isOverdue(c.nextContactDate) && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    {c.phone && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); setWhatsappOpen(c.id); }}>
                        <MessageCircle className="h-4 w-4 text-success" />
                      </Button>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Dialog open={!!whatsappOpen} onOpenChange={() => setWhatsappOpen(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Enviar via WhatsApp</DialogTitle></DialogHeader>
            <div className="space-y-2">
              {templates.map(t => {
                const contact = whatsappOpen ? contacts.find(c => c.id === whatsappOpen) : null;
                return (
                  <Button key={t.id} variant="outline" className="w-full text-left justify-start h-auto py-3" onClick={() => { if (contact) window.open(whatsappLink(contact.phone, t.content), '_blank'); setWhatsappOpen(null); }}>
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{t.content}</p>
                    </div>
                  </Button>
                );
              })}
              <Button variant="outline" className="w-full" onClick={() => { const c = whatsappOpen ? contacts.find(ct => ct.id === whatsappOpen) : null; if (c) window.open(whatsappLink(c.phone), '_blank'); setWhatsappOpen(null); }}>
                Abrir sem mensagem
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
