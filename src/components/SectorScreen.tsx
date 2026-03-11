import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MONTHS, EMPTY_FORM, fmtD, parseValor, STATUS_STYLE } from '@/constants'
import { usePlan } from '@/context/PlanContext'
import { ActionForm, type ActionFormData } from '@/components/ActionForm'
import type { Action } from '@/types'

interface SectorScreenProps {
  setorId: string
}

function isBacklog(setorId: string): boolean {
  return setorId === 'backlog'
}

function filterActionsBySetor(actions: Action[], setorId: string): Action[] {
  if (isBacklog(setorId)) {
    return actions.filter((a) => !a.setor || a.setor === '')
  }
  return actions.filter((a) => a.setor === setorId)
}

function monthWeekLabel(acao: Action): string {
  const m = MONTHS.find((x) => x.id === acao.mes)
  return m ? `${m.short} · Semana ${acao.semana}` : `Semana ${acao.semana}`
}

export function SectorScreen({ setorId }: SectorScreenProps) {
  const { actions, setActions, saveActions, saveError, clearSaveError } = usePlan()
  const sectorActions = filterActionsBySetor(actions, setorId)

  const [expandedActions, setExpandedActions] = useState<Record<string, boolean>>({})
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [addForm, setAddForm] = useState<ActionFormData>(() => ({
    ...EMPTY_FORM,
    setor: isBacklog(setorId) ? '' : setorId,
  }))
  const [editForm, setEditForm] = useState<ActionFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null)

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

  const addAction = async () => {
    if (!addForm.descricao.trim()) return
    await mutate((prev) => [
      ...prev,
      {
        ...addForm,
        setor: isBacklog(setorId) ? '' : setorId,
        mes: addForm.mes,
        semana: addForm.semana,
        id: Date.now().toString(),
      } as Action,
    ])
    setAddForm({ ...EMPTY_FORM, setor: isBacklog(setorId) ? '' : setorId })
    setAdding(false)
  }

  const startEdit = (a: Action) => {
    setEditId(a.id)
    setEditForm({
      descricao: a.descricao,
      responsavel: a.responsavel,
      valor: a.valor,
      sinal: a.sinal,
      prazo: a.prazo,
      status: a.status,
      resultado: a.resultado,
      setor: a.setor ?? '',
      mes: a.mes,
      semana: a.semana,
    })
    setExpandedActions((p) => ({ ...p, [a.id]: true }))
  }

  const saveEdit = async () => {
    await mutate((prev) =>
      prev.map((a) =>
        a.id === editId
          ? ({
              ...editForm,
              id: editId,
              setor: editForm.setor || undefined,
            } as Action)
          : a
      )
    )
    setEditId(null)
  }

  const remove = async (id: string) => {
    await mutate((prev) => prev.filter((a) => a.id !== id))
    if (editId === id) setEditId(null)
  }

  const toggleAction = (id: string) => {
    setExpandedActions((p) => ({ ...p, [id]: !p[id] }))
    if (editId === id) setEditId(null)
  }

  const totalPlan = sectorActions.reduce(
    (s, a) => s + parseValor(a.valor, a.sinal),
    0
  )
  const totalReal = sectorActions
    .filter((a) => a.status === 'Realizado')
    .reduce((s, a) => s + parseValor(a.valor, a.sinal), 0)
  const title = isBacklog(setorId) ? 'Backlog' : setorId

  const handleConfirmRemove = async () => {
    if (removeConfirmId) {
      await remove(removeConfirmId)
      setRemoveConfirmId(null)
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {removeConfirmId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          aria-modal="true"
          role="alertdialog"
          aria-labelledby="confirm-remove-title"
          aria-describedby="confirm-remove-desc"
        >
          <div className="bg-[#0D1527] border border-[#1E2D48] rounded-xl p-5 shadow-xl max-w-sm w-full mx-4">
            <h2
              id="confirm-remove-title"
              className="text-sm font-bold text-white mb-1"
            >
              Remover ação
            </h2>
            <p
              id="confirm-remove-desc"
              className="text-[13px] text-[#8A9BBE] mb-5"
            >
              Tem certeza que deseja remover esta ação? Esta ação não poderá ser
              desfeita.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRemoveConfirmId(null)}
                className="border-[#1E2D48] text-[#8A9BBE] bg-transparent text-sm font-serif"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmRemove}
                className="bg-[#EF9A9A] text-[#060B16] hover:bg-[#EF9A9A]/90 font-bold text-sm font-serif"
              >
                Remover
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="w-[220px] shrink-0 bg-[#0A1020] border-r border-[#16213A] py-6 px-4 overflow-y-auto">
        <div className="text-[9px] text-[#4A5A7A] uppercase tracking-widest mb-1">
          Setor
        </div>
        <h2 className="text-[22px] font-bold text-white mb-4">{title}</h2>
        <div className="bg-[#4FC3F7]/10 border border-[#4FC3F733] rounded-lg p-3 mb-2">
          <div className="text-[9px] text-[#4A5A7A] uppercase tracking-wider mb-1">
            Plano (estimado)
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
        <div className="text-[10px] text-[#4A5A7A]">
          {sectorActions.length} ação(ões)
        </div>
      </div>

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
          <div className="bg-[#0D1527] rounded-xl overflow-hidden border border-[#16213A]">
            {sectorActions.map((acao, ai) => {
              const valor = parseValor(acao.valor, acao.sinal)
              const isPos = valor >= 0
              const sc = STATUS_STYLE[acao.status] ?? STATUS_STYLE.Planejado
              const isCanceled = acao.status === 'Cancelado'
              const isExpanded = !!expandedActions[acao.id]
              const isEditing = editId === acao.id
              const isLast = ai === sectorActions.length - 1
              return (
                <div
                  key={acao.id}
                  className={
                    !isLast || adding
                      ? 'border-b border-[#111827]'
                      : ''
                  }
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => !isEditing && toggleAction(acao.id)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && !isEditing && toggleAction(acao.id)
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
                      className={`flex-1 text-xs truncate min-w-0 ${isCanceled ? 'text-[#3A4A6A] line-through' : 'text-[#E0E4F0]'}`}
                    >
                      {acao.descricao || (
                        <span className="text-[#4A5A7A]">sem descrição</span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#4A5A7A] shrink-0">
                      {monthWeekLabel(acao)}
                    </span>
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
                          onClick={() => setRemoveConfirmId(acao.id)}
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
            {adding && (
              <ActionForm
                form={addForm}
                setForm={setAddForm}
                onSave={addAction}
                onCancel={() => {
                  setAdding(false)
                  setAddForm({
                    ...EMPTY_FORM,
                    setor: isBacklog(setorId) ? '' : setorId,
                  })
                }}
                saveLabel="+ Adicionar ação"
              />
            )}
          </div>

          {!adding && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAdding(true)
                setAddForm({
                  ...EMPTY_FORM,
                  setor: isBacklog(setorId) ? '' : setorId,
                })
              }}
              className="mt-4 border-[#1E2D48] text-[#4FC3F7] bg-transparent text-[11px] font-serif"
            >
              + Nova ação
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
