import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MONTHS, fmtR, parseNum } from '@/constants'
import { getDefaultPayload } from '@/lib/supabase'
import { usePlan } from '@/context/PlanContext'
import type { MonthId } from '@/types'

const inputClass =
  'w-full bg-[#0D1527] border border-[#1E2D48] rounded-lg px-3 py-2 text-sm outline-none font-serif box-border pl-7'

export function FinanceiroScreen() {
  const { financialData, saveFinancial, saveError, clearSaveError } = usePlan()
  const defaultRaw = useMemo(() => getDefaultPayload().financialData, [])

  const [draft, setDraft] = useState<Record<MonthId, { receita: string; gastos: string }>>(() => {
    const d: Record<string, { receita: string; gastos: string }> = {}
    MONTHS.forEach((m) => {
      d[m.id] = {
        receita: String(financialData[m.id]?.receita ?? 0),
        gastos: String(financialData[m.id]?.gastos ?? 0),
      }
    })
    return d as Record<MonthId, { receita: string; gastos: string }>
  })
  const [saved, setSaved] = useState(false)

  const setField = (monthId: MonthId, field: 'receita' | 'gastos', val: string) => {
    setDraft((prev) => ({
      ...prev,
      [monthId]: { ...prev[monthId], [field]: val },
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    const raw: Record<MonthId, { receita: number; gastos: number }> = {} as Record<
      MonthId,
      { receita: number; gastos: number }
    >
    MONTHS.forEach((m) => {
      raw[m.id] = {
        receita: parseNum(draft[m.id].receita),
        gastos: parseNum(draft[m.id].gastos),
      }
    })
    try {
      await saveFinancial(raw)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      // saveError já é definido no context
    }
  }

  const totalReceita = MONTHS.reduce((s, m) => s + parseNum(draft[m.id].receita), 0)
  const totalGastos = MONTHS.reduce((s, m) => s + parseNum(draft[m.id].gastos), 0)
  const totalResultado = totalReceita - totalGastos

  const handleReset = () => {
    const d: Record<string, { receita: string; gastos: string }> = {}
    MONTHS.forEach((m) => {
      d[m.id] = {
        receita: String(defaultRaw[m.id].receita),
        gastos: String(defaultRaw[m.id].gastos),
      }
    })
    setDraft(d as Record<MonthId, { receita: string; gastos: string }>)
    setSaved(false)
  }

  return (
    <div className="max-w-[900px] mx-auto py-7 px-6">
      {saveError && (
        <div className="mb-4 p-3 rounded-lg bg-[#EF9A9A]/10 border border-[#EF9A9A]/50 text-[#EF9A9A] text-sm flex items-center justify-between gap-3">
          <span>{saveError}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSaveError}
            className="border-[#EF9A9A]/50 text-[#EF9A9A] shrink-0"
          >
            Fechar
          </Button>
        </div>
      )}
      <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
        <div>
          <div className="text-[9px] text-[#4A5A7A] uppercase tracking-widest">
            Previsões · Editável pelo Financeiro
          </div>
          <h2 className="text-lg font-bold text-white">Inputs Financeiros 2026</h2>
          <p className="text-[11px] text-[#4A5A7A] mt-1">
            Atualize receita e gastos previstos. O resultado é calculado automaticamente.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="border-[#1E2D48] text-[#4A5A7A] bg-transparent text-[11px] font-serif"
          >
            ↺ Restaurar base
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className={
              saved
                ? 'bg-[#00D4A1] text-[#060B16] font-bold text-sm font-serif'
                : 'bg-[#4FC3F7] text-[#060B16] font-bold text-sm font-serif'
            }
          >
            {saved ? '✓ Salvo!' : 'Salvar previsões'}
          </Button>
        </div>
      </div>

      <div className="bg-[#0D1527] rounded-xl border border-[#16213A] overflow-hidden">
        <div className="grid grid-cols-[110px_1fr_1fr_120px] gap-0 border-b border-[#16213A] px-5 py-2.5 bg-[#08101E]">
          {['Mês', 'Receita prevista', 'Gastos previstos', 'Resultado'].map((h, i) => (
            <div
              key={h}
              className={`text-[9px] text-[#4A5A7A] uppercase tracking-wider ${i >= 2 ? 'text-right pr-3' : ''}`}
            >
              {h}
            </div>
          ))}
        </div>

        {MONTHS.map((m, idx) => {
          const receita = parseNum(draft[m.id].receita)
          const gastos = parseNum(draft[m.id].gastos)
          const resultado = receita - gastos
          const isNeg = resultado < 0
          const isLast = idx === MONTHS.length - 1
          return (
            <div
              key={m.id}
              className={`grid grid-cols-[110px_1fr_1fr_120px] gap-0 px-5 py-2.5 items-center border-b ${isLast ? 'border-b-0' : 'border-[#111827]'} ${idx % 2 === 1 ? 'bg-white/[0.01]' : ''}`}
            >
              <div>
                <div className="text-sm font-bold text-[#E0E4F0]">{m.label}</div>
                <div className="text-[9px] text-[#4A5A7A]">2026</div>
              </div>
              <div className="pr-3 relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#4A5A7A] pointer-events-none">
                  R$
                </span>
                <Input
                  type="number"
                  value={draft[m.id].receita}
                  onChange={(e) => setField(m.id, 'receita', e.target.value)}
                  className={`${inputClass} text-[#00D4A1]`}
                />
              </div>
              <div className="pr-3 relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#4A5A7A] pointer-events-none">
                  R$
                </span>
                <Input
                  type="number"
                  value={draft[m.id].gastos}
                  onChange={(e) => setField(m.id, 'gastos', e.target.value)}
                  className={`${inputClass} text-[#EF9A9A]`}
                />
              </div>
              <div className="text-right">
                <div
                  className={`text-sm font-bold ${isNeg ? 'text-[#EF9A9A]' : 'text-[#00D4A1]'}`}
                >
                  {fmtR(resultado)}
                </div>
                <div
                  className={`text-[9px] mt-0.5 ${isNeg ? 'text-[#EF9A9A]/53' : 'text-[#00D4A1]/53'}`}
                >
                  {isNeg ? 'déficit' : 'superávit'}
                </div>
              </div>
            </div>
          )
        })}

        <div className="grid grid-cols-[110px_1fr_1fr_120px] gap-0 px-5 py-3.5 bg-[#08101E] border-t-2 border-[#16213A]">
          <div className="text-[11px] font-bold text-[#8A9BBE]">TOTAL ANUAL</div>
          <div className="pr-3">
            <div className="text-[13px] font-bold text-[#00D4A1]">{fmtR(totalReceita)}</div>
          </div>
          <div className="pr-3">
            <div className="text-[13px] font-bold text-[#EF9A9A]">{fmtR(totalGastos)}</div>
          </div>
          <div className="text-right">
            <div
              className={`text-[15px] font-bold ${totalResultado >= 0 ? 'text-[#00D4A1]' : 'text-[#EF9A9A]'}`}
            >
              {fmtR(totalResultado)}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3.5 text-[10px] text-[#2A3A5C] text-center">
        Os valores salvos aqui alimentam automaticamente o resumo anual e todas as telas de mês.
      </p>
    </div>
  )
}
