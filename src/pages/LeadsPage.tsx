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
import { useContacts, useInsertContact, useUpdateContact, useInteractions, useInsertTask, useServices } from '@/hooks/useStore';
import { LeadStage, LeadTag, LEAD_STAGE_LABELS, LEAD_TAG_LABELS, ORIGINS, CONTACT_STATUS_LABELS, ContactStatus } from '@/types';
import { formatCurrency } from '@/lib/helpers';
import { Plus, GripVertical, Pencil, MessageCircle, AlertCircle, Clock, X, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { WhatsAppTemplateSelector } from '@/components/WhatsAppTemplateSelector';
import { NewProjectDialog } from '@/components/projects/NewProjectDialog';

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
  const { data: services = [] } = useServices();
  const insertContact = useInsertContact();
  const updateContact = useUpdateContact();
  const insertTask = useInsertTask();

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [waOpen, setWaOpen] = useState(false);
  const [waLead, setWaLead] = useState<any>(null);
  const [projectOpen, setProjectOpen] = useState(false);
  const [projectLead, setProjectLead] = useState<any>(null);
  const [currentLeadStage, setCurrentLeadStage] = useState<string | undefined>();

  const [form, setForm] = useState({
    name: '', phone: '', email: '', origin: '', tag: 'frio' as LeadTag, selectedServices: [] as string[],
  });

  const [editForm, setEditForm] = useState({
    name: '', phone: '', email: '', origin: '', status: 'novo' as ContactStatus,
    notes: '', next_contact_date: '', tag: 'frio' as LeadTag, selectedServices: [] as string[],
    document_links: '' as string,
  });

  const resetForm = () => setForm({ name: '', phone: '', email: '', origin: '', tag: 'frio', selectedServices: [] });

  const getSelectedServicesTotal = (selectedIds: string[]) => {
    return services.filter(s => selectedIds.includes(s.id)).reduce((sum, s) => sum + Number(s.price), 0);
  };

  const getInterestString = (selectedIds: string[]) => {
    return services.filter(s => selectedIds.includes(s.id)).map(s => s.name).join(', ');
  };

  const toggleService = (serviceId: string, formType: 'create' | 'edit') => {
    if (formType === 'create') {
      setForm(f => ({
        ...f,
        selectedServices: f.selectedServices.includes(serviceId)
          ? f.selectedServices.filter(id => id !== serviceId)
          : [...f.selectedServices, serviceId],
      }));
    } else {
      setEditForm(f => ({
        ...f,
        selectedServices: f.selectedServices.includes(serviceId)
          ? f.selectedServices.filter(id => id !== serviceId)
          : [...f.selectedServices, serviceId],
      }));
    }
  };

  const handleSave = async () => {
    if (!form.name) return;
    try {
      await insertContact.mutateAsync({
        name: form.name, phone: form.phone, email: form.email, origin: form.origin,
        tag: form.tag, interest: getInterestString(form.selectedServices), stage: 'novo_lead', is_lead: true, status: 'novo',
        potential_value: getSelectedServicesTotal(form.selectedServices),
      });
      setOpen(false);
      resetForm();
    } catch { toast.error('Erro ao salvar lead'); }
  };

  const openEdit = (lead: any) => {
    setEditingLead(lead);
    const links = Array.isArray(lead.document_links) ? lead.document_links.join('\n') : '';
    const interestNames = (lead.interest || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const matchedServiceIds = services.filter(s => interestNames.includes(s.name)).map(s => s.id);
    setEditForm({
      name: lead.name, phone: lead.phone || '', email: lead.email || '', origin: lead.origin || '',
      status: lead.status || 'novo', notes: lead.notes || '', next_contact_date: lead.next_contact_date || '',
      tag: (lead.tag as LeadTag) || 'frio', selectedServices: matchedServiceIds,
      document_links: links,
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingLead || !editForm.name) return;
    const docLinks = editForm.document_links.split('\n').map(s => s.trim()).filter(Boolean);
    try {
      await updateContact.mutateAsync({
        id: editingLead.id,
        name: editForm.name, phone: editForm.phone, email: editForm.email, origin: editForm.origin,
        status: editForm.status, notes: editForm.notes,
        next_contact_date: editForm.next_contact_date || null,
        tag: editForm.tag, interest: getInterestString(editForm.selectedServices),
        potential_value: getSelectedServicesTotal(editForm.selectedServices),
        document_links: docLinks as any,
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
    if (!lead) return;

    try {
      await updateContact.mutateAsync({
        id: dragId, 
        stage,
        status: stage === 'fechado' ? 'fechado' : stage === 'perdido' ? 'perdido' : undefined,
      });

      // Automation: Create project if moving to 'em_negociacao' or 'fechado' and no project exists
      if ((stage === 'em_negociacao' || stage === 'fechado') && !lead.project_id) {
        setProjectLead(lead);
        setCurrentLeadStage(stage);
        setProjectOpen(true);
      }

      // Post-sale automation: create follow-up task 30 days after closing
      if (stage === 'fechado') {
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + 30);
        await insertTask.mutateAsync({
          title: `Follow-up pós-venda: ${lead.name}`,
          due_date: followUpDate.toISOString().split('T')[0],
          contact_id: dragId,
        });
        toast.success('Tarefa de pós-venda criada automaticamente (30 dias)');
      }
    } catch { 
      toast.error('Erro ao mover lead'); 
    }
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
                <div>
                  <Label>Interesse (Serviços)</Label>
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between cursor-pointer border rounded-md px-3 py-2 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {form.selectedServices.length > 0
                            ? `${form.selectedServices.length} serviço(s) selecionado(s)`
                            : 'Selecione os serviços'}
                        </span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CollapsibleTrigger>
                    {form.selectedServices.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {services.filter(s => form.selectedServices.includes(s.id)).map(s => (
                          <Badge key={s.id} variant="default" className="text-xs cursor-pointer" onClick={() => toggleService(s.id, 'create')}>
                            {s.name} <X className="h-3 w-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    )}
                    <CollapsibleContent>
                      <div className="flex flex-wrap gap-1.5 mt-1 p-2 border rounded-md min-h-[40px]">
                        {services.map(s => {
                          const selected = form.selectedServices.includes(s.id);
                          return (
                            <Badge
                              key={s.id}
                              variant={selected ? 'default' : 'outline'}
                              className={`cursor-pointer text-xs ${selected ? '' : 'opacity-60 hover:opacity-100'}`}
                              onClick={() => toggleService(s.id, 'create')}
                            >
                              {s.name} - {formatCurrency(Number(s.price))}
                              {selected && <X className="h-3 w-3 ml-1" />}
                            </Badge>
                          );
                        })}
                        {services.length === 0 && <span className="text-xs text-muted-foreground">Cadastre serviços primeiro</span>}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
                <div>
                  <Label>Valor Potencial (R$)</Label>
                  <Input type="text" readOnly value={formatCurrency(getSelectedServicesTotal(form.selectedServices))} className="bg-muted" />
                </div>
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
              <div>
                <Label>Interesse (Serviços)</Label>
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between cursor-pointer border rounded-md px-3 py-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {editForm.selectedServices.length > 0
                          ? `${editForm.selectedServices.length} serviço(s) selecionado(s)`
                          : 'Selecione os serviços'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CollapsibleTrigger>
                  {editForm.selectedServices.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {services.filter(s => editForm.selectedServices.includes(s.id)).map(s => (
                        <Badge key={s.id} variant="default" className="text-xs cursor-pointer" onClick={() => toggleService(s.id, 'edit')}>
                          {s.name} <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                  <CollapsibleContent>
                    <div className="flex flex-wrap gap-1.5 mt-1 p-2 border rounded-md min-h-[40px]">
                      {services.map(s => {
                        const selected = editForm.selectedServices.includes(s.id);
                        return (
                          <Badge
                            key={s.id}
                            variant={selected ? 'default' : 'outline'}
                            className={`cursor-pointer text-xs ${selected ? '' : 'opacity-60 hover:opacity-100'}`}
                            onClick={() => toggleService(s.id, 'edit')}
                          >
                            {s.name} - {formatCurrency(Number(s.price))}
                            {selected && <X className="h-3 w-3 ml-1" />}
                          </Badge>
                        );
                      })}
                      {services.length === 0 && <span className="text-xs text-muted-foreground">Cadastre serviços primeiro</span>}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
              <div>
                <Label>Valor Potencial (R$)</Label>
                <Input type="text" readOnly value={formatCurrency(getSelectedServicesTotal(editForm.selectedServices))} className="bg-muted" />
              </div>
              <div><Label>Próximo Contato</Label><Input type="date" value={editForm.next_contact_date} onChange={e => setEditForm(f => ({ ...f, next_contact_date: e.target.value }))} /></div>
              <div><Label>Observações</Label><Textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <div>
                <Label>Documentos/Propostas (links, um por linha)</Label>
                <Textarea
                  value={editForm.document_links}
                  onChange={e => setEditForm(f => ({ ...f, document_links: e.target.value }))}
                  placeholder="https://drive.google.com/...&#10;https://notion.so/..."
                  rows={3}
                />
              </div>
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

        <NewProjectDialog
          open={projectOpen}
          onOpenChange={v => { setProjectOpen(v); if (!v) setProjectLead(null); }}
          initialName={projectLead ? `Projeto - ${projectLead.name}` : ''}
          initialContactId={projectLead?.id}
          initialValue={Number(projectLead?.potential_value ?? 0)}
          sourceLeadStage={currentLeadStage}
        />
      </div>
    </AppLayout>
  );
}
