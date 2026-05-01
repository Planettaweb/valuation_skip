ALTER TABLE public.plano_contas DROP COLUMN IF EXISTS ativo_inativo;

-- Fix RLS for processamento_pdf
DROP POLICY IF EXISTS "authenticated_select_processamento_pdf" ON public.processamento_pdf;
CREATE POLICY "authenticated_select_processamento_pdf" ON public.processamento_pdf
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_processamento_pdf" ON public.processamento_pdf;
CREATE POLICY "authenticated_insert_processamento_pdf" ON public.processamento_pdf
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_processamento_pdf" ON public.processamento_pdf;
CREATE POLICY "authenticated_update_processamento_pdf" ON public.processamento_pdf
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_processamento_pdf" ON public.processamento_pdf;
CREATE POLICY "authenticated_delete_processamento_pdf" ON public.processamento_pdf
  FOR DELETE TO authenticated USING (true);
