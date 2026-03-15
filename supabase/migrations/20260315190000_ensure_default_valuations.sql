-- Ensures every existing client has at least one default valuation to satisfy the simplified DB hierarchy
DO $$
DECLARE
  v_client record;
BEGIN
  FOR v_client IN SELECT * FROM public.clients LOOP
    IF NOT EXISTS (SELECT 1 FROM public.valuations WHERE client_id = v_client.id) THEN
      INSERT INTO public.valuations (org_id, client_id, valuation_type, valuation_name, status)
      VALUES (v_client.org_id, v_client.id, 'Valuation', 'Projeto Padrão', 'Em Andamento');
    END IF;
  END LOOP;
END $$;
