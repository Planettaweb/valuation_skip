ALTER TABLE public.financial_balancete ADD COLUMN IF NOT EXISTS ordem INTEGER;
ALTER TABLE public.financial_balanco_patrimonial ADD COLUMN IF NOT EXISTS ordem INTEGER;
ALTER TABLE public.financial_dre ADD COLUMN IF NOT EXISTS ordem INTEGER;
ALTER TABLE public.financial_fluxo_caixa ADD COLUMN IF NOT EXISTS ordem INTEGER;
ALTER TABLE public.financial_data ADD COLUMN IF NOT EXISTS ordem INTEGER;
