import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { parseOFX, parseExtratoCSV, LancamentoExtraido } from '@/lib/extrato-parser'
import { conciliacaoService } from '@/services/conciliacao'
import { toast } from '@/hooks/use-toast'

interface ConciliacaoUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  clientId: string
  onSuccess: () => void
}

export function ConciliacaoUploadModal({
  open,
  onOpenChange,
  orgId,
  clientId,
  onSuccess,
}: ConciliacaoUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [tipoArquivo, setTipoArquivo] = useState<'OFX' | 'CSV' | 'SISPAG'>('OFX')
  const [previewLancamentos, setPreviewLancamentos] = useState<LancamentoExtraido[]>([])
  const [parsing, setParsing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    setFile(selected)
    setErrorMsg('')
    setParsing(true)

    try {
      const nameLower = selected.name.toLowerCase()
      let detectedTipo: 'OFX' | 'CSV' | 'SISPAG' = tipoArquivo

      if (nameLower.endsWith('.ofx')) {
        detectedTipo = 'OFX'
      } else if (nameLower.includes('sispag')) {
        detectedTipo = 'SISPAG'
      } else if (nameLower.endsWith('.csv') || nameLower.endsWith('.txt')) {
        detectedTipo = tipoArquivo === 'SISPAG' ? 'SISPAG' : 'CSV'
      }
      setTipoArquivo(detectedTipo)

      const text = await selected.text()
      let extraidos: LancamentoExtraido[] = []

      if (detectedTipo === 'OFX' || nameLower.endsWith('.ofx')) {
        extraidos = parseOFX(text)
      } else {
        extraidos = parseExtratoCSV(text)
      }

      if (extraidos.length === 0) {
        throw new Error(
          'Nenhum lançamento detectado. Verifique o formato do arquivo (OFX ou CSV delimitado).',
        )
      }

      setPreviewLancamentos(extraidos)
    } catch (err: any) {
      console.error('Erro ao ler extrato:', err)
      setErrorMsg(err.message || 'Falha ao processar arquivo de extrato')
      setPreviewLancamentos([])
    } finally {
      setParsing(false)
    }
  }

  const handleProcessar = async () => {
    if (!previewLancamentos.length) return
    setUploading(true)

    try {
      const res = await conciliacaoService.importarLancamentos(
        orgId,
        clientId,
        previewLancamentos,
        tipoArquivo,
      )

      toast({
        title: 'Extrato Importado com Sucesso',
        description: `${res.inseridos} lançamentos novos importados e submetidos ao motor em 3 camadas (${res.ignoradosDuplicados} já existentes ignorados).`,
      })

      setFile(null)
      setPreviewLancamentos([])
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      toast({
        title: 'Erro na importação',
        description: err.message || 'Falha ao salvar lançamentos.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-primary" />
            Importar Extrato Bancário (OFX / CSV / Sispag)
          </DialogTitle>
          <DialogDescription>
            Importe seu extrato de conta corrente, poupança, cartão ou arquivo Sispag. O motor de 3
            camadas classificará automaticamente os lançamentos pelo plano padrão.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Formato / Origem do Arquivo</Label>
              <Select value={tipoArquivo} onValueChange={(val: any) => setTipoArquivo(val)}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OFX">Extrato OFX (Banco / Internet Banking)</SelectItem>
                  <SelectItem value="CSV">Extrato CSV / Planilha Tabular</SelectItem>
                  <SelectItem value="SISPAG">
                    Arquivo de Retorno Sispag (Itaú / Bradesco)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Selecione o Arquivo</Label>
              <Input
                type="file"
                accept=".ofx,.csv,.txt"
                onChange={handleFileChange}
                disabled={parsing || uploading}
                className="bg-background/50 cursor-pointer"
              />
            </div>
          </div>

          {parsing && (
            <div className="flex items-center justify-center p-6 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              Lendo estrutura do arquivo de extrato...
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {previewLancamentos.length > 0 && !parsing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  {previewLancamentos.length} lançamentos identificados
                </span>
                <span className="text-muted-foreground">
                  Total:{' '}
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(previewLancamentos.reduce((acc, l) => acc + l.valor, 0))}
                </span>
              </div>

              <div className="border border-white/10 rounded-lg overflow-hidden max-h-56 overflow-y-auto text-xs">
                <table className="w-full">
                  <thead className="bg-white/5 text-muted-foreground sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Data</th>
                      <th className="p-2 text-left">Descrição Original</th>
                      <th className="p-2 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {previewLancamentos.slice(0, 10).map((l, idx) => (
                      <tr key={idx} className="hover:bg-white/5">
                        <td className="p-2 whitespace-nowrap text-muted-foreground">{l.data}</td>
                        <td className="p-2 font-medium truncate max-w-[280px]">
                          {l.descricao_original}
                        </td>
                        <td
                          className={`p-2 text-right font-semibold whitespace-nowrap ${
                            l.valor < 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(l.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewLancamentos.length > 10 && (
                <p className="text-[11px] text-muted-foreground text-center">
                  + {previewLancamentos.length - 10} outros lançamentos que serão processados
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancelar
          </Button>
          <Button
            onClick={handleProcessar}
            disabled={previewLancamentos.length === 0 || uploading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando 3 Camadas...
              </>
            ) : (
              'Confirmar e Classificar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
