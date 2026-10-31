-- Migration: 20261031220000_cleanup_orphan_tables.sql
-- Description: Remoção segura das tabelas órfãs solicitadas pelo usuário:
-- processamento_pdf, financial_data, document_rows, knowledge_bases (e sua dependente direta kb_documents)

DO $$
BEGIN
  -- 1. Drop dependências da tabela knowledge_bases primeiro (kb_documents tem FK para knowledge_bases)
  DROP TABLE IF EXISTS public.kb_documents CASCADE;

  -- 2. Drop knowledge_bases
  DROP TABLE IF EXISTS public.knowledge_bases CASCADE;

  -- 3. Drop processamento_pdf
  DROP TABLE IF EXISTS public.processamento_pdf CASCADE;

  -- 4. Drop document_rows
  DROP TABLE IF EXISTS public.document_rows CASCADE;

  -- 5. Drop financial_data
  DROP TABLE IF EXISTS public.financial_data CASCADE;

  -- 6. Garantir que as tabelas de conciliação e dicionário estejam devidamente preparadas
  -- Adiciona coluna client_id à tabela plano_contas_mapping caso não exista (permite regras específicas por cliente além de globais da org)
  ALTER TABLE public.plano_contas_mapping ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

  CREATE INDEX IF NOT EXISTS idx_pcm_client_id ON public.plano_contas_mapping(client_id);
END $$;
