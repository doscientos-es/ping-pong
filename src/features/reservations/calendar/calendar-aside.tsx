import { ArrowRight, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { CourtArt } from '../../../shared/court-art'
import { compareReservations, dateLabel, hourLabel, money } from '../../../shared/format'
import { Button, Panel } from '../../../shared/ui'
import type { ClubView, Reservation } from '../../club/domain/model'
import { requirePlan } from '../../club/domain/plans'
import { startTime } from '../../club/domain/rules'

function NextReservation({
  reservation,
  onDetail,
}: {
  reservation?: Reservation
  onDetail: (reservation: Reservation) => void
}) {
  return (
    <Panel className="desktop:p-4 p-3">
      <h2 className="text-sm">Próxima reserva</h2>
      {reservation ? (
        <Button
          variant="ghost"
          className="desktop:min-h-16 mt-2 min-h-16 w-full justify-between px-2 text-left"
          aria-label="Ver próxima reserva"
          onClick={() => onDetail(reservation)}
        >
          <span className="grid min-w-0 gap-1">
            <strong className="text-green text-[13px] capitalize">
              {dateLabel(reservation.date, { weekday: 'short', day: 'numeric', month: 'short' })}
            </strong>
            <span className="text-muted flex flex-wrap items-center gap-x-1.5 text-xs font-normal">
              <Clock3 size={14} />
              {hourLabel(reservation.hour)} – {hourLabel(reservation.hour + 1)}
              <span>· Pista {reservation.court}</span>
            </span>
          </span>
          <ArrowRight size={17} />
        </Button>
      ) : (
        <p className="text-muted mt-2 text-[13px]">No tienes reservas próximas.</p>
      )}
      <Link
        to="/reservas"
        className="text-green-mid mt-1 flex min-h-11 items-center text-xs font-semibold hover:underline"
      >
        Todas mis reservas <ArrowRight size={14} className="ml-1.5" />
      </Link>
    </Panel>
  )
}

export function CalendarAside({
  view,
  now,
  onDetail,
}: {
  view: ClubView
  now: Date
  onDetail: (reservation: Reservation) => void
}) {
  const admin = view.actor.role === 'admin'
  const plan = requirePlan(view.settings, view.actor.planId)
  const next = view.reservations
    .filter(
      (item) =>
        item.memberId === view.actor.id &&
        item.status === 'confirmed' &&
        startTime(item.date, item.hour) > now.getTime(),
    )
    .sort(compareReservations)[0]
  return (
    <aside
      aria-label="Información del club"
      className="desktop:max-wide:grid-cols-2 wide:grid-cols-1 grid gap-3"
    >
      {!admin && <NextReservation reservation={next} onDetail={onDetail} />}
      <section className="border-line bg-accent-soft desktop:block hidden rounded-xl border p-4">
        <h2 className="text-sm">Cuota mensual</h2>
        <p className="text-muted mt-1 text-xs">{plan.name}</p>
        <p className="text-green mt-2 text-lg font-semibold">
          {money(plan.priceCents)} <span className="text-muted text-xs font-normal">/ mes</span>
        </p>
        <p className="text-muted mt-1 text-xs">Reservas ilimitadas incluidas.</p>
        <CourtArt className="mx-auto mt-2 h-28 w-full" />
      </section>
    </aside>
  )
}
