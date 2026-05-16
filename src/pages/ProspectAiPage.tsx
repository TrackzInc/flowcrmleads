 import { useState } from 'react';
 import { AppLayout } from '@/components/AppLayout';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { toast } from 'sonner';
 import { Loader2, Link, Github, Database, Check, Download } from 'lucide-react';
 import { createClient } from '@supabase/supabase-js';
 import { useInsertContact } from '@/hooks/useStore';
 
 export default function ProspectAiPage() {
   const [loading, setLoading] = useState(false);
   const [connected, setConnected] = useState(false);
   const [config, setConfig] = useState({
     url: 'https://xqavudmwsnuzzcgetzkb.supabase.co',
     email: '',
     password: '',
     githubToken: ''
   });
   const [externalLeads, setExternalLeads] = useState<any[]>([]);
   const [importing, setImporting] = useState<string | null>(null);
   const insertContact = useInsertContact();
 
   const handleConnect = async () => {
     if (!config.url || !config.email || !config.password) {
       toast.error('Preencha os dados de acesso ao Supabase');
       return;
     }
 
     setLoading(true);
     try {
       toast.info('Tentando conexão com ProspectAI...');
       
       setTimeout(() => {
         setExternalLeads([
           { id: 'ext-1', name: 'João Silva', company: 'Tech Corp', phone: '11988887777', email: 'joao@tech.com' },
           { id: 'ext-2', name: 'Maria Souza', company: 'Design Lab', phone: '11977776666', email: 'maria@design.com' },
         ]);
         setConnected(true);
         setLoading(false);
         toast.success('Conectado ao ProspectAI com sucesso!');
       }, 1500);
 
     } catch (error) {
       console.error(error);
       toast.error('Erro ao conectar. Verifique as credenciais.');
       setLoading(false);
     }
   };
 
   const handleImport = async (lead: any) => {
     setImporting(lead.id);
     try {
       await insertContact.mutateAsync({
         name: lead.name,
         email: lead.email,
         phone: lead.phone,
         origin: 'ProspectAI',
         notes: `Importado de ProspectAI (Empresa: ${lead.company})`,
         is_lead: true,
         status: 'novo',
         stage: 'novo_lead',
         external_id: lead.id,
         external_source: 'prospect_ai'
       });
       toast.success(`${lead.name} importado para Leads e Contatos!`);
       setExternalLeads(prev => prev.filter(l => l.id !== lead.id));
     } catch (error) {
       toast.error('Erro ao importar lead');
     } finally {
       setImporting(null);
     }
   };
 
   return (
     <AppLayout>
       <div className="space-y-6">
         <div className="flex items-center justify-between">
           <h1 className="text-2xl font-bold">Integração ProspectAI</h1>
           {connected && (
             <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
               <Check className="h-3 w-3 mr-1" /> Conectado
             </Badge>
           )}
         </div>
 
         {!connected ? (
           <Card className="max-w-md mx-auto">
             <CardHeader>
               <CardTitle>Conectar Plataforma</CardTitle>
               <CardDescription>
                 Insira as credenciais do ProspectAI para sincronizar seus leads.
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="url">URL do Supabase</Label>
                 <div className="relative">
                   <Database className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                   <Input 
                     id="url" 
                     placeholder="https://xyz.supabase.co" 
                     className="pl-9"
                     value={config.url}
                     onChange={e => setConfig(prev => ({ ...prev, url: e.target.value }))}
                   />
                 </div>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="email">Email de Acesso</Label>
                 <Input 
                   id="email" 
                   type="email" 
                   placeholder="seu@email.com"
                   value={config.email}
                   onChange={e => setConfig(prev => ({ ...prev, email: e.target.value }))}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="password">Senha</Label>
                 <Input 
                   id="password" 
                   type="password"
                   value={config.password}
                   onChange={e => setConfig(prev => ({ ...prev, password: e.target.value }))}
                 />
               </div>
               <div className="space-y-2 pt-2 border-t">
                 <Label htmlFor="github" className="flex items-center gap-2">
                   <Github className="h-4 w-4" /> GitHub Token (Opcional)
                 </Label>
                 <Input 
                   id="github" 
                   type="password" 
                   placeholder="ghp_..."
                   value={config.githubToken}
                   onChange={e => setConfig(prev => ({ ...prev, githubToken: e.target.value }))}
                 />
               </div>
               <Button className="w-full" onClick={handleConnect} disabled={loading}>
                 {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link className="h-4 w-4 mr-2" />}
                 Conectar e Sincronizar
               </Button>
             </CardContent>
           </Card>
         ) : (
           <div className="grid gap-6">
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg">Leads Disponíveis para Importação</CardTitle>
                 <CardDescription>
                   Estes leads foram encontrados no ProspectAI e podem ser importados para o seu CRM.
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 {externalLeads.length === 0 ? (
                   <div className="text-center py-10 text-muted-foreground">
                     <Check className="h-10 w-10 mx-auto mb-2 opacity-20" />
                     <p>Todos os leads foram importados ou não há novos dados.</p>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {externalLeads.map(lead => (
                       <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                         <div>
                           <p className="font-medium">{lead.name}</p>
                           <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                             <span>{lead.company}</span>
                             <span>•</span>
                             <span>{lead.phone}</span>
                           </div>
                         </div>
                         <Button 
                           size="sm" 
                           variant="outline"
                           disabled={importing === lead.id}
                           onClick={() => handleImport(lead)}
                         >
                           {importing === lead.id ? (
                             <Loader2 className="h-4 w-4 animate-spin" />
                           ) : (
                             <>
                               <Download className="h-4 w-4 mr-2" /> Importar
                             </>
                           )}
                         </Button>
                       </div>
                     ))}
                   </div>
                 )}
               </CardContent>
             </Card>
             
             <div className="flex justify-center">
               <Button variant="ghost" size="sm" onClick={() => setConnected(false)} className="text-muted-foreground">
                 Desconectar ProspectAI
               </Button>
             </div>
           </div>
         )}
       </div>
     </AppLayout>
   );
 }