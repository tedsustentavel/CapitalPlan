-- Habilita RLS e permite que o cliente (anon) leia e atualize a tabela.
-- Sem essas políticas, as requisições do app com VITE_SUPABASE_ANON_KEY falham ao inserir/atualizar.

ALTER TABLE capital_plan ENABLE ROW LEVEL SECURITY;

-- Leitura: qualquer um com a chave anon pode ler o plano (uma linha só).
CREATE POLICY "capital_plan_select"
  ON capital_plan FOR SELECT
  TO anon
  USING (true);

-- Inserção: permitir criar a linha default (ex.: seed ou primeiro acesso).
CREATE POLICY "capital_plan_insert"
  ON capital_plan FOR INSERT
  TO anon
  WITH CHECK (true);

-- Atualização: permitir atualizar qualquer linha (só existe id = 'default').
CREATE POLICY "capital_plan_update"
  ON capital_plan FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
