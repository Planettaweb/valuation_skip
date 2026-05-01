DO $DO$
BEGIN

  -- 1. Análise e Readequação do Plano de Contas
  ALTER TABLE public.plano_contas
    ADD COLUMN IF NOT EXISTS nome_conta TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS tipo TEXT,
    ADD COLUMN IF NOT EXISTS grupo TEXT,
    ADD COLUMN IF NOT EXISTS natureza TEXT,
    ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

  -- Atualiza 'nome_conta' com 'descricao' para registros antigos que estejam vazios
  UPDATE public.plano_contas SET nome_conta = descricao WHERE nome_conta = '';

  -- Adiciona restrição de código único por tenant (org_id) de forma segura
  IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'plano_contas_org_id_codigo_key'
  ) THEN
      IF NOT EXISTS (
          SELECT org_id, codigo FROM public.plano_contas 
          WHERE codigo IS NOT NULL 
          GROUP BY org_id, codigo HAVING count(*) > 1
      ) THEN
          ALTER TABLE public.plano_contas ADD CONSTRAINT plano_contas_org_id_codigo_key UNIQUE (org_id, codigo);
      END IF;
  END IF;

  -- Índices para plano_contas
  CREATE INDEX IF NOT EXISTS idx_plano_contas_org_id ON public.plano_contas(org_id);
  CREATE INDEX IF NOT EXISTS idx_plano_contas_codigo ON public.plano_contas(codigo);
  CREATE INDEX IF NOT EXISTS idx_plano_contas_tipo ON public.plano_contas(tipo);

  -- 2. Criação da Tabela "tipos_documentos"
  CREATE TABLE IF NOT EXISTS public.tipos_documentos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      descricao TEXT NOT NULL,
      slug TEXT NOT NULL,
      ativo BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT tipos_documentos_org_id_slug_key UNIQUE(org_id, slug)
  );

  CREATE INDEX IF NOT EXISTS idx_tipos_documentos_org_id ON public.tipos_documentos(org_id);
  CREATE INDEX IF NOT EXISTS idx_tipos_documentos_slug ON public.tipos_documentos(slug);

  ALTER TABLE public.tipos_documentos ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "tenant_isolation_tipos_documentos" ON public.tipos_documentos;
  CREATE POLICY "tenant_isolation_tipos_documentos" ON public.tipos_documentos
      FOR ALL TO authenticated USING (org_id = get_user_org_id()) WITH CHECK (org_id = get_user_org_id());

  DROP POLICY IF EXISTS "admin_all_access_tipos_documentos" ON public.tipos_documentos;
  CREATE POLICY "admin_all_access_tipos_documentos" ON public.tipos_documentos
      FOR ALL TO authenticated USING (get_user_role_name() = 'Admin'::text) WITH CHECK (get_user_role_name() = 'Admin'::text);

  -- 3. Criação da Tabela "documento_conta_mapping"
  CREATE TABLE IF NOT EXISTS public.documento_conta_mapping (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      id_documento UUID NOT NULL REFERENCES public.tipos_documentos(id) ON DELETE CASCADE,
      id_conta UUID NOT NULL REFERENCES public.plano_contas(id) ON DELETE CASCADE,
      ordem INTEGER,
      created_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT doc_conta_mapping_unique UNIQUE(org_id, id_documento, id_conta)
  );

  CREATE INDEX IF NOT EXISTS idx_doc_conta_mapping_org_id ON public.documento_conta_mapping(org_id);
  CREATE INDEX IF NOT EXISTS idx_doc_conta_mapping_id_documento ON public.documento_conta_mapping(id_documento);
  CREATE INDEX IF NOT EXISTS idx_doc_conta_mapping_id_conta ON public.documento_conta_mapping(id_conta);

  ALTER TABLE public.documento_conta_mapping ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "tenant_isolation_documento_conta_mapping" ON public.documento_conta_mapping;
  CREATE POLICY "tenant_isolation_documento_conta_mapping" ON public.documento_conta_mapping
      FOR ALL TO authenticated USING (org_id = get_user_org_id()) WITH CHECK (org_id = get_user_org_id());

  DROP POLICY IF EXISTS "admin_all_access_documento_conta_mapping" ON public.documento_conta_mapping;
  CREATE POLICY "admin_all_access_documento_conta_mapping" ON public.documento_conta_mapping
      FOR ALL TO authenticated USING (get_user_role_name() = 'Admin'::text) WITH CHECK (get_user_role_name() = 'Admin'::text);

  -- 4. Readequação das Tabelas Existentes (Adicionando referência ao plano de contas)
  ALTER TABLE public.financial_balancete ADD COLUMN IF NOT EXISTS conta_id UUID REFERENCES public.plano_contas(id) ON DELETE SET NULL;
  ALTER TABLE public.financial_balanco_patrimonial ADD COLUMN IF NOT EXISTS conta_id UUID REFERENCES public.plano_contas(id) ON DELETE SET NULL;
  ALTER TABLE public.financial_dre ADD COLUMN IF NOT EXISTS conta_id UUID REFERENCES public.plano_contas(id) ON DELETE SET NULL;
  ALTER TABLE public.financial_fluxo_caixa ADD COLUMN IF NOT EXISTS conta_id UUID REFERENCES public.plano_contas(id) ON DELETE SET NULL;
  ALTER TABLE public.financial_data ADD COLUMN IF NOT EXISTS conta_id UUID REFERENCES public.plano_contas(id) ON DELETE SET NULL;

  CREATE INDEX IF NOT EXISTS idx_fin_balancete_conta_id ON public.financial_balancete(conta_id);
  CREATE INDEX IF NOT EXISTS idx_fin_balanco_conta_id ON public.financial_balanco_patrimonial(conta_id);
  CREATE INDEX IF NOT EXISTS idx_fin_dre_conta_id ON public.financial_dre(conta_id);
  CREATE INDEX IF NOT EXISTS idx_fin_fluxo_caixa_conta_id ON public.financial_fluxo_caixa(conta_id);
  CREATE INDEX IF NOT EXISTS idx_fin_data_conta_id ON public.financial_data(conta_id);

END $DO$;
