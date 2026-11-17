import { CalendarDays, Clock3, CircleCheck, UserRound, Pencil } from 'lucide-react'
import { useState } from 'react'

import { useClubClock } from '../../app/club-clock'
import { useClub } from '../../app/club-context'
import { dateLabel, hourLabel } from '../../shared/format'
import { Badge, Button, DetailList, InlineError, Modal, Notice, useCommand } from '../../shared/ui'
import type { Reservation } from '../club/domain/model'
import { startTime } from '../club/domain/rules'
import { BookingDialog } from './booking-dialog'

export function ReservationDetail({
  reservation,
  onClose,
}: {
  reservation: Reservation
  onClose: () => void
}) {
  const { view, gateway, selectedId } = useClub()
  const now = useClubClock()
  const [cancelStep, setCancelStep] = useState(false)
  const [editing, setEditing] = useState(false)
  const command = useCommand()
  const current = view!.reservations.find((item) => item.id === reservation.id) ?? reservation
  const member = view!.members.find((item) => item.id === current.memberId)
  const future = startTime(current.date, current.hour) > now.getTime()
  const cancelled = current.status === 'cancelled'
  if (editing) return <BookingDialog reservation={current} onClose={onClose} />
  return (
    <>
      <Modal open onClose={onClose} title={`Pista ${current.court}`}>
        <div className="desktop:gap-5 grid gap-4">
          <Badge className="justify-self-start" tone={cancelled ? 'gray' : 'green'}>
            {cancelled ? 'Cancelada' : future ? 'Reserva confirmada' : 'Partida finalizada'}
          </Badge>
          <DetailList
            items={[
              {
                label: 'Fecha',
                icon: CalendarDays,
                value: dateLabel(current.date, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }),
              },
              {
                label: 'Horario',
                icon: Clock3,
                value: `${hourLabel(current.hour)} – ${hourLabel(current.hour + 1)}`,
              },
              ...(member ? [{ label: 'Jugador', icon: UserRound, value: member.name }] : []),
            ]}
          />
          <Notice>
            <CircleCheck size={20} />
            <span className="flex-1">Incluida en la suscripción</span>
            <strong>Sin coste extra</strong>
          </Notice>
          {future && !cancelled && view!.actor.role === 'admin' && !cancelStep && (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil size={17} />
              Modificar reserva
            </Button>
          )}
          {future &&
            !cancelled &&
            (!cancelStep ? (
              <Button variant="ghost" onClick={() => setCancelStep(true)}>
                Cancelar reserva
              </Button>
            ) : (
              <div className="rounded-xl border border-[#efdfcd] bg-[#faf2e9] p-5">
                <h3>¿Cancelar reserva?</h3>
                <p className="text-muted my-3 text-sm">
                  La pista quedará libre para otro socio. La cancelación no modifica tu cuota ni
                  genera cargos.
                </p>
                <InlineError>{command.error}</InlineError>
                <div className="desktop:flex-row flex flex-col gap-2.5 [&>button]:flex-1">
                  <Button
                    variant="secondary"
                    disabled={command.busy}
                    onClick={() => setCancelStep(false)}
                  >
                    Mantener reserva
                  </Button>
                  <Button
                    variant="danger"
                    disabled={command.busy}
                    onClick={async () => {
                      const result = await command.run(async () => {
                        await gateway.cancel(selectedId, current.id)
                        return true
                      }, 'Reserva cancelada. La pista vuelve a estar libre.')
                      if (result) onClose()
                    }}
                  >
                    {command.busy ? 'Cancelando…' : 'Sí, cancelar'}
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </Modal>
    </>
  )
}
