import { useState, useCallback, useEffect, useMemo } from 'react'
import { Pencil } from 'lucide-react'
import { PlanProvider, usePlan } from '@/context/PlanContext'
import { LockScreen } from '@/components/LockScreen'
import { SummaryScreen } from '@/components/SummaryScreen'
import { FinanceiroScreen } from '@/components/FinanceiroScreen'
import { SectorScreen } from '@/components/SectorScreen'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { fmtR } from '@/constants'

const UNLOCK_KEY = 'capital_plan_unlocked'

function MainApp() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(UNLOCK_KEY) === '1')
  const { loadPlan, isLoading, loadError, actions, saldoInicial, saveSaldoInicial } = usePlan()
  const [activeTab, setActiveTab] = useState<string>('resumo')
  const [saldoPopoverOpen, setSaldoPopoverOpen] = useState(false)
  const [saldoEditValue, setSaldoEditValue] = useState('')

  const handleUnlock = useCallback(() => {
    sessionStorage.setItem(UNLOCK_KEY, '1')
    setUnlocked(true)
  }, [])

  useEffect(() => {
    if (unlocked) loadPlan()
  }, [unlocked, loadPlan])

  const sectorIds = useMemo(() => {
    const setores = new Set(
      actions.map((a) => a.setor).filter((s): s is string => !!s)
    )
    return Array.from(setores).sort()
  }, [actions])

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
    { id: 'backlog', label: 'Backlog' },
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
        <Popover
          open={saldoPopoverOpen}
          onOpenChange={(open) => {
            setSaldoPopoverOpen(open)
            if (open) setSaldoEditValue(String(saldoInicial))
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              className="text-[10px] text-[#4A5A7A] flex items-center gap-1.5 rounded-md px-2 py-1 -my-1 hover:bg-[#16213A] transition-colors outline-none focus:ring-2 focus:ring-[#4FC3F7]/50"
              aria-label="Alterar saldo atual"
            >
              Saldo atual:{' '}
              <span className="text-[#FFB74D] font-bold">{fmtR(saldoInicial)}</span>
              <Pencil className="w-3 h-3 text-[#4A5A7A]" aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-64 bg-[#0D1527] border-[#1E2D48]"
            align="end"
            sideOffset={8}
          >
            <div className="space-y-3">
              <label className="block text-[10px] text-[#4A5A7A] uppercase tracking-wider">
                Saldo atual (R$)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={saldoEditValue}
                onChange={(e) => setSaldoEditValue(e.target.value)}
                className="bg-[#060B16] border-[#1E2D48] text-[#E0E4F0]"
                aria-label="Valor do saldo em reais"
              />
              <Button
                type="button"
                size="sm"
                className="w-full bg-[#4FC3F7] text-[#060B16] hover:bg-[#4FC3F7]/90 font-bold text-sm"
                onClick={async () => {
                  const num = Number(saldoEditValue.replace(/,/g, '.').trim())
                  if (Number.isNaN(num) || num < 0) return
                  try {
                    await saveSaldoInicial(num)
                    setSaldoPopoverOpen(false)
                  } catch {
                    // saveError fica no context; popover pode permanecer aberto
                  }
                }}
              >
                Salvar
              </Button>
            </div>
          </PopoverContent>
        </Popover>
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
        {sectorIds.length > 0 && (
          <>
            <div className="w-px bg-[#16213A] my-2 mx-2.5 shrink-0" aria-hidden />
            {sectorIds.map((setorId) => {
              const count = actions.filter((a) => a.setor === setorId).length
              const isActive = activeTab === setorId
              return (
                <button
                  key={setorId}
                  type="button"
                  onClick={() => setActiveTab(setorId)}
                  className={`py-2.5 px-3.5 border-b-2 relative shrink-0 bg-transparent cursor-pointer font-serif ${
                    isActive ? 'border-[#4FC3F7]' : 'border-transparent'
                  }`}
                >
                  <span
                    className={`text-[11px] ${isActive ? 'font-bold text-[#4FC3F7]' : 'text-[#4A5A7A]'}`}
                  >
                    {setorId}
                  </span>
                  {count > 0 && (
                    <span
                      className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full bg-[#4FC3F7]"
                      aria-hidden
                    />
                  )}
                </button>
              )
            })}
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'resumo' && (
          <div className="flex-1 overflow-y-auto">
            <SummaryScreen onSelectSector={(id) => setActiveTab(id)} />
          </div>
        )}
        {activeTab === 'financeiro' && (
          <div className="flex-1 overflow-y-auto">
            <FinanceiroScreen />
          </div>
        )}
        {activeTab === 'backlog' && <SectorScreen setorId="backlog" />}
        {sectorIds.includes(activeTab) && (
          <SectorScreen setorId={activeTab} />
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
