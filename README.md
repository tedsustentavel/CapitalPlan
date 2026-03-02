# Capital Plan — Plano de Caixa

Sistema web do Plano de Caixa (React + TypeScript + Vite + Tailwind + ShadcnUI + Supabase).

## Senha de acesso

- Senha padrão: **CapitalPlan2026**
- Digite a senha na tela inicial para acessar o app. Sem a senha correta não há acesso.

## Configuração

1. **Variáveis de ambiente**

   Copie o exemplo e preencha com seu projeto Supabase:

   ```bash
   cp .env.example .env
   ```

   Em `.env`:

   - `VITE_SUPABASE_URL`: URL do projeto Supabase
   - `VITE_SUPABASE_ANON_KEY`: chave anon do Supabase
   - `VITE_APP_PASSWORD`: (opcional) senha do app; se não definir, usa "CapitalPlan2026"

2. **Tabela e dados no Supabase**

   Aplique as migrations na ordem (via CLI: `supabase db push` ou pelo SQL Editor):

   - **001_create_capital_plan.sql** — cria a tabela `capital_plan` (colunas: `id`, `saldo_inicial`, `financial_data`, `actions`)
   - **002_capital_plan_explicit_columns.sql** — só se você já tiver a tabela antiga com coluna `payload`
   - **003_seed_capital_plan.sql** — insere os dados iniciais (saldo, previsões jan–dez, ações vazias)
   - **004_enable_rls_capital_plan.sql** — políticas RLS para o cliente (anon) poder ler, inserir e atualizar; sem isso as ações não persistem no banco

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Estrutura

- **LockScreen**: tela de senha (CapitalPlan2026).
- **Resumo Anual**: visão geral e cards por mês.
- **Financeiro**: edição de receita/gastos por mês.
- **Por mês**: abas Jan–Dez com semanas e ações do plano.

Dados persistem em uma única tabela `capital_plan` (colunas: `saldo_inicial`, `financial_data`, `actions`). Os dados iniciais vêm da migration de seed (003).
