import { ptBR } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { STATUS_OPTIONS, STATUS_STYLE } from '@/constants'
import type { Action } from '@/types'

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function parsePrazoToDate(prazo: string): Date | undefined {
  const ddmmaa = prazo.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (ddmmaa) {
    const [, d, m, a] = ddmmaa
    const month = Number(m) - 1
    const day = Number(d)
    const year = Number(a)
    const date = new Date(year, month, day)
    if (!Number.isNaN(date.getTime()) && date.getMonth() === month && date.getDate() === day) return date
  }
  const ddm = prazo.match(/^(\d{1,2})\/(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)$/i)
  if (ddm) {
    const [, d, mes] = ddm
    const month = MESES.indexOf(mes.toLowerCase())
    if (month === -1) return undefined
    const day = Number(d)
    const year = new Date().getFullYear()
    const date = new Date(year, month, day)
    if (!Number.isNaN(date.getTime())) return date
  }
  return undefined
}

function formatDateToPrazo(date: Date): string {
  const d = date.getDate()
  const m = date.getMonth()
  const a = date.getFullYear()
  return `${String(d).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}/${a}`
}

const formRow = 'grid grid-cols-1 md:grid-cols-3 gap-2 mb-3'
const labelClass = 'block text-[9px] text-[#4A5A7A] uppercase tracking-wider mb-1'
const inputClass =
  'w-full bg-[#0D1527] border border-[#1E2D48] rounded-lg px-3 py-2 text-sm text-[#E0E4F0] font-serif outline-none'

export type ActionFormData = Pick<Action, 'descricao' | 'responsavel' | 'valor' | 'sinal' | 'prazo' | 'status' | 'resultado'>

interface ActionFormProps {
  form: ActionFormData
  setForm: (f: ActionFormData) => void
  onSave: () => void
  onCancel: () => void
  saveLabel?: string
}

export function ActionForm({
  form,
  setForm,
  onSave,
  onCancel,
  saveLabel = 'Salvar',
}: ActionFormProps) {
  const statusStyle = STATUS_STYLE[form.status] ?? STATUS_STYLE.Planejado

  return (
    <div className="p-4 pt-3 pb-4 bg-[#060B16] border-t border-[#111827]">
      <div className={formRow}>
        <div className="md:col-span-3">
          <label className={labelClass}>Descrição *</label>
          <Input
            placeholder="Ex: Renegociar contrato fornecedor X"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            className={inputClass}
            autoFocus
          />
        </div>
        <div>
          <label className={labelClass}>Responsável</label>
          <Input
            placeholder="Nome"
            value={form.responsavel}
            onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Valor (R$)</label>
          <div className="flex gap-2">
            <div className="flex shrink-0 rounded-lg overflow-hidden border border-[#1E2D48]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-pressed={form.sinal === '+'}
                aria-label="Entrada (adição)"
                className={`rounded-none border-0 h-9 px-3 font-bold text-sm ${
                  form.sinal === '+'
                    ? 'bg-[#00D4A1]/20 text-[#00D4A1] hover:bg-[#00D4A1]/30'
                    : 'bg-[#0D1527] text-[#8A9BBE] hover:bg-[#1E2D48] hover:text-[#E0E4F0]'
                }`}
                onClick={() => setForm({ ...form, sinal: '+' })}
              >
                +
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-pressed={form.sinal === '-'}
                aria-label="Saída (subtração)"
                className={`rounded-none border-0 h-9 px-3 font-bold text-sm border-l border-[#1E2D48] ${
                  form.sinal === '-'
                    ? 'bg-[#EF9A9A]/20 text-[#EF9A9A] hover:bg-[#EF9A9A]/30'
                    : 'bg-[#0D1527] text-[#8A9BBE] hover:bg-[#1E2D48] hover:text-[#E0E4F0]'
                }`}
                onClick={() => setForm({ ...form, sinal: '-' })}
              >
                −
              </Button>
            </div>
            <Input
              type="number"
              placeholder="0"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              className={`flex-1 ${inputClass} ${form.sinal === '+' ? 'text-[#00D4A1]' : 'text-[#EF9A9A]'}`}
              aria-label="Valor em reais"
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Prazo</label>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: 10/jan ou use o calendário"
              value={form.prazo}
              onChange={(e) => setForm({ ...form, prazo: e.target.value })}
              className={`flex-1 ${inputClass}`}
              aria-label="Prazo (data ou texto)"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 bg-[#0D1527] border-[#1E2D48] text-[#E0E4F0] hover:bg-[#1E2D48]"
                  aria-label="Abrir calendário para escolher a data do prazo"
                >
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#0D1527] border-[#1E2D48]" align="start">
                <Calendar
                  mode="single"
                  selected={parsePrazoToDate(form.prazo) ?? undefined}
                  onSelect={(date) => {
                    if (date) setForm({ ...form, prazo: formatDateToPrazo(date) })
                  }}
                  locale={ptBR}
                  className="rounded-md border-0 text-[#E0E4F0]"
                  classNames={{
                    caption_label: 'text-[#E0E4F0]',
                    weekdays: 'flex gap-0 w-full',
                    weekday: 'text-[#8A9BBE] min-w-8 flex-1 text-center text-[0.8rem]',
                    button_previous: 'text-[#E0E4F0] hover:bg-[#1E2D48] hover:text-[#E0E4F0]',
                    button_next: 'text-[#E0E4F0] hover:bg-[#1E2D48] hover:text-[#E0E4F0]',
                    day: '[&_button]:text-[#E0E4F0] [&_button]:hover:bg-[#1E2D48] [&_button]:hover:text-[#E0E4F0] [&_button[data-selected-single=true]]:!bg-[#4FC3F7] [&_button[data-selected-single=true]]:!text-[#060B16]',
                    outside: '!text-[#4A5A7A]',
                    disabled: '!text-[#4A5A7A]',
                    today: '[&_button]:bg-[#1E2D48] [&_button]:text-[#E0E4F0]',
                    range_start: '[&_button]:!bg-[#4FC3F7] [&_button]:!text-[#060B16]',
                    range_end: '[&_button]:!bg-[#4FC3F7] [&_button]:!text-[#060B16]',
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm({ ...form, status: v })}
          >
            <SelectTrigger className={`${inputClass}`} style={{ color: statusStyle.color }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>Resultado / Observação</label>
          <Input
            placeholder="Ex: Negociação concluída"
            value={form.resultado}
            onChange={(e) => setForm({ ...form, resultado: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={onSave}
          className="bg-[#4FC3F7] text-[#060B16] hover:bg-[#4FC3F7]/90 font-bold text-sm font-serif"
        >
          {saveLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-[#1A2540] text-[#8A9BBE] hover:bg-[#1A2540] text-sm font-serif"
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}
