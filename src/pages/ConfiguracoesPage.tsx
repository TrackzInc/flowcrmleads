import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getWebhookUrl, setWebhookUrl, getWebhookSecret, setWebhookSecret, fireFinanceWebhook } from '@/lib/financeWebhook';
import { toast } from 'sonner';
import { Link2, Send, KeyRound, RefreshCw } from 'lucide-react';

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (user) {
      setUrl(getWebhookUrl(user.id));
      setSecret(getWebhookSecret(user.id));
    }
  }, [user]);

  const save = () => {
    if (!user) return;
    if (url && !/^https?:\/\//i.test(url)) {
      toast.error('URL inválida (deve começar com http:// ou https://)');
      return;
    }
    setWebhookUrl(user.id, url.trim());
    setWebhookSecret(user.id, secret.trim());
    toast.success('Webhook salvo');
  };

  const generateSecret = () => {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    const hex = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    setSecret(hex);
    toast.success('Secret gerado. Lembre de salvar e copiar para o gestor financeiro.');
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
            <div>
              <Label className="flex items-center gap-1"><KeyRound className="h-3.5 w-3.5" /> CRM_WEBHOOK_SECRET</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Cole ou gere uma chave secreta longa"
                  value={secret}
                  onChange={e => setSecret(e.target.value)}
                  className="font-mono text-xs"
                />
                <Button type="button" variant="outline" onClick={generateSecret} title="Gerar novo secret">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Esse mesmo valor deve ser cadastrado como <code>CRM_WEBHOOK_SECRET</code> no gestor financeiro.
                Será enviado nos headers <code>Authorization: Bearer &lt;secret&gt;</code> e <code>X-Webhook-Secret</code>.
              </p>
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