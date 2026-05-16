 import { useState } from 'react';
 import { useContacts } from '@/hooks/useStore';
 import { supabase } from '@/integrations/supabase/client';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Download, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
 import { useToast } from '@/hooks/use-toast';
 import { useAuth } from '@/contexts/AuthContext';
 import { AppLayout } from '@/components/AppLayout';
 
 export default function ProspectAiPage() {
   const { data: contacts, isLoading, refetch } = useContacts();
   const [syncing, setSyncing] = useState(false);
   const { toast } = useToast();
   const { user } = useAuth();
 
   const prospectLeads = contacts?.filter(c => c.external_source === 'prospectai') || [];
 
  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      // Buscar leads da tabela prospectai_leads (abordagem direta via Lovable cloud)
      const { data: externalLeads, error: fetchError } = await supabase
        .from('prospectai_leads' as any)
        .select('*');

      if (fetchError) throw fetchError;

      if (!externalLeads || externalLeads.length === 0) {
        toast({
          title: "Sincronização concluída",
          description: "Nenhum novo lead encontrado no ProspectAi.",
        });
        return;
      }

      // Mapear leads para a tabela local de contatos
      const mappedLeads = externalLeads.map((lead: any) => ({
        user_id: user.id,
        external_id: lead.id,
        external_source: 'prospectai',
        name: lead.name,
        phone: lead.phone || '',
        email: lead.email || '',
        segmento: lead.segment || '',
        notes: lead.company_name ? `Empresa: ${lead.company_name}` : '',
        origin: 'ProspectAi',
        is_lead: true,
        status: 'novo',
        stage: 'novo_lead'
      }));

      // Upsert na tabela local
      const { data, error: upsertError } = await supabase
        .from('contacts')
        .upsert(mappedLeads, { 
          onConflict: 'user_id,external_source,external_id',
          ignoreDuplicates: false 
        })
        .select('id');

      if (upsertError) throw upsertError;

      toast({
        title: "Sincronização concluída",
        description: `${data?.length || 0} leads sincronizados com sucesso do ProspectAi.`,
      });
      refetch();
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: "Erro na sincronização",
        description: error.message || "Não foi possível sincronizar os leads do ProspectAi.",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };
 
   return (
     <AppLayout>
       <div className="space-y-8">
         <div className="flex justify-between items-center">
         <div>
           <h1 className="text-3xl font-bold tracking-tight">ProspectAi</h1>
           <p className="text-muted-foreground">Gerencie os leads importados da ferramenta externa.</p>
         </div>
         <Button onClick={handleSync} disabled={syncing}>
           {syncing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
           Sincronizar Agora
         </Button>
       </div>
 
       <Card>
         <CardHeader>
           <CardTitle>Leads Importados</CardTitle>
           <CardDescription>
             Total de {prospectLeads.length} leads encontrados.
           </CardDescription>
         </CardHeader>
         <CardContent>
           {isLoading ? (
             <div className="flex justify-center py-8 text-muted-foreground italic">Carregando leads...</div>
           ) : prospectLeads.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
               <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
               <h3 className="text-lg font-medium">Nenhum lead encontrado</h3>
               <p className="text-sm text-muted-foreground max-w-sm mb-6">
                 Clique no botão de sincronização para buscar seus leads do ProspectAi.
               </p>
             </div>
           ) : (
             <div className="rounded-md border">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Nome</TableHead>
                     <TableHead>Segmento</TableHead>
                     <TableHead>Telefone</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead className="text-right">Importado em</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {prospectLeads.map((lead) => (
                     <TableRow key={lead.id}>
                       <TableCell className="font-medium">{lead.name}</TableCell>
                       <TableCell>{lead.segmento || '-'}</TableCell>
                       <TableCell>{lead.phone || '-'}</TableCell>
                       <TableCell>
                         <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                           <CheckCircle2 className="mr-1 h-3 w-3" />
                           Sincronizado
                         </span>
                       </TableCell>
                       <TableCell className="text-right text-muted-foreground">
                         {new Date(lead.created_at).toLocaleDateString()}
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </div>
           )}
         </CardContent>
         </Card>
       </div>
     </AppLayout>
   );
 }