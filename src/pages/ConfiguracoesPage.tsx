import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getWebhookUrl, setWebhookUrl, fireFinanceWebhook } from '@/lib/financeWebhook';
import { toast } from 'sonner';
import { Link2, Send } from 'lucide-react';

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => { if (user) setUrl(getWebhookUrl(user.id)); }, [user]);

  const save = () => {
    if (!user) return;
    if (url && !/^https?:\/\//i.test(url)) {
      toast.error('URL inválida (deve começar com http:// ou https://)');
      return;
    }
    setWebhookUrl(user.id, url.trim());
    toast.success('Webhook salvo');
  };

  const test = async () => {
    if (!user || !url) { toast.error('Salve a URL antes de testar'); return; }
    setTesting(true);
    await fireFinanceWebhook(user.id, 'test.ping', { message: 'Teste de integração FlowCRM' });
    setTesting(false);
    toast.success('Evento de teste enviado. Verifique no gestor financeiro.');
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-2xl font-bold">Configurações</h1>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" /> Integração com Gestor Financeiro</CardTitle>
            <CardDescription>
              Cole abaixo a URL do webhook do seu gestor financeiro (outro app Lovable).
              O CRM enviará um POST automático quando:
              <ul className="list-disc ml-5 mt-2 text-sm">
                <li>Um lead mudar para etapa <strong>Fechado</strong> (evento <code>lead.closed</code>)</li>
                <li>Você registrar uma <strong>receita</strong> (evento <code>transaction.income</code>)</li>
              </ul>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>URL do Webhook</Label>
              <Input
                type="url"
                placeholder="https://seu-financeiro.lovable.app/functions/v1/receive-crm-event"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={save}>Salvar</Button>
              <Button variant="outline" onClick={test} disabled={testing || !url}>
                <Send className="h-4 w-4 mr-1" /> {testing ? 'Enviando...' : 'Enviar teste'}
              </Button>
            </div>

            <div className="rounded-md bg-muted p-3 text-xs space-y-2">
              <p className="font-semibold">Formato do payload enviado:</p>
              <pre className="overflow-auto">{`{
  "event": "lead.closed" | "transaction.income" | "test.ping",
  "timestamp": "2026-05-09T12:00:00.000Z",
  "source": "flowcrm",
  "data": { ... }
}`}</pre>
              <p className="text-muted-foreground">
                No gestor financeiro, crie uma edge function pública que receba esse POST e insira na tabela de transações.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}