import * as React from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

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
  title?: string
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
  title,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [localValue, setLocalValue] = React.useState(value)
  const [search, setSearch] = React.useState('')
  const [deferredSearch, setDeferredSearch] = React.useState('')
  const [isPending, startTransition] = React.useTransition()

  // Sync local state with parent value to keep it updated if modified externally
  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Reset search when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSearch('')
      setDeferredSearch('')
    }
  }, [open])

  // Debounce search input to prevent filtering lag on every keystroke
  React.useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setDeferredSearch(search)
      })
    }, 150)
    return () => clearTimeout(timer)
  }, [search])

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === localValue),
    [options, localValue],
  )

  const handleSelect = React.useCallback(
    (selectedValue: string) => {
      // Immediate local sync
      setLocalValue(selectedValue)
      setOpen(false)
      setSearch('')
      setDeferredSearch('')

      // Deferred remote sync to eliminate Forced Reflow
      startTransition(() => {
        onChange(selectedValue)
      })
    },
    [onChange],
  )

  const filteredOptions = React.useMemo(() => {
    if (!deferredSearch) {
      // Rendering thousands of DOM nodes causes Forced reflow. Limit to 100 visible nodes.
      return options.slice(0, 100)
    }
    const lower = deferredSearch.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(lower)).slice(0, 100)
  }, [options, deferredSearch])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isPending}
          className={cn('w-full justify-between font-normal bg-background', className)}
        >
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-0 overflow-hidden flex flex-col gap-0 max-h-[85vh] sm:max-h-[600px] outline-none">
        <DialogHeader className="px-4 py-3 border-b text-left">
          <DialogTitle className="text-base font-semibold">{title || placeholder}</DialogTitle>
        </DialogHeader>

        <div className="p-2 border-b flex items-center relative bg-muted/10">
          <Search className="absolute left-4 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent shadow-none h-10"
            autoFocus
          />
        </div>

        <ScrollArea className="flex-1 overflow-y-auto min-h-[300px] h-[400px]">
          <div className="p-2 flex flex-col gap-1">
            {filteredOptions.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center">
                <p>{emptyText}</p>
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'relative flex w-full cursor-default select-none items-center rounded-sm px-3 py-2.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors',
                    localValue === option.value && 'bg-accent font-medium text-accent-foreground',
                  )}
                >
                  <span className="truncate flex-1 text-left">{option.label}</span>
                  <Check
                    className={cn(
                      'ml-2 h-4 w-4 text-primary shrink-0',
                      localValue === option.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </button>
              ))
            )}

            {options.length > 100 && filteredOptions.length === 100 && (
              <div className="py-3 text-center text-xs text-muted-foreground bg-muted/30 rounded-md mt-2">
                Exibindo os primeiros 100 resultados. Use a busca para filtrar mais opções.
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
