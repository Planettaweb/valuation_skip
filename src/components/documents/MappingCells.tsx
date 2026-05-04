import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableCell } from '@/components/ui/table';

type PlanoConta = {
  id: number;
  codigo: string;
  nome_conta?: string;
  descricao?: string;
};

type Row = {
  mapped_plano_id?: number;
  mapped_codigo?: string;
  mapped_descricao?: string;
};

interface MappingCellsProps {
  row: Row;
  i: number;
  clientPlanoContas: PlanoConta[];
  handleUpdateRow: (index: number, field: string, value: any) => void;
  mappingMode: string;
}

const MappingCells = ({
  row,
  i,
  clientPlanoContas,
  handleUpdateRow,
  mappingMode,
}: MappingCellsProps) => {
  const [open, setOpen] = useState(false);

  const displayValue = row.mapped_codigo
    ? `${row.mapped_codigo} - ${row.mapped_descricao || ''}`
    : '';

  return (
    <>
      {mappingMode === 'similarity' && (
        <TableCell>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Input
                value={displayValue}
                readOnly
                placeholder="Selecione um plano de contas"
                className="w-[200px]"
              />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Selecionar Plano de Contas</DialogTitle>
                <DialogDescription>
                  Escolha o plano de contas correspondente.
                </DialogDescription>
              </DialogHeader>
              <Command>
                <CommandInput placeholder="Busque plano de contas..." />
                <CommandList>
                  <CommandEmpty>Nenhum plano encontrado.</CommandEmpty>
                  <CommandGroup>
                    {clientPlanoContas.map((pc) => (
                      <CommandItem
                        key={pc.id}
                        onSelect={() => {
                          handleUpdateRow(i, 'mapped_plano_id', pc.id);
                          handleUpdateRow(i, 'mapped_codigo', pc.codigo);
                          handleUpdateRow(i, 'mapped_descricao', pc.nome_conta || pc.descricao);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'ml-auto h-4 w-4',
                            row.mapped_plano_id === pc.id
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        {pc.codigo} - {pc.nome_conta || pc.descricao}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </DialogContent>
          </Dialog>
        </TableCell>
      )}
    </>
  );
};

export default MappingCells;