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
  descricao: string
  responsavel: string
  valor: string
  sinal: '+' | '-'
  prazo: string
  status: string
  resultado: string
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
