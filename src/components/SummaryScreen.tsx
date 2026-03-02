import { MONTHS, fmtK, fmtD, parseValor } from '@/constants'
import { usePlan } from '@/context/PlanContext'
import type { MonthId } from '@/types'

interface SummaryScreenProps {
  onSelectMonth: (id: MonthId) => void
}

export function SummaryScreen({ onSelectMonth }: SummaryScreenProps) {
  const { financialData, actions, saldoInicial } = usePlan()

  const totalBaseAnual = Object.values(financialData).reduce((s, m) => s + (m?.resultado ?? 0), 0)
  const totalPlanoAnual = actions.reduce((s, a) => s + parseValor(a.valor, a.sinal), 0)
  const totalRealAnual = actions
    .filter((a) => a.status === 'Realizado')
    .reduce((s, a) => s + parseValor(a.valor, a.sinal), 0)
  const resultadoAnual = totalBaseAnual + totalPlanoAnual

  let runwayAcum = saldoInicial
  const runways = MONTHS.map((m) => {
    const plano = actions
      .filter((a) => a.mes === m.id)
      .reduce((s, a) => s + parseValor(a.valor, a.sinal), 0)
    runwayAcum += (financialData[m.id]?.resultado ?? 0) + plano
    return runwayAcum
  })

  const cards = [
    {
      label: 'Resultado base 2026',
      value: fmtK(totalBaseAnual),
      sub: 'sem ações',
      color: 'text-[#EF9A9A]',
    },
    {
      label: 'Plano total mapeado',
      value: fmtK(totalPlanoAnual),
      sub: `${actions.length} ações`,
      color: 'text-[#FFB74D]',
    },
    {
      label: 'Já realizado',
      value: fmtK(totalRealAnual),
      sub: `${actions.filter((a) => a.status === 'Realizado').length} ações`,
      color: 'text-[#00D4A1]',
    },
    {
      label: 'Resultado projetado',
      value: fmtK(resultadoAnual),
      sub: 'base + plano',
      bold: true,
      color:
        resultadoAnual >= 0
          ? 'text-[#00D4A1]'
          : resultadoAnual > -200000
            ? 'text-[#FFB74D]'
            : 'text-[#EF9A9A]',
    },
  ]

  const firstNeg = MONTHS.findIndex((_, i) => runways[i] < 0)

  return (
    <div className="max-w-[1100px] mx-auto py-7 px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-7">
        {cards.map((k, i) => (
          <div
            key={i}
            className={`bg-[#0D1527] rounded-xl p-5 border ${k.bold ? 'border-[#4FC3F733]' : 'border-[#16213A]'}`}
          >
            <div className="text-[9px] text-[#4A5A7A] uppercase tracking-wider mb-2">
              {k.label}
            </div>
            <div
              className={`${k.bold ? 'text-[22px]' : 'text-lg'} font-bold ${k.color} mb-1`}
            >
              {k.value}
            </div>
            <div className="text-[10px] text-[#4A5A7A]">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="text-[9px] text-[#4A5A7A] uppercase tracking-widest mb-3.5">
        Visão mensal · clique para abrir
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {MONTHS.map((m, idx) => {
          const fin = financialData[m.id]
          const mActions = actions.filter((a) => a.mes === m.id)
          const mPlano = mActions.reduce((s, a) => s + parseValor(a.valor, a.sinal), 0)
          const runway = runways[idx]
          const runwayNeg = runway < 0
          const runwayCrit = runway >= 0 && runway < 100000
          const realizadas = mActions.filter((a) => a.status === 'Realizado').length
          const pct = mActions.length > 0 ? Math.round((realizadas / mActions.length) * 100) : 0
          return (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectMonth(m.id)}
              onKeyDown={(e) => e.key === 'Enter' && onSelectMonth(m.id)}
              className={`bg-[#0D1527] rounded-xl p-4 cursor-pointer border transition-colors hover:border-[#4FC3F766] ${
                runwayNeg
                  ? 'border-[#EF9A9A33]'
                  : runwayCrit
                    ? 'border-[#FFB74D33]'
                    : 'border-[#16213A]'
              }`}
            >
              <div className="flex justify-between items-start mb-2.5">
                <div>
                  <div className="text-[9px] text-[#4A5A7A] mb-0.5">2026</div>
                  <div
                    className={`text-[15px] font-bold ${
                      runwayNeg ? 'text-[#EF9A9A]' : runwayCrit ? 'text-[#FFB74D]' : 'text-[#E0E4F0]'
                    }`}
                  >
                    {m.label}
                  </div>
                </div>
                {mActions.length > 0 && (
                  <div className="text-right">
                    <div className="text-[9px] text-[#4A5A7A]">
                      {realizadas}/{mActions.length}
                    </div>
                    <div
                      className={`text-[9px] ${pct === 100 ? 'text-[#00D4A1]' : 'text-[#4A5A7A]'}`}
                    >
                      {pct}%
                    </div>
                  </div>
                )}
              </div>
              <div className="mb-1.5">
                <div className="text-[9px] text-[#4A5A7A] mb-0.5">Resultado base</div>
                <div
                  className={`text-[13px] font-bold ${(fin?.resultado ?? 0) < 0 ? 'text-[#EF9A9A]' : 'text-[#00D4A1]'}`}
                >
                  {fmtK(fin?.resultado ?? 0)}
                </div>
              </div>
              {mPlano !== 0 && (
                <>
                  <div className="mb-1.5">
                    <div className="text-[9px] text-[#4A5A7A] mb-0.5">Plano</div>
                    <div
                      className={`text-xs ${mPlano > 0 ? 'text-[#00D4A1]' : 'text-[#EF9A9A]'}`}
                    >
                      {fmtD(mPlano) ?? '—'}
                    </div>
                  </div>
                  <div className="h-px bg-[#16213A] my-2" />
                </>
              )}
              <div>
                <div className="text-[9px] text-[#4A5A7A] mb-0.5">Runway após mês</div>
                <div
                  className={`text-xs font-bold ${
                    runwayNeg ? 'text-[#EF9A9A]' : runwayCrit ? 'text-[#FFB74D]' : 'text-[#8A9BBE]'
                  }`}
                >
                  {fmtK(runway)}
                </div>
              </div>
              {mActions.length > 0 && (
                <div className="mt-2.5">
                  <div className="bg-[#111827] rounded-sm h-1 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#00D4A1] to-[#4FC3F7] rounded-sm transition-[width]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {firstNeg >= 0 && (
        <div className="mt-5 p-4 bg-[#EF9A9A]/10 border border-[#EF9A9A33] rounded-xl flex gap-3 items-center">
          <span className="text-lg" aria-hidden>
            ⚠️
          </span>
          <div>
            <div className="text-sm font-bold text-[#EF9A9A] mb-1">
              Runway negativo projetado a partir de {MONTHS[firstNeg].label}
            </div>
            <div className="text-[11px] text-[#4A5A7A]">
              O plano precisa gerar {fmtK(Math.abs(totalBaseAnual))} para cobrir o déficit anual.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
