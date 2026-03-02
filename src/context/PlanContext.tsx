import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Action, CapitalPlanPayload, MonthId } from '@/types'
import { buildFinancialWithResultado } from '@/constants'
import { ensureCapitalPlan, getDefaultPayload, updatePayload } from '@/lib/supabase'

export type FinancialData = Record<
  MonthId,
  { receita: number; gastos: number; resultado: number }
>

interface PlanContextValue {
  saldoInicial: number
  financialData: FinancialData
  actions: Action[]
  setFinancialData: (raw: Record<MonthId, { receita: number; gastos: number }>) => void
  saveFinancial: (raw: Record<MonthId, { receita: number; gastos: number }>) => Promise<void>
  saveSaldoInicial: (value: number) => Promise<void>
  setActions: (actions: Action[] | ((prev: Action[]) => Action[])) => void
  saveActions: (next: Action[]) => Promise<void>
  loadPlan: () => Promise<void>
  isLoading: boolean
  loadError: string | null
  saveError: string | null
  clearSaveError: () => void
}

const PlanContext = createContext<PlanContextValue | null>(null)

export function PlanProvider({ children }: { children: ReactNode }) {
  const [payload, setPayloadState] = useState<CapitalPlanPayload | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const financialData = useMemo(() => {
    if (!payload) return {} as FinancialData
    return buildFinancialWithResultado(payload.financialData)
  }, [payload?.financialData])

  const loadPlan = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const row = await ensureCapitalPlan()
      setPayloadState(row.payload)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Erro ao carregar')
      setPayloadState(getDefaultPayload())
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveFinancial = useCallback(
    async (raw: Record<MonthId, { receita: number; gastos: number }>) => {
      if (!payload) return
      setSaveError(null)
      try {
        const next: CapitalPlanPayload = {
          ...payload,
          financialData: raw,
        }
        await updatePayload(next)
        setPayloadState(next)
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : 'Erro ao salvar previsões')
        throw e
      }
    },
    [payload]
  )

  const setFinancialData = useCallback(
    (raw: Record<MonthId, { receita: number; gastos: number }>) => {
      if (!payload) return
      setPayloadState({
        ...payload,
        financialData: raw,
      })
    },
    [payload]
  )

  const saveActions = useCallback(
    async (next: Action[]) => {
      if (!payload) return
      setSaveError(null)
      try {
        const newPayload: CapitalPlanPayload = { ...payload, actions: next }
        await updatePayload(newPayload)
        setPayloadState(newPayload)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erro ao salvar ações'
        setSaveError(msg)
        throw e
      }
    },
    [payload]
  )

  const clearSaveError = useCallback(() => setSaveError(null), [])

  const saveSaldoInicial = useCallback(
    async (value: number) => {
      if (!payload) return
      setSaveError(null)
      try {
        const next: CapitalPlanPayload = { ...payload, saldoInicial: value }
        await updatePayload(next)
        setPayloadState(next)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erro ao salvar saldo'
        setSaveError(msg)
        throw e
      }
    },
    [payload]
  )

  const setActions = useCallback(
    (updater: Action[] | ((prev: Action[]) => Action[])) => {
      if (!payload) return
      const next = typeof updater === 'function' ? updater(payload.actions) : updater
      setPayloadState({ ...payload, actions: next })
    },
    [payload]
  )

  const value = useMemo<PlanContextValue>(
    () => ({
      saldoInicial: payload?.saldoInicial ?? 0,
      financialData,
      actions: payload?.actions ?? [],
      setFinancialData,
      saveFinancial,
      saveSaldoInicial,
      setActions,
      saveActions,
      loadPlan,
      isLoading,
      loadError,
      saveError,
      clearSaveError,
    }),
    [
      payload,
      financialData,
      setFinancialData,
      saveFinancial,
      saveSaldoInicial,
      setActions,
      saveActions,
      loadPlan,
      isLoading,
      loadError,
      saveError,
      clearSaveError,
    ]
  )

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext)
  if (!ctx) throw new Error('usePlan must be used within PlanProvider')
  return ctx
}
