import { useState, useCallback, useEffect } from 'react'
import { PlanProvider, usePlan } from '@/context/PlanContext'
import { LockScreen } from '@/components/LockScreen'
import { SummaryScreen } from '@/components/SummaryScreen'
import { FinanceiroScreen } from '@/components/FinanceiroScreen'
import { MonthScreen } from '@/components/MonthScreen'
import { MONTHS, fmtR } from '@/constants'
import type { MonthId } from '@/types'

const UNLOCK_KEY = 'capital_plan_unlocked'

function MainApp() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(UNLOCK_KEY) === '1')
  const { loadPlan, isLoading, loadError, financialData, actions, saldoInicial } = usePlan()
  const [activeTab, setActiveTab] = useState<string>('resumo')

  const handleUnlock = useCallback(() => {
    sessionStorage.setItem(UNLOCK_KEY, '1')
    setUnlocked(true)
  }, [])

  useEffect(() => {
    if (unlocked) loadPlan()
  }, [unlocked, loadPlan])

  if (!unlocked) {
    return <LockScreen onUnlock={handleUnlock} />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060B16] text-[#4FC3F7] font-serif">
        Carregando...
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060B16] p-4">
        <div className="text-center">
          <p className="text-[#EF9A9A] mb-4">{loadError}</p>
          <button
            type="button"
            onClick={() => loadPlan()}
            className="px-4 py-2 rounded-lg bg-[#4FC3F7] text-[#060B16] font-semibold"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  const TABS = [
    { id: 'resumo', label: 'Resumo Anual' },
    { id: 'financeiro', label: 'Financeiro' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#060B16] font-serif text-[#E0E4F0]">
      {/* Header */}
      <header className="shrink-0 bg-[#0A1020] border-b border-[#16213A] px-6 py-3.5 flex items-center justify-between">
        <div>
          <div className="text-[9px] tracking-widest text-[#4FC3F7] uppercase mb-0.5">
            T&D Sustentável
          </div>
          <h1 className="text-[17px] font-bold text-white">Plano de Caixa 2026</h1>
        </div>
        <div className="text-[10px] text-[#4A5A7A]">
          Saldo atual:{' '}
          <span className="text-[#FFB74D] font-bold">{fmtR(saldoInicial)}</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="shrink-0 bg-[#08101E] border-b border-[#16213A] px-6 overflow-x-auto flex">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`py-2.5 px-4 border-b-2 shrink-0 bg-transparent cursor-pointer text-sm font-bold font-serif ${
              activeTab === t.id
                ? 'border-[#4FC3F7] text-[#4FC3F7]'
                : 'border-transparent text-[#4A5A7A]'
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="w-px bg-[#16213A] my-2 mx-2.5 shrink-0" aria-hidden />
        {MONTHS.map((m) => {
          const fin = financialData[m.id]
          const hasActions = actions.some((a) => a.mes === m.id)
          const isActive = activeTab === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveTab(m.id)}
              className={`py-2.5 px-3.5 border-b-2 relative shrink-0 bg-transparent cursor-pointer font-serif ${
                isActive ? 'border-[#4FC3F7]' : 'border-transparent'
              }`}
            >
              <span
                className={`text-[11px] ${isActive ? 'font-bold text-[#4FC3F7]' : (fin?.resultado ?? 0) < -100000 ? 'text-[#EF9A9A]/53' : 'text-[#4A5A7A]'}`}
              >
                {m.short}
              </span>
              {hasActions && (
                <span
                  className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full bg-[#4FC3F7]"
                  aria-hidden
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'resumo' && (
          <div className="flex-1 overflow-y-auto">
            <SummaryScreen onSelectMonth={(id) => setActiveTab(id)} />
          </div>
        )}
        {activeTab === 'financeiro' && (
          <div className="flex-1 overflow-y-auto">
            <FinanceiroScreen />
          </div>
        )}
        {MONTHS.some((m) => m.id === activeTab) && (
          <MonthScreen monthId={activeTab as MonthId} />
        )}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <PlanProvider>
      <MainApp />
    </PlanProvider>
  )
}
