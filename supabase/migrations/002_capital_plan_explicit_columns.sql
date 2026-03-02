-- Migração para quem já criou a tabela com coluna payload (001 antiga).
-- Adiciona colunas explícitas, preenche a partir de payload (se existir), remove payload.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'capital_plan' AND column_name = 'payload'
  ) THEN
    ALTER TABLE capital_plan ADD COLUMN IF NOT EXISTS saldo_inicial NUMERIC NOT NULL DEFAULT 541974.50;
    ALTER TABLE capital_plan ADD COLUMN IF NOT EXISTS financial_data JSONB NOT NULL DEFAULT '{}'::jsonb;
    ALTER TABLE capital_plan ADD COLUMN IF NOT EXISTS actions JSONB NOT NULL DEFAULT '[]'::jsonb;

    UPDATE capital_plan
    SET
      saldo_inicial = COALESCE((payload->>'saldoInicial')::numeric, 541974.50),
      financial_data = COALESCE(payload->'financialData', '{}'::jsonb),
      actions = COALESCE(payload->'actions', '[]'::jsonb)
    WHERE id = 'default' AND payload IS NOT NULL;

    ALTER TABLE capital_plan DROP COLUMN payload;
  END IF;
END $$;
