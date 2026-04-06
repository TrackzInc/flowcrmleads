import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useContacts, useInsertInteraction, useUpdateContact } from '@/hooks/useStore';
import { formatCurrency, whatsappLink } from '@/lib/helpers';
import { LEAD_STAGE_LABELS, LeadStage } from '@/types';
import { MessageCircle, SkipForward, Save, Crosshair } from 'lucide-react';
import { toast } from 'sonner';
import { WhatsAppTemplateSelector } from '@/components/WhatsAppTemplateSelector';

export default function ProspeccaoPage() {
  const { data: contacts = [] } = useContacts();
  const insertInteraction = useInsertInteraction();
  const updateContact = useUpdateContact();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [note, setNote] = useState('');
  const [waOpen, setWaOpen] = useState(false);

  // Active leads sorted by potential value desc
  const leads = useMemo(() => {
    return contacts
      .filter(c => c.is_lead && c.stage !== 'fechado' && c.stage !== 'perdido')
      .sort((a, b) => (b.potential_value ?? 0) - (a.potential_value ?? 0));
  }, [contacts]);

  const lead = leads[currentIndex];

  const saveNote = async () => {
    if (!lead || !note.trim()) return;
    try {
      await insertInteraction.mutateAsync({
        contact_id: lead.id,
        type: 'nota',
        note: note.trim(),
        date: new Date().toISOString(),
      });
      toast.success('Anotação salva');
      setNote('');
    } catch {
      toast.error('Erro ao salvar');
    }
  };

  const next = async () => {
    if (note.trim() && lead) await saveNote();
    setNote('');
    setCurrentIndex(i => (i + 1) % Math.max(leads.length, 1));
  };

  if (leads.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <Crosshair className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Nenhum lead ativo</h2>
          <p className="text-muted-foreground">Adicione leads para iniciar a prospecção.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            <Crosshair className="h-6 w-6" /> Modo Prospecção
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lead {currentIndex + 1} de {leads.length}
          </p>
        </div>

        <Card className="border-2 border-primary/30">
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold">{lead.name}</h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant="secondary">
                  {LEAD_STAGE_LABELS[lead.stage as LeadStage] || lead.stage}
                </Badge>
                {(lead.potential_value ?? 0) > 0 && (
                  <span className="text-lg font-bold text-primary">{formatCurrency(lead.potential_value!)}</span>
                )}
              </div>
            </div>

            {lead.phone && (
              <p className="text-center text-sm text-muted-foreground">{lead.phone}</p>
            )}

            {lead.interest && (
              <p className="text-center text-sm text-muted-foreground">Interesse: {lead.interest}</p>
            )}

            <div className="space-y-2">
              <Textarea
                placeholder="Anotação rápida..."
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
              />
              {note.trim() && (
                <Button variant="outline" size="sm" className="w-full" onClick={saveNote}>
                  <Save className="h-3 w-3 mr-1" /> Salvar anotação
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {lead.phone && (
                <Button
                  className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                  onClick={() => setWaOpen(true)}
                >
                  <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
                </Button>
              )}
              <Button className="flex-1" onClick={next}>
                <SkipForward className="h-4 w-4 mr-1" /> Próximo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {lead.phone && (
        <WhatsAppTemplateSelector
          open={waOpen}
          onOpenChange={setWaOpen}
          phone={lead.phone}
          leadName={lead.name}
        />
      )}
    </AppLayout>
  );
}
