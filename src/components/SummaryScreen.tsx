import { useMemo } from 'react'
import { MONTHS, fmtK, fmtD, parseValor } from '@/constants'
import { usePlan } from '@/context/PlanContext'

interface SummaryScreenProps {
  onSelectSector: (id: string) => void
}

export function SummaryScreen({ onSelectSector }: SummaryScreenProps) {
  const { financialData, actions, saldoInicial } = usePlan()

  const totalBaseAnual = Object.values(financialData).reduce((s, m) => s + (m?.resultado ?? 0), 0)
  const totalPlanoAnual = actions.reduce((s, a) => s + parseValor(a.valor, a.sinal), 0)
  const totalRealAnual = actions
    .filter((a) => a.status === 'Realizado')
    .reduce((s, a) => s + parseValor(a.valor, a.sinal), 0)
  let runwayAcum = saldoInicial
  const runways = MONTHS.map((m) => {
    runwayAcum += financialData[m.id]?.resultado ?? 0
    return runwayAcum
  })

  const sectorItems = useMemo(() => {
    const backlogActions = actions.filter((a) => !a.setor || a.setor === '')
    const setores = new Set(
      actions.map((a) => a.setor).filter((s): s is string => !!s)
    )
    const list: { id: string; label: string; actions: typeof actions }[] = [
      { id: 'backlog', label: 'Backlog', actions: backlogActions },
    ]
    Array.from(setores)
      .sort()
      .forEach((setorId) => {
        list.push({
          id: setorId,
          label: setorId,
          actions: actions.filter((a) => a.setor === setorId),
        })
      })
    return list
  }, [actions])

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
      label: 'Resultado projetado (caixa)',
      value: fmtK(totalBaseAnual),
      sub: 'apenas base, sem estimativa das ações',
      bold: true,
      color:
        totalBaseAnual >= 0
          ? 'text-[#00D4A1]'
          : totalBaseAnual > -200000
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
        Por setor · clique para abrir
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {sectorItems.map((item) => {
          const sActions = item.actions
          const sPlano = sActions.reduce(
            (s, a) => s + parseValor(a.valor, a.sinal),
            0
          )
          const realizadas = sActions.filter(
            (a) => a.status === 'Realizado'
          ).length
          const pct =
            sActions.length > 0
              ? Math.round((realizadas / sActions.length) * 100)
              : 0
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectSector(item.id)}
              onKeyDown={(e) =>
                e.key === 'Enter' && onSelectSector(item.id)
              }
              className="bg-[#0D1527] rounded-xl p-4 cursor-pointer border border-[#16213A] transition-colors hover:border-[#4FC3F766]"
            >
              <div className="flex justify-between items-start mb-2.5">
                <div className="text-[15px] font-bold text-[#E0E4F0]">
                  {item.label}
                </div>
                {sActions.length > 0 && (
                  <div className="text-right">
                    <div className="text-[9px] text-[#4A5A7A]">
                      {realizadas}/{sActions.length}
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
                <div className="text-[9px] text-[#4A5A7A] mb-0.5">Plano (est.)</div>
                <div
                  className={`text-[13px] font-bold ${sPlano >= 0 ? 'text-[#00D4A1]' : 'text-[#EF9A9A]'}`}
                >
                  {fmtK(sPlano)}
                </div>
              </div>
              {sPlano !== 0 && (
                <div className="mb-1.5">
                  <div className="text-[9px] text-[#4A5A7A] mb-0.5">
                    Realizado
                  </div>
                  <div className="text-xs text-[#8A9BBE]">
                    {fmtD(
                      sActions
                        .filter((a) => a.status === 'Realizado')
                        .reduce(
                          (s, a) => s + parseValor(a.valor, a.sinal),
                          0
                        )
                    ) ?? '—'}
                  </div>
                </div>
              )}
              {sActions.length > 0 && (
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
