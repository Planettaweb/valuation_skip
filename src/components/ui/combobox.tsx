import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Buscar...',
  emptyText = 'Nenhum resultado encontrado.',
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [localValue, setLocalValue] = React.useState(value)

  // Sync local state with parent value to keep it updated if modified externally
  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Memoize selected option to ensure accurate label rendering based on exact value match
  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === localValue),
    [options, localValue],
  )

  const handleSelect = React.useCallback(
    (selectedValue: string) => {
      // Sincronização direta e instantânea com o estado local (Binding Síncrono)
      setLocalValue(selectedValue)
      setOpen(false)

      // Dispara a atualização real para o pai (Supabase API, etc) em seguida.
      // O setTimeout previne conflitos de ciclo de vida (Forced reflow / Blocking Render)
      // ao permitir que a animação de fechamento do Popover inicie antes da chamada pesada.
      setTimeout(() => {
        onChange(selectedValue)
      }, 0)
    },
    [onChange],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button" // Essencial para não submeter forms acidentalmente e causar reload/logout
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', className)}
          onClick={(e) => {
            // Previne bubbling que poderia causar comportamentos inesperados
            e.stopPropagation()
          }}
        >
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start" onClick={(e) => e.stopPropagation()}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  // Injetamos label + value no valor do CommandItem para permitir busca por ambos
                  value={`${option.label} ${option.value}`}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 shrink-0',
                      localValue === option.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
