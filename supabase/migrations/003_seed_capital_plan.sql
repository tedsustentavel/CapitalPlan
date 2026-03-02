-- Seed: dados iniciais do Plano de Caixa (antes hardcoded no app).
-- Só insere se ainda não existir registro (id = 'default').
-- Assim a fonte da verdade passa a ser o Supabase e não há risco de perder os valores iniciais.

INSERT INTO capital_plan (id, saldo_inicial, financial_data, actions)
SELECT
  'default',
  541974.50,
  '{
    "jan": { "receita": 702366.32, "gastos": 808226.07 },
    "fev": { "receita": 777089.35, "gastos": 825475.29 },
    "mar": { "receita": 797250.49, "gastos": 817875.14 },
    "abr": { "receita": 711538.88, "gastos": 808648.51 },
    "mai": { "receita": 662814.82, "gastos": 788766.37 },
    "jun": { "receita": 662843.81, "gastos": 768921.72 },
    "jul": { "receita": 661430.75, "gastos": 799598.32 },
    "ago": { "receita": 656625.31, "gastos": 757795.35 },
    "set": { "receita": 670393.65, "gastos": 756908.41 },
    "out": { "receita": 659455.72, "gastos": 767506.10 },
    "nov": { "receita": 675156.48, "gastos": 815229.71 },
    "dez": { "receita": 663507.40, "gastos": 829490.34 }
  }'::jsonb,
  '[]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM capital_plan WHERE id = 'default');
