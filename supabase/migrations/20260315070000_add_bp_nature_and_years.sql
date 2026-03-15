ALTER TABLE public.financial_balanco_patrimonial
ADD COLUMN IF NOT EXISTS nature_year_n text,
ADD COLUMN IF NOT EXISTS nature_year_n_minus_1 text,
ADD COLUMN IF NOT EXISTS year_n integer,
ADD COLUMN IF NOT EXISTS year_n_minus_1 integer;
