export type MonthId =
  | 'jan'
  | 'fev'
  | 'mar'
  | 'abr'
  | 'mai'
  | 'jun'
  | 'jul'
  | 'ago'
  | 'set'
  | 'out'
  | 'nov'
  | 'dez'

export interface FinancialMonth {
  receita: number
  gastos: number
  resultado?: number
}

export interface Action {
  id: string
  mes: MonthId
  semana: number
  setor?: string
  descricao: string
  responsavel: string
  valor: string
  sinal: '+' | '-'
  prazo: string
  status: string
  resultado: string
  /**
   * Indica se a ação/previsto já está contemplada no PEP.
   * Persistido dentro do JSONB `capital_plan.actions`.
   */
  pep_previsto?: boolean
}

export interface CapitalPlanPayload {
  saldoInicial: number
  financialData: Record<MonthId, { receita: number; gastos: number }>
  actions: Action[]
}

export interface CapitalPlanRow {
  id: string
  payload: CapitalPlanPayload
}
