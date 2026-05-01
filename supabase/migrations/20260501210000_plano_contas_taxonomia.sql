-- Create the taxonomia table
CREATE TABLE IF NOT EXISTS public.plano_contas_taxonomia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    categoria VARCHAR NOT NULL, -- 'TIPO', 'GRUPO', 'NATUREZA'
    descricao VARCHAR NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, categoria, descricao)
);

-- RLS
ALTER TABLE public.plano_contas_taxonomia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_taxonomia_select" ON public.plano_contas_taxonomia;
CREATE POLICY "tenant_isolation_taxonomia_select" ON public.plano_contas_taxonomia
  FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id());

DROP POLICY IF EXISTS "tenant_isolation_taxonomia_insert" ON public.plano_contas_taxonomia;
CREATE POLICY "tenant_isolation_taxonomia_insert" ON public.plano_contas_taxonomia
  FOR INSERT TO authenticated
  WITH CHECK (org_id = public.get_user_org_id());

DROP POLICY IF EXISTS "tenant_isolation_taxonomia_update" ON public.plano_contas_taxonomia;
CREATE POLICY "tenant_isolation_taxonomia_update" ON public.plano_contas_taxonomia
  FOR UPDATE TO authenticated
  USING (org_id = public.get_user_org_id())
  WITH CHECK (org_id = public.get_user_org_id());

DROP POLICY IF EXISTS "tenant_isolation_taxonomia_delete" ON public.plano_contas_taxonomia;
CREATE POLICY "tenant_isolation_taxonomia_delete" ON public.plano_contas_taxonomia
  FOR DELETE TO authenticated
  USING (org_id = public.get_user_org_id());

-- Seed existing organizations with basic taxonomy
DO $$
DECLARE
  org RECORD;
BEGIN
  FOR org IN SELECT id FROM public.organizations LOOP
    INSERT INTO public.plano_contas_taxonomia (org_id, categoria, descricao)
    VALUES 
      (org.id, 'TIPO', 'Ativo'),
      (org.id, 'TIPO', 'Passivo'),
      (org.id, 'TIPO', 'Patrimônio Líquido'),
      (org.id, 'TIPO', 'Receita'),
      (org.id, 'TIPO', 'Despesa'),
      (org.id, 'GRUPO', 'Circulante'),
      (org.id, 'GRUPO', 'Não Circulante'),
      (org.id, 'GRUPO', 'Operacional'),
      (org.id, 'GRUPO', 'Não Operacional'),
      (org.id, 'NATUREZA', 'Devedora'),
      (org.id, 'NATUREZA', 'Credora')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Create trigger to seed new organizations
CREATE OR REPLACE FUNCTION public.seed_plano_contas_taxonomia()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.plano_contas_taxonomia (org_id, categoria, descricao)
  VALUES 
    (NEW.id, 'TIPO', 'Ativo'),
    (NEW.id, 'TIPO', 'Passivo'),
    (NEW.id, 'TIPO', 'Patrimônio Líquido'),
    (NEW.id, 'TIPO', 'Receita'),
    (NEW.id, 'TIPO', 'Despesa'),
    (NEW.id, 'GRUPO', 'Circulante'),
    (NEW.id, 'GRUPO', 'Não Circulante'),
    (NEW.id, 'GRUPO', 'Operacional'),
    (NEW.id, 'GRUPO', 'Não Operacional'),
    (NEW.id, 'NATUREZA', 'Devedora'),
    (NEW.id, 'NATUREZA', 'Credora')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_seed_taxonomia ON public.organizations;
CREATE TRIGGER trg_seed_taxonomia
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_plano_contas_taxonomia();

