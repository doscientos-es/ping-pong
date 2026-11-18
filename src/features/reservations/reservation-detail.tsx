import { LinkButton } from '@doscientos/ui/button'
import {
  CalendarDays,
  CalendarX2,
  Clock3,
  CircleCheck,
  Download,
  UserRound,
  Pencil,
} from 'lucide-react'
import { useState } from 'react'

import { useClubClock } from '../../app/club-clock'
import { useClub } from '../../app/club-context'
import { dateLabel, hourLabel, periodLabel } from '../../shared/format'
import { Badge, Button, DetailList, InlineError, Modal, Notice, useCommand } from '../../shared/ui'
import type { Reservation } from '../club/domain/model'
import { startTime } from '../club/domain/rules'
import { downloadInvoice } from '../payments/invoice-document'
import { BookingDialog } from './booking-dialog'
import { CALENDAR_INVITE_FILENAME, calendarEventFor, createCalendarInvite } from './calendar-invite'

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
  const receipts = view!.payments.filter(
    (payment) =>
      payment.memberId === current.memberId &&
      payment.period === current.date.slice(0, 7) &&
      payment.status === 'paid',
  )
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
          {!future && !cancelled && (
            <div className="border-line grid gap-2 rounded-xl border p-3">
              <div>
                <h3 className="text-sm font-semibold">
                  Cuota de {periodLabel(current.date.slice(0, 7))}
                </h3>
                <p className="text-muted mt-1 text-xs">
                  El comprobante corresponde a la cuota mensual, no a esta partida.
                </p>
              </div>
              {receipts.length ? (
                receipts.map((payment) => (
                  <Button
                    key={payment.id}
                    variant="secondary"
                    onClick={() => downloadInvoice(payment)}
                  >
                    <Download size={17} />
                    Descargar comprobante {payment.invoiceNumber}
                  </Button>
                ))
              ) : (
                <p className="text-muted text-xs">
                  No hay ningún comprobante disponible para este mes.
                </p>
              )}
            </div>
          )}
          {future && !cancelled && (
            <div className="grid gap-2">
              <LinkButton
                href={`data:text/calendar;charset=utf-8,${encodeURIComponent(createCalendarInvite(calendarEventFor(current)))}`}
                download={CALENDAR_INVITE_FILENAME}
                variant="outline"
                className="max-desktop:min-h-11 w-full"
              >
                <CalendarDays size={17} />
                Añadir al calendario
              </LinkButton>
              <p className="text-muted text-xs">
                El evento descargado no se actualiza si la reserva cambia o se cancela.
              </p>
            </div>
          )}
          {future && !cancelled && view!.actor.role === 'admin' && !cancelStep && (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil size={17} />
              Modificar reserva
            </Button>
          )}
          <footer className="border-line border-t pt-4">
            {future && !cancelled && cancelStep ? (
              <div className="rounded-xl border border-[#efdfcd] bg-[#faf2e9] p-5">
                <h3 className="text-sm font-semibold">¿Quieres cancelar esta reserva?</h3>
                <p className="text-muted my-3 text-sm">
                  La pista quedará libre para otro socio. La cancelación no modifica tu cuota ni
                  genera cargos.
                </p>
                <InlineError>{command.error}</InlineError>
                <div className="desktop:flex-row flex flex-col gap-2.5 [&>button]:flex-1">
                  <Button autoFocus disabled={command.busy} onClick={() => setCancelStep(false)}>
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
                    {command.busy ? 'Cancelando…' : 'Sí, cancelar reserva'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="desktop:flex-row flex flex-col gap-2">
                <Button className="desktop:w-auto w-full" onClick={onClose}>
                  Cerrar
                </Button>
                {future && !cancelled && (
                  <Button
                    variant="ghost"
                    className="text-destructive enabled:hover:bg-destructive/10 enabled:hover:text-destructive desktop:ml-auto"
                    onClick={() => setCancelStep(true)}
                  >
                    <CalendarX2 size={17} />
                    Cancelar reserva
                  </Button>
                )}
              </div>
            )}
          </footer>
        </div>
      </Modal>
    </>
  )
}
