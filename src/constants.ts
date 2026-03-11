import type { MonthId } from '@/types'

export const MONTHS: { id: MonthId; label: string; short: string; semanas: string[] }[] = [
  { id: 'jan', label: 'Janeiro', short: 'Jan', semanas: ['01–07 Jan', '08–14 Jan', '15–21 Jan', '22–31 Jan'] },
  { id: 'fev', label: 'Fevereiro', short: 'Fev', semanas: ['01–07 Fev', '08–14 Fev', '15–21 Fev', '22–28 Fev'] },
  { id: 'mar', label: 'Março', short: 'Mar', semanas: ['01–07 Mar', '08–14 Mar', '15–21 Mar', '22–31 Mar'] },
  { id: 'abr', label: 'Abril', short: 'Abr', semanas: ['01–07 Abr', '08–14 Abr', '15–21 Abr', '22–30 Abr'] },
  { id: 'mai', label: 'Maio', short: 'Mai', semanas: ['01–07 Mai', '08–14 Mai', '15–21 Mai', '22–31 Mai'] },
  { id: 'jun', label: 'Junho', short: 'Jun', semanas: ['01–07 Jun', '08–14 Jun', '15–21 Jun', '22–30 Jun'] },
  { id: 'jul', label: 'Julho', short: 'Jul', semanas: ['01–07 Jul', '08–14 Jul', '15–21 Jul', '22–31 Jul'] },
  { id: 'ago', label: 'Agosto', short: 'Ago', semanas: ['01–07 Ago', '08–14 Ago', '15–21 Ago', '22–31 Ago'] },
  { id: 'set', label: 'Setembro', short: 'Set', semanas: ['01–07 Set', '08–14 Set', '15–21 Set', '22–30 Set'] },
  { id: 'out', label: 'Outubro', short: 'Out', semanas: ['01–07 Out', '08–14 Out', '15–21 Out', '22–31 Out'] },
  { id: 'nov', label: 'Novembro', short: 'Nov', semanas: ['01–07 Nov', '08–14 Nov', '15–21 Nov', '22–30 Nov'] },
  { id: 'dez', label: 'Dezembro', short: 'Dez', semanas: ['01–07 Dez', '08–14 Dez', '15–21 Dez', '22–31 Dez'] },
]

export const SECTORS = [
  'Comercial',
  'Operações',
  'Financeiro',
  'RH',
  'TI',
  'Marketing',
  'Executivo',
  'Jurídico',
  'Outro',
] as const

export const STATUS_OPTIONS = ['Planejado', 'Em andamento', 'Realizado', 'Cancelado'] as const

export const STATUS_STYLE: Record<string, { color: string; bg: string; dot: string }> = {
  Planejado: { color: '#8A9BBE', bg: '#1A2540', dot: '#4A5A7A' },
  'Em andamento': { color: '#FFB74D', bg: '#251A08', dot: '#FFB74D' },
  Realizado: { color: '#00D4A1', bg: '#081A10', dot: '#00D4A1' },
  Cancelado: { color: '#3A4A6A', bg: '#111827', dot: '#2A3A5C' },
}

export const EMPTY_FORM: {
  descricao: string
  responsavel: string
  valor: string
  sinal: '+' | '-'
  prazo: string
  status: string
  resultado: string
  setor: string
  mes: MonthId
  semana: number
} = {
  descricao: '',
  responsavel: '',
  valor: '',
  sinal: '+',
  prazo: '',
  status: 'Planejado',
  resultado: '',
  setor: '',
  mes: 'jan',
  semana: 1,
}

export function fmtR(v: number): string {
  const n = Number(v)
  if (isNaN(n)) return '—'
  return `${n < 0 ? '-' : ''}R$ ${Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function fmtD(v: number): string | null {
  const n = Number(v)
  if (isNaN(n) || n === 0) return null
  return `${n > 0 ? '+' : '-'} R$ ${Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function fmtK(v: number): string {
  const n = Number(v)
  if (isNaN(n)) return '—'
  const s = n < 0 ? '-' : ''
  const a = Math.abs(n)
  if (a >= 1_000_000) return `${s}R$ ${(a / 1_000_000).toFixed(1)}M`
  if (a >= 1000) return `${s}R$ ${(a / 1000).toFixed(0)}k`
  return `${s}R$ ${a.toFixed(0)}`
}

export function parseValor(v: string | number, s: string): number {
  const n = Number(String(v).replace(/[^\d.]/g, '')) || 0
  return s === '-' ? -n : n
}

export function parseNum(v: string | number): number {
  return Number(String(v).replace(/[^\d.-]/g, '')) || 0
}

export function buildFinancialWithResultado(
  raw: Record<MonthId, { receita: number; gastos: number }>
): Record<MonthId, { receita: number; gastos: number; resultado: number }> {
  const out: Record<string, { receita: number; gastos: number; resultado: number }> = {}
  for (const [k, v] of Object.entries(raw)) {
    out[k] = { ...v, resultado: v.receita - v.gastos }
  }
  return out as Record<MonthId, { receita: number; gastos: number; resultado: number }>
}
