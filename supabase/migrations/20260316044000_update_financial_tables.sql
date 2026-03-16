-- Add account_code to financial_balancete
ALTER TABLE public.financial_balancete ADD COLUMN IF NOT EXISTS account_code TEXT;

-- Add account_code to financial_balanco_patrimonial
ALTER TABLE public.financial_balanco_patrimonial ADD COLUMN IF NOT EXISTS account_code TEXT;

-- Add planned_value and realized_value to financial_fluxo_caixa
ALTER TABLE public.financial_fluxo_caixa ADD COLUMN IF NOT EXISTS planned_value NUMERIC;
ALTER TABLE public.financial_fluxo_caixa ADD COLUMN IF NOT EXISTS realized_value NUMERIC;
