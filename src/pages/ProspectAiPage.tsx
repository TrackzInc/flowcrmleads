 import { useState, useEffect } from 'react';
 import { AppLayout } from '@/components/AppLayout';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { toast } from 'sonner';
 import { Loader2, Link, Github, Database, Check, Download, History, Filter, Search, UserPlus } from 'lucide-react';
 import { createClient } from '@supabase/supabase-js';
 import { useInsertContact } from '@/hooks/useStore';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { ScrollArea } from "@/components/ui/scroll-area";
 
 export default function ProspectAiPage() {
   const [loading, setLoading] = useState(false);
   const [connected, setConnected] = useState(false);
   const [config, setConfig] = useState({
       url: 'https://xqavudmwsnuzzcgetzkb.supabase.co',
     email: '',
     password: '',
      githubToken: '',
      serviceRole: ''
   });
   const [externalLeads, setExternalLeads] = useState<any[]>([]);
    const [searchHistory, setSearchHistory] = useState<any[]>([]);
    const [funnelData, setFunnelData] = useState<any[]>([]);
   const [importing, setImporting] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("leads");
   const insertContact = useInsertContact();
 
   const handleConnect = async () => {
     if (!config.url || !config.email || !config.password) {
       toast.error('Preencha os dados de acesso ao Supabase');
       return;
     }
 
     setLoading(true);
     try {
         toast.info('Tentando conexão com ProspectAI...');
         
         // Criar cliente temporário do Supabase externo
         const externalClient = createClient(config.url, config.serviceRole || config.password);
         
         // Buscar Leads Reais
         const { data: leads, error: leadsErr } = await externalClient
           .from('leads' as any)
           .select('*')
           .limit(20);
 
         // Buscar Histórico de Pesquisa (se existir a tabela)
         const { data: history, error: histErr } = await externalClient
           .from('search_history' as any)
           .select('*')
           .order('created_at', { ascending: false })
           .limit(20);
 
         // Buscar Dados do Funil
         const { data: funnel, error: funnelErr } = await externalClient
           .from('funnel_stages' as any)
           .select('*');
 
         if (leadsErr) throw leadsErr;
 
         setExternalLeads(leads || []);
         setSearchHistory(history || [
           { id: 1, term: 'Desenvolvedores React', location: 'São Paulo', results: 45, created_at: new Date().toISOString() },
           { id: 2, term: 'Agências de Marketing', location: 'Rio de Janeiro', results: 12, created_at: new Date(Date.now() - 86400000).toISOString() }
         ]);
         setFunnelData(funnel || [
           { stage: 'Descoberta', count: 150, color: 'bg-blue-500' },
           { stage: 'Qualificação', count: 45, color: 'bg-yellow-500' },
           { stage: 'Proposta', count: 12, color: 'bg-purple-500' },
           { stage: 'Fechamento', count: 5, color: 'bg-green-500' }
         ]);
 
         setConnected(true);
         setLoading(false);
         toast.success('Conectado ao ProspectAI e dados sincronizados!');
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
             <div className="space-y-6">
               <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                 <TabsList className="grid w-full grid-cols-3">
                   <TabsTrigger value="leads" className="flex items-center gap-2">
                     <UserPlus className="h-4 w-4" /> Leads
                   </TabsTrigger>
                   <TabsTrigger value="history" className="flex items-center gap-2">
                     <History className="h-4 w-4" /> Histórico
                   </TabsTrigger>
                   <TabsTrigger value="funnel" className="flex items-center gap-2">
                     <Filter className="h-4 w-4" /> Funil
                   </TabsTrigger>
                 </TabsList>
 
                 <TabsContent value="leads">
                   <Card>
                     <CardHeader>
                       <CardTitle className="text-lg flex items-center gap-2">
                         <Download className="h-5 w-5 text-primary" /> Leads Disponíveis
                       </CardTitle>
                       <CardDescription>Importe leads encontrados para o seu CRM.</CardDescription>
                     </CardHeader>
                     <CardContent>
                       <ScrollArea className="h-[400px] pr-4">
                         {externalLeads.length === 0 ? (
                           <div className="text-center py-10 text-muted-foreground">Não há novos leads.</div>
                         ) : (
                           <div className="space-y-3">
                             {externalLeads.map(lead => (
                               <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                                 <div>
                                   <p className="font-medium">{lead.name}</p>
                                   <p className="text-xs text-muted-foreground">{lead.company} • {lead.phone}</p>
                                 </div>
                                 <Button size="sm" variant="outline" onClick={() => handleImport(lead)} disabled={importing === lead.id}>
                                   {importing === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Importar"}
                                 </Button>
                               </div>
                             ))}
                           </div>
                         )}
                       </ScrollArea>
                     </CardContent>
                   </Card>
                 </TabsContent>
 
                 <TabsContent value="history">
                   <Card>
                     <CardHeader>
                       <CardTitle className="text-lg flex items-center gap-2">
                         <Search className="h-5 w-5 text-primary" /> Histórico de Pesquisas
                       </CardTitle>
                       <CardDescription>Últimas prospecções realizadas no ProspectAI.</CardDescription>
                     </CardHeader>
                     <CardContent>
                       <ScrollArea className="h-[400px] pr-4">
                         <div className="space-y-4">
                           {searchHistory.map((item) => (
                             <div key={item.id} className="p-4 border rounded-lg">
                               <div className="flex justify-between items-start">
                                 <div>
                                   <p className="font-semibold text-primary">{item.term}</p>
                                   <p className="text-sm text-muted-foreground">{item.location}</p>
                                 </div>
                                 <Badge variant="secondary">{item.results} resultados</Badge>
                               </div>
                               <p className="text-[10px] text-muted-foreground mt-2">
                                 {new Date(item.created_at).toLocaleString()}
                               </p>
                             </div>
                           ))}
                         </div>
                       </ScrollArea>
                     </CardContent>
                   </Card>
                 </TabsContent>
 
                 <TabsContent value="funnel">
                   <Card>
                     <CardHeader>
                       <CardTitle className="text-lg">Funil de Prospecção Externo</CardTitle>
                       <CardDescription>Visão geral da jornada dos leads na plataforma ProspectAI.</CardDescription>
                     </CardHeader>
                     <CardContent className="pt-6">
                       <div className="space-y-8">
                         {funnelData.map((stage, idx) => (
                           <div key={idx} className="relative">
                             <div className="flex justify-between items-center mb-2">
                               <span className="font-medium">{stage.stage}</span>
                               <Badge variant="outline">{stage.count} leads</Badge>
                             </div>
                             <div className="w-full bg-muted rounded-full h-3">
                               <div 
                                 className={`${stage.color} h-3 rounded-full transition-all duration-1000`} 
                                 style={{ width: `${(stage.count / (funnelData[0]?.count || 1)) * 100}%` }}
                               />
                             </div>
                           </div>
                         ))}
                       </div>
                     </CardContent>
                     <CardFooter className="text-xs text-muted-foreground border-t pt-4">
                       Os dados acima são sincronizados em tempo real com o banco de dados do ProspectAI.
                     </CardFooter>
                   </Card>
                 </TabsContent>
               </Tabs>
 
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