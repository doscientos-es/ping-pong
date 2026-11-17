import { CalendarDays, Check, Clock3, Table2 } from 'lucide-react'
import { useId } from 'react'

import { dateLabel, hourLabel } from '../../../shared/format'
import { Button, Notice } from '../../../shared/ui'
import type { Member } from '../../club/domain/model'

export function BookingReview({
  date,
  hour,
  court,
  admin,
  memberId,
  eligible,
  playerName,
  validSlot,
  validMember,
  onStepChange,
  onMemberChange,
}: {
  date: string
  hour: number | null
  court: number | null
  admin: boolean
  memberId: string
  eligible: Member[]
  playerName?: string
  validSlot: boolean
  validMember: boolean
  onStepChange: (step: number) => void
  onMemberChange: (id: string) => void
}) {
  const memberFieldId = useId()
  const rows = [
    {
      label: 'Día',
      value: dateLabel(date, { weekday: 'short', day: 'numeric', month: 'long' }),
      Icon: CalendarDays,
      action: 'Cambiar día',
    },
    {
      label: 'Hora',
      value: hour === null ? 'Elige una hora' : `${hourLabel(hour)} – ${hourLabel(hour + 1)}`,
      Icon: Clock3,
      action: 'Cambiar hora',
    },
    { label: 'Pista', value: `Pista ${court}`, Icon: Table2, action: 'Cambiar pista' },
  ]
  return (
    <div className="grid gap-3">
      <div className="divide-line border-line desktop:px-3 grid divide-y rounded-xl border px-2.5">
        {rows.map(({ label, value, Icon, action }, index) => (
          <div key={label} className="desktop:gap-3 flex items-center gap-2 py-2">
            <Icon size={18} className="shrink-0" />
            <span className="text-muted grid min-w-0 flex-1 gap-0.5 text-xs">
              {label}
              <strong className="text-green text-sm leading-5">{value}</strong>
            </span>
            <Button
              variant="ghost"
              aria-label={action}
              className="desktop:text-xs shrink-0 px-2 text-xs"
              onClick={() => onStepChange(index)}
            >
              Cambiar
            </Button>
          </div>
        ))}
      </div>
      {admin ? (
        <div className="grid gap-2">
          <label htmlFor={memberFieldId}>Socio de la reserva</label>
          <select
            id={memberFieldId}
            aria-describedby={`${memberFieldId}-help`}
            value={memberId}
            onChange={(event) => onMemberChange(event.target.value)}
          >
            <option value="">Selecciona un socio</option>
            {eligible.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} · {member.number}
              </option>
            ))}
          </select>
          <small id={`${memberFieldId}-help`} className="text-muted">
            Solo socios activos con la cuota de este mes al día.
          </small>
        </div>
      ) : (
        <Notice>
          <Check size={20} />
          <span>
            <strong>Incluida en tu cuota.</strong> Reserva para {playerName}.
          </span>
        </Notice>
      )}
      {!validSlot && (
        <Notice warning role="status">
          Esta pista ya no está disponible en ese horario. Cambia el día, la hora o la pista.
        </Notice>
      )}
      {admin && !validMember && memberId && (
        <Notice warning>El socio ya no tiene acceso activo. Selecciona otro socio.</Notice>
      )}
    </div>
  )
}
