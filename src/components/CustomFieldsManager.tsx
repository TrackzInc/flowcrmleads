import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomFields, useInsertCustomField, useDeleteCustomField } from '@/hooks/useStore';
import { Plus, Trash2, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'select', label: 'Seleção' },
];

export function CustomFieldsManager() {
  const { data: fields = [] } = useCustomFields();
  const insertField = useInsertCustomField();
  const deleteField = useDeleteCustomField();

  const [name, setName] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [options, setOptions] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) return;
    try {
      const opts = fieldType === 'select' ? options.split(',').map(o => o.trim()).filter(Boolean) : [];
      await insertField.mutateAsync({
        name: name.trim(),
        field_type: fieldType,
        options: opts.length > 0 ? opts : null,
      });
      setName('');
      setOptions('');
      toast.success('Campo criado');
    } catch { toast.error('Erro ao criar campo'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteField.mutateAsync(id);
      toast.success('Campo removido');
    } catch { toast.error('Erro ao remover'); }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings2 className="h-4 w-4" /> Campos Personalizados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Nome do campo" value={name} onChange={e => setName(e.target.value)} className="h-8 flex-1 min-w-[120px]" />
          <Select value={fieldType} onValueChange={setFieldType}>
            <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {fieldType === 'select' && (
            <Input placeholder="Opções (separar por vírgula)" value={options} onChange={e => setOptions(e.target.value)} className="h-8 flex-1 min-w-[160px]" />
          )}
          <Button size="sm" className="h-8" onClick={handleAdd} disabled={insertField.isPending}>
            <Plus className="h-3 w-3 mr-1" /> Adicionar
          </Button>
        </div>

        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum campo personalizado. Crie campos específicos para seu nicho.</p>
        ) : (
          <div className="space-y-2">
            {fields.map(f => (
              <div key={f.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{f.name}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {FIELD_TYPES.find(t => t.value === f.field_type)?.label || f.field_type}
                  </Badge>
                  {f.field_type === 'select' && Array.isArray(f.options) && (
                    <span className="text-xs text-muted-foreground">{(f.options as string[]).join(', ')}</span>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => handleDelete(f.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
