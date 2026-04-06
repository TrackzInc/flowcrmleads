import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { whatsappLink } from '@/lib/helpers';
import { MessageCircle, Send } from 'lucide-react';

const DEFAULT_TEMPLATES = [
  {
    name: 'Abordagem Inicial',
    content: 'Fala, [nome]! Vi seu perfil e acredito que posso te ajudar com [serviço]. Posso te explicar rápido?',
  },
  {
    name: 'Follow-up',
    content: 'Fala, [nome]! Só passando pra te dar um retorno rápido sobre o que conversamos.',
  },
  {
    name: 'Fechamento',
    content: 'Consigo iniciar isso pra você ainda hoje. Quer que eu te envie os detalhes?',
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: string;
  leadName: string;
}

export function WhatsAppTemplateSelector({ open, onOpenChange, phone, leadName }: Props) {
  const [message, setMessage] = useState('');

  const applyTemplate = (template: string) => {
    setMessage(template.replace(/\[nome\]/g, leadName));
  };

  const send = () => {
    window.open(whatsappLink(phone, message || undefined), '_blank');
    onOpenChange(false);
    setMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) setMessage(''); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-success" /> WhatsApp para {leadName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Templates prontos</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {DEFAULT_TEMPLATES.map(t => (
                <Button
                  key={t.name}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => applyTemplate(t.content)}
                >
                  {t.name}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label>Mensagem</Label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Digite ou selecione um template..."
              rows={4}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={send} className="flex-1 bg-success hover:bg-success/90 text-success-foreground">
              <Send className="h-4 w-4 mr-1" /> Enviar no WhatsApp
            </Button>
            <Button variant="ghost" onClick={() => { window.open(whatsappLink(phone), '_blank'); onOpenChange(false); }}>
              Sem mensagem
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
