-- Tabela única do projeto com colunas explícitas por tipo de informação.
-- id = 'default' (um único registro).
-- Não há coluna de senha: a verificação é feita no cliente contra a senha padrão.

CREATE TABLE IF NOT EXISTS capital_plan (
  id TEXT PRIMARY KEY DEFAULT 'default',
  saldo_inicial NUMERIC NOT NULL DEFAULT 541974.50,
  financial_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb
);

COMMENT ON TABLE capital_plan IS 'Plano de Caixa: uma linha por projeto (id=default)';
COMMENT ON COLUMN capital_plan.saldo_inicial IS 'Saldo inicial em reais';
COMMENT ON COLUMN capital_plan.financial_data IS 'Receita e gastos por mês (jan..dez): { "jan": { "receita", "gastos" }, ... }';
COMMENT ON COLUMN capital_plan.actions IS 'Array de ações do plano (id, mes, semana, descricao, valor, etc.)';
