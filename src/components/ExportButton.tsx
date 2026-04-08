import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useContacts, useTransactions, useTasks } from '@/hooks/useStore';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

function toCSV(headers: string[], rows: string[][]) {
  const escape = (s: string) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  return [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
}

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButton() {
  const { data: contacts = [] } = useContacts();
  const { data: transactions = [] } = useTransactions();
  const { data: tasks = [] } = useTasks();

  const exportContacts = () => {
    const headers = ['Nome', 'Telefone', 'Email', 'Origem', 'Status', 'Tag', 'Valor Potencial', 'Etapa', 'Interesse', 'Próximo Contato', 'Criado em'];
    const rows = contacts.map(c => [
      c.name, c.phone || '', c.email || '', c.origin || '', c.status, c.tag || '',
      String(c.potential_value || 0), c.stage || '', c.interest || '', c.next_contact_date || '', c.created_at,
    ]);
    downloadCSV('contatos.csv', toCSV(headers, rows));
    toast.success('Contatos exportados');
  };

  const exportTransactions = () => {
    const headers = ['Tipo', 'Valor', 'Categoria', 'Descrição', 'Data', 'Criado em'];
    const rows = transactions.map(t => [
      t.type === 'income' ? 'Entrada' : 'Saída', String(t.amount), t.category, t.description || '', t.date, t.created_at,
    ]);
    downloadCSV('transacoes.csv', toCSV(headers, rows));
    toast.success('Transações exportadas');
  };

  const exportTasks = () => {
    const headers = ['Título', 'Data', 'Concluída', 'Criado em'];
    const rows = tasks.map(t => [t.title, t.due_date || '', t.done ? 'Sim' : 'Não', t.created_at]);
    downloadCSV('tarefas.csv', toCSV(headers, rows));
    toast.success('Tarefas exportadas');
  };

  const exportAll = () => {
    exportContacts();
    exportTransactions();
    exportTasks();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Exportar</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportContacts}>Contatos (CSV)</DropdownMenuItem>
        <DropdownMenuItem onClick={exportTransactions}>Transações (CSV)</DropdownMenuItem>
        <DropdownMenuItem onClick={exportTasks}>Tarefas (CSV)</DropdownMenuItem>
        <DropdownMenuItem onClick={exportAll}>Exportar Tudo</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
