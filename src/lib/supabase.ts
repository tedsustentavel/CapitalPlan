import { createClient } from '@supabase/supabase-js'
import type { CapitalPlanPayload, CapitalPlanRow } from '@/types'
import type { MonthId } from '@/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

const DEFAULT_ID = 'default'

/** Linha retornada do Supabase (colunas explícitas) */
interface CapitalPlanDbRow {
  id: string
  saldo_inicial: number
  financial_data: Record<MonthId, { receita: number; gastos: number }>
  actions: CapitalPlanPayload['actions']
}

function dbRowToPayload(row: CapitalPlanDbRow): CapitalPlanRow {
  return {
    id: row.id,
    payload: {
      saldoInicial: Number(row.saldo_inicial),
      financialData: row.financial_data ?? {},
      actions: row.actions ?? [],
    },
  }
}

/**
 * Payload inicial (fallback quando não existe linha no Supabase).
 * A fonte oficial dos dados iniciais é a migration 003_seed_capital_plan.sql.
 */
export function getDefaultPayload(): CapitalPlanPayload {
  return {
    saldoInicial: 541974.5,
    financialData: {
      jan: { receita: 702366.32, gastos: 808226.07 },
      fev: { receita: 777089.35, gastos: 825475.29 },
      mar: { receita: 797250.49, gastos: 817875.14 },
      abr: { receita: 711538.88, gastos: 808648.51 },
      mai: { receita: 662814.82, gastos: 788766.37 },
      jun: { receita: 662843.81, gastos: 768921.72 },
      jul: { receita: 661430.75, gastos: 799598.32 },
      ago: { receita: 656625.31, gastos: 757795.35 },
      set: { receita: 670393.65, gastos: 756908.41 },
      out: { receita: 659455.72, gastos: 767506.1 },
      nov: { receita: 675156.48, gastos: 815229.71 },
      dez: { receita: 663507.4, gastos: 829490.34 },
    },
    actions: [],
  }
}

/** Busca o registro capital_plan (id = default). Se não existir, retorna null. */
export async function getCapitalPlan(): Promise<CapitalPlanRow | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('capital_plan')
    .select('id, saldo_inicial, financial_data, actions')
    .eq('id', DEFAULT_ID)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return dbRowToPayload(data as CapitalPlanDbRow)
}

/** Cria ou atualiza o registro com as colunas explícitas. */
export async function updatePayload(payload: CapitalPlanPayload): Promise<void> {
  if (!supabase) {
    throw new Error(
      'Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env'
    )
  }
  const { error } = await supabase.from('capital_plan').upsert(
    {
      id: DEFAULT_ID,
      saldo_inicial: payload.saldoInicial,
      financial_data: payload.financialData,
      actions: payload.actions,
    },
    { onConflict: 'id' }
  )
  if (error) throw error
}

/** Garante que existe um registro; se não existir, cria com valores iniciais. */
export async function ensureCapitalPlan(): Promise<CapitalPlanRow> {
  if (!supabase) {
    return { id: DEFAULT_ID, payload: getDefaultPayload() }
  }
  const row = await getCapitalPlan()
  if (row) return row
  const payload = getDefaultPayload()
  await updatePayload(payload)
  return { id: DEFAULT_ID, payload }
}
