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
  const [isPending, startTransition] = React.useTransition()

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

      // Dispara a atualização real para o pai (Supabase API, etc) usando startTransition
      // Isso empurra re-renders pesados pro final da fila, eliminando o erro de Forced reflow (500ms+)
      startTransition(() => {
        onChange(selectedValue)
      })
    },
    [onChange],
  )

  // Memoize command items to prevent unnecessary re-renders of the entire list on each keystroke
  const commandItems = React.useMemo(() => {
    return options.map((option) => (
      <CommandItem
        key={option.value}
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
    ))
  }, [options, localValue, handleSelect])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isPending}
          className={cn('w-full justify-between font-normal', className)}
          onClick={(e) => {
            e.preventDefault()
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
            <CommandGroup>{commandItems}</CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
