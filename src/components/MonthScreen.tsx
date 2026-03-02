import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MONTHS, EMPTY_FORM, fmtR, fmtD, parseValor, STATUS_STYLE } from '@/constants'
import { usePlan } from '@/context/PlanContext'
import { ActionForm, type ActionFormData } from '@/components/ActionForm'
import type { Action, MonthId } from '@/types'

interface MonthScreenProps {
  monthId: MonthId
}

export function MonthScreen({ monthId }: MonthScreenProps) {
  const { financialData, actions, setActions, saveActions, saveError, clearSaveError } = usePlan()
  const month = MONTHS.find((m) => m.id === monthId)!
  const fin = financialData[monthId]

  const [collapsedWeeks, setCollapsedWeeks] = useState<Record<number, boolean>>({})
  const [expandedActions, setExpandedActions] = useState<Record<string, boolean>>({})
  const [adding, setAdding] = useState<number | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [addForm, setAddForm] = useState(EMPTY_FORM)
  const [editForm, setEditForm] = useState<ActionFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const mutate = async (fn: (prev: Action[]) => Action[]) => {
    const next = fn(actions)
    setActions(next)
    setSaving(true)
    clearSaveError()
    try {
      await saveActions(next)
    } finally {
      setSaving(false)
    }
  }

  const addAction = async (semana: number) => {
    if (!addForm.descricao.trim()) return
    await mutate((prev) => [
      ...prev,
      {
        ...addForm,
        mes: monthId,
        semana,
        id: Date.now().toString(),
      } as Action,
    ])
    setAddForm(EMPTY_FORM)
    setAdding(null)
  }

  const startEdit = (a: Action) => {
    setEditId(a.id)
    setEditForm({ ...a })
    setExpandedActions((p) => ({ ...p, [a.id]: true }))
  }

  const saveEdit = async () => {
    await mutate((prev) =>
      prev.map((a) => (a.id === editId ? { ...editForm, id: editId } as Action : a))
    )
    setEditId(null)
  }

  const remove = async (id: string) => {
    await mutate((prev) => prev.filter((a) => a.id !== id))
    if (editId === id) setEditId(null)
  }

  const toggleWeek = (id: number) =>
    setCollapsedWeeks((p) => ({ ...p, [id]: !p[id] }))
  const toggleAction = (id: string) => {
    setExpandedActions((p) => ({ ...p, [id]: !p[id] }))
    if (editId === id) setEditId(null)
  }

  const getAnte = (sem: number) =>
    actions
      .filter((a) => a.mes === monthId && a.semana < sem)
      .reduce((s, a) => s + parseValor(a.valor, a.sinal), 0)
  const getSemActions = (sem: number) =>
    actions.filter((a) => a.mes === monthId && a.semana === sem)
  const totalPlan = actions
    .filter((a) => a.mes === monthId)
    .reduce((s, a) => s + parseValor(a.valor, a.sinal), 0)
  const totalReal = actions
    .filter((a) => a.mes === monthId && a.status === 'Realizado')
    .reduce((s, a) => s + parseValor(a.valor, a.sinal), 0)
  const resultadoFinal = (fin?.resultado ?? 0) + totalPlan

  if (!fin) return null

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <div className="w-[220px] shrink-0 bg-[#0A1020] border-r border-[#16213A] py-6 px-4 overflow-y-auto">
        <div className="text-[9px] text-[#4A5A7A] uppercase tracking-widest mb-1">2026</div>
        <h2 className="text-[22px] font-bold text-white mb-4">{month.label}</h2>
        {[
          { label: 'Receita prevista', value: fin.receita, color: '#00D4A1' },
          { label: 'Gastos previstos', value: fin.gastos, color: '#EF9A9A' },
          {
            label: 'Resultado base',
            value: fin.resultado,
            color: fin.resultado >= 0 ? '#00D4A1' : '#EF9A9A',
            bold: true,
          },
        ].map((k) => (
          <div
            key={k.label}
            className="mb-2 bg-[#111827] rounded-lg py-2.5 px-3 border-l-[3px]"
            style={{ borderLeftColor: `${k.color}44` }}
          >
            <div className="text-[9px] text-[#4A5A7A] uppercase tracking-wider mb-0.5">
              {k.label}
            </div>
            <div className="text-xs font-bold" style={{ color: k.color }}>
              {fmtR(Math.abs(k.value))}
            </div>
          </div>
        ))}
        <div className="h-px bg-[#16213A] my-3" />
        <div className="bg-[#4FC3F7]/10 border border-[#4FC3F733] rounded-lg p-3 mb-2">
          <div className="text-[9px] text-[#4A5A7A] uppercase tracking-wider mb-1">
            Plano deste mês
          </div>
          <div
            className={`text-[13px] font-bold ${totalPlan >= 0 ? 'text-[#00D4A1]' : 'text-[#EF9A9A]'}`}
          >
            {fmtD(totalPlan) ?? '—'}
          </div>
          <div className="text-[10px] text-[#4A5A7A] mt-0.5">
            Realizado: {fmtD(totalReal) ?? 'R$ 0'}
          </div>
        </div>
        <div
          className={`rounded-lg p-3 border ${resultadoFinal >= 0 ? 'bg-[#00D4A1]/10 border-[#00D4A133]' : 'bg-[#EF9A9A]/10 border-[#EF9A9A33]'}`}
        >
          <div className="text-[9px] text-[#4A5A7A] uppercase tracking-wider mb-1">
            Resultado projetado
          </div>
          <div
            className={`text-base font-bold ${
              resultadoFinal >= 0
                ? 'text-[#00D4A1]'
                : resultadoFinal > -30000
                  ? 'text-[#FFB74D]'
                  : 'text-[#EF9A9A]'
            }`}
          >
            {fmtR(resultadoFinal)}
          </div>
        </div>
      </div>

      {/* Semanas */}
      <div className="flex-1 overflow-y-auto py-6 px-5">
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
        {saving && (
          <div className="mb-2 text-xs text-[#4FC3F7]">Salvando...</div>
        )}
        <div className="max-w-[740px]">
          {([1, 2, 3, 4] as const).map((semNum, idx) => {
            const semActions = getSemActions(semNum)
            const resInicio = fin.resultado + getAnte(semNum)
            const impactoSem = semActions.reduce(
              (s, a) => s + parseValor(a.valor, a.sinal),
              0
            )
            const isNeg = resInicio < 0
            const isCollapsed = !!collapsedWeeks[semNum]
            const isAdding = adding === semNum
            const realizadas = semActions.filter((a) => a.status === 'Realizado').length

            return (
              <div key={semNum}>
                {idx > 0 && (
                  <div className="pl-9">
                    <div className="w-px h-4 bg-[#16213A]" />
                  </div>
                )}
                <div
                  className={`bg-[#0D1527] rounded-xl overflow-hidden border ${isNeg ? 'border-[#EF9A9A22]' : 'border-[#16213A]'}`}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleWeek(semNum)}
                    onKeyDown={(e) => e.key === 'Enter' && toggleWeek(semNum)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none border-b ${!isCollapsed && (semActions.length > 0 || isAdding) ? 'border-[#111827]' : 'border-transparent'} ${isNeg ? 'bg-[#EF9A9A]/5' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold border ${isNeg ? 'bg-[#EF9A9A]/10 border-[#EF9A9A44] text-[#EF9A9A]' : 'bg-[#4FC3F7]/10 border-[#4FC3F744] text-[#4FC3F7]'}`}
                    >
                      {semNum}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-[#E0E4F0]">
                          Semana {semNum}
                        </span>
                        <span className="text-[10px] text-[#4A5A7A]">
                          {month.semanas[semNum - 1]}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[11px] font-bold ${isNeg ? 'text-[#EF9A9A]' : 'text-[#00D4A1]'}`}
                        >
                          {fmtR(resInicio)}
                        </span>
                        {impactoSem !== 0 && (
                          <span className="text-[10px] text-[#4A5A7A]">
                            · plano:{' '}
                            <span
                              className={
                                impactoSem > 0 ? 'text-[#00D4A1]' : 'text-[#EF9A9A]'
                              }
                            >
                              {fmtD(impactoSem)}
                            </span>
                          </span>
                        )}
                        {semActions.length > 0 && (
                          <span className="text-[10px] text-[#4A5A7A]">
                            · {realizadas}/{semActions.length} realizadas
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAdding(isAdding ? null : semNum)
                          setAddForm(EMPTY_FORM)
                          setEditId(null)
                          if (isCollapsed) toggleWeek(semNum)
                        }}
                        className={
                          isAdding
                            ? 'border-[#4FC3F766] bg-[#4FC3F7]/10 text-[#4FC3F7] text-[11px] font-serif'
                            : 'border-[#1E2D48] bg-transparent text-[#4A5A7A] text-[11px] font-serif'
                        }
                      >
                        {isAdding ? 'Cancelar' : '+ Ação'}
                      </Button>
                      <span
                        className={`text-[13px] text-[#4A5A7A] transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                        aria-hidden
                      >
                        ▾
                      </span>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div>
                      {semActions.map((acao, ai) => {
                        const valor = parseValor(acao.valor, acao.sinal)
                        const isPos = valor >= 0
                        const sc = STATUS_STYLE[acao.status] ?? STATUS_STYLE.Planejado
                        const isCanceled = acao.status === 'Cancelado'
                        const isExpanded = !!expandedActions[acao.id]
                        const isEditing = editId === acao.id
                        const isLast = ai === semActions.length - 1
                        return (
                          <div
                            key={acao.id}
                            className={
                              !isLast || isAdding
                                ? 'border-b border-[#111827]'
                                : ''
                            }
                          >
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => !isEditing && toggleAction(acao.id)}
                              onKeyDown={(e) =>
                                e.key === 'Enter' &&
                                !isEditing &&
                                toggleAction(acao.id)
                              }
                              className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer ${isExpanded && !isEditing ? 'bg-[#4FC3F7]/5' : ''} ${isCanceled ? 'opacity-40' : ''}`}
                            >
                              <div
                                className="w-0.5 h-4 rounded shrink-0"
                                style={{
                                  background: isCanceled
                                    ? '#2A3A5C'
                                    : isPos
                                      ? '#00D4A1'
                                      : '#EF9A9A',
                                }}
                              />
                              <div
                                className={`flex-1 text-xs truncate ${isCanceled ? 'text-[#3A4A6A] line-through' : 'text-[#E0E4F0]'}`}
                              >
                                {acao.descricao || (
                                  <span className="text-[#4A5A7A]">
                                    sem descrição
                                  </span>
                                )}
                              </div>
                              {acao.prazo && (
                                <span className="text-[10px] text-[#4A5A7A] shrink-0">
                                  🗓 {acao.prazo}
                                </span>
                              )}
                              {acao.responsavel && (
                                <span className="text-[10px] text-[#4A5A7A] shrink-0">
                                  👤 {acao.responsavel}
                                </span>
                              )}
                              <span
                                className="text-[9px] px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap border"
                                style={{
                                  background: sc.bg,
                                  color: sc.color,
                                  borderColor: `${sc.dot}44`,
                                }}
                              >
                                <span className="mr-0.5 text-[7px]">●</span>
                                {acao.status}
                              </span>
                              <div
                                className={`text-xs font-bold shrink-0 min-w-[80px] text-right ${isCanceled ? 'text-[#3A4A6A]' : isPos ? 'text-[#00D4A1]' : 'text-[#EF9A9A]'}`}
                              >
                                {fmtD(valor) ?? '—'}
                              </div>
                              <span
                                className={`text-[10px] text-[#2A3A5C] transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                                aria-hidden
                              >
                                ▾
                              </span>
                            </div>
                            {isExpanded && !isEditing && (
                              <div className="py-2 px-4 pl-8 bg-[#4FC3F7]/5 border-t border-[#111827]">
                                {acao.resultado && (
                                  <div className="text-[11px] text-[#4A5A7A] mb-2">
                                    📋{' '}
                                    <span className="text-[#8A9BBE]">
                                      {acao.resultado}
                                    </span>
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => startEdit(acao)}
                                    className="border-[#1E2D48] text-[#4FC3F7] bg-transparent text-[11px] font-serif"
                                  >
                                    ✎ Editar
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => remove(acao.id)}
                                    className="border-[#1E2D48] text-[#4A5A7A] bg-transparent text-[11px] font-serif"
                                  >
                                    Remover
                                  </Button>
                                </div>
                              </div>
                            )}
                            {isEditing && (
                              <ActionForm
                                form={editForm}
                                setForm={setEditForm}
                                onSave={saveEdit}
                                onCancel={() => {
                                  setEditId(null)
                                  setExpandedActions((p) => ({ ...p, [acao.id]: false }))
                                }}
                                saveLabel="Salvar alterações"
                              />
                            )}
                          </div>
                        )
                      })}
                      {isAdding && (
                        <ActionForm
                          form={addForm}
                          setForm={setAddForm}
                          onSave={() => addAction(semNum)}
                          onCancel={() => {
                            setAdding(null)
                            setAddForm(EMPTY_FORM)
                          }}
                          saveLabel="+ Adicionar ação"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          <div
            className={`mt-5 p-4 rounded-xl flex justify-between items-center border ${resultadoFinal >= 0 ? 'border-[#00D4A133]' : 'border-[#EF9A9A22]'}`}
          >
            <div>
              <div className="text-[9px] uppercase tracking-widest text-[#4A5A7A] mb-0.5">
                Resultado final · {month.label}
              </div>
              <div className="text-[10px] text-[#4A5A7A]">
                Base {fmtR(Math.abs(fin.resultado))} · Plano {fmtD(totalPlan) ?? 'R$ 0'} ·
                Realizado {fmtD(totalReal) ?? 'R$ 0'}
              </div>
            </div>
            <div
              className={`text-[22px] font-bold ${
                resultadoFinal >= 0
                  ? 'text-[#00D4A1]'
                  : resultadoFinal > -30000
                    ? 'text-[#FFB74D]'
                    : 'text-[#EF9A9A]'
              }`}
            >
              {fmtR(resultadoFinal)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
