import { ArrowRight, CalendarDays, Check, Clock3, Table2 } from 'lucide-react'
import type { Ref } from 'react'

import { dateLabel, hourLabel } from '../../../shared/format'
import { Button, ButtonLink, DetailList, SuccessMark } from '../../../shared/ui'
import type { Reservation } from '../../club/domain/model'

export function BookingConfirmation({
  reservation,
  editing,
  admin,
  playerName,
  headingRef,
  onClose,
  onRestart,
}: {
  reservation: Reservation
  editing: boolean
  admin: boolean
  playerName?: string
  headingRef: Ref<HTMLHeadingElement>
  onClose?: () => void
  onRestart: () => void
}) {
  return (
    <section
      className="grid justify-items-center gap-3 py-4 text-center"
      aria-label="Reserva confirmada"
    >
      <SuccessMark />
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="scroll-mt-[calc(var(--app-header-height)+12px)] outline-none"
      >
        {editing ? 'Reserva actualizada' : 'Reserva confirmada'}
      </h2>
      <div className="border-line w-full rounded-xl border p-3 text-left">
        <DetailList
          items={[
            { label: 'Pista', value: `Pista ${reservation.court}`, icon: Table2 },
            {
              label: 'Fecha',
              value: dateLabel(reservation.date, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }),
              icon: CalendarDays,
            },
            {
              label: 'Horario',
              value: `${hourLabel(reservation.hour)} – ${hourLabel(reservation.hour + 1)}`,
              icon: Clock3,
            },
          ]}
        />
      </div>
      {admin && <p>Reserva para {playerName}.</p>}
      <div className="border-line bg-accent-soft text-green-mid flex w-full flex-wrap items-center gap-2 rounded-lg border p-3 text-xs">
        <Check size={18} className="shrink-0" />
        <span className="min-w-0 text-left">
          Incluida en la cuota. <strong>Sin coste adicional</strong>
        </span>
      </div>
      {admin ? (
        <Button className="w-full" onClick={onClose}>
          Volver al calendario
        </Button>
      ) : (
        <ButtonLink to="/reservas" className="w-full">
          Ver mis reservas <ArrowRight size={18} />
        </ButtonLink>
      )}
      {!admin && (
        <Button variant="secondary" onClick={onRestart}>
          Reservar otra partida
        </Button>
      )}
    </section>
  )
}
