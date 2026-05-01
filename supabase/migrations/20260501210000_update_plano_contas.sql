DO $$
BEGIN
  -- Drop NOT NULL constraint from client_id to allow tenant-wide chart of accounts
  ALTER TABLE public.plano_contas ALTER COLUMN client_id DROP NOT NULL;
  
  -- Drop NOT NULL constraint from descricao
  ALTER TABLE public.plano_contas ALTER COLUMN descricao DROP NOT NULL;
END $$;
