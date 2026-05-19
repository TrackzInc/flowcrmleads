import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectTemplates, createProjectFromTemplate } from '@/hooks/useProjects';
import { useContacts } from '@/hooks/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialName?: string;
  initialContactId?: string;
  initialCompany?: string;
  initialValue?: number;
};

export function NewProjectDialog({
  open,
  onOpenChange,
  initialName = '',
  initialContactId,
  initialCompany = '',
  initialValue = 0,
}: Props) {
  const { data: templates = [] } = useProjectTemplates();
  const { data: contacts = [] } = useContacts();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [name, setName] = useState(initialName);
  const [contactId, setContactId] = useState<string | undefined>(initialContactId);
  const [company, setCompany] = useState(initialCompany);
  const [value, setValue] = useState<number>(initialValue);
  const [notes, setNotes] = useState('');
  const [templateId, setTemplateId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setContactId(initialContactId);
      setCompany(initialCompany);
      setValue(initialValue);
      setNotes('');
      // Always ensure a template is selected if available
      if (templates.length > 0) {
        setTemplateId(templates[0].id);
      }
    }
  }, [open, initialName, initialContactId, initialCompany, initialValue, templates]);

  const handleCreate = async () => {
    if (!user || !name || !templateId) {
      toast.error('Informe o nome e selecione um template');
      return;
    }
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    setSaving(true);
    try {
      await createProjectFromTemplate({
        user_id: user.id,
        template,
        name,
        contact_id: contactId ?? null,
        company,
        value,
        notes,
      });
      toast.success('Projeto criado!');
      qc.invalidateQueries({ queryKey: ['projects'] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao criar projeto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Projeto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <Label>Nome do projeto *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Site Imobiliária Alpha" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cliente</Label>
              <Select value={contactId ?? ''} onValueChange={v => setContactId(v || undefined)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {contacts.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Empresa</Label>
              <Input value={company} onChange={e => setCompany(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Valor do projeto (R$)</Label>
            <Input type="number" value={value} onChange={e => setValue(Number(e.target.value))} />
          </div>

          <div>
            <Label>Selecione um template *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {templates.map(t => {
                const selected = templateId === t.id;
                return (
                  <Card
                    key={t.id}
                    onClick={() => setTemplateId(t.id)}
                    className={`cursor-pointer p-3 transition ${selected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/40'}`}
                  >
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{t.project_type}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {(t.checklist as any[])?.length ?? 0} itens na checklist
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Observações iniciais</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>

          <Button onClick={handleCreate} disabled={saving} className="w-full">
            {saving ? 'Criando...' : 'Criar projeto'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}