import { useId } from 'react'

import { compareReservations, dateLabel, hourLabel, money, periodLabel } from '../../shared/format'
import { Badge, Pagination, Panel, SectionHeading } from '../../shared/ui'
import { usePagination } from '../../shared/use-pagination'
import type { Payment, Reservation } from '../club/domain/model'

export function MemberHistory({
  memberId,
  reservations,
  payments,
}: {
  memberId: string
  reservations: Reservation[]
  payments: Payment[]
}) {
  const reservationsId = useId()
  const paymentsId = useId()
  const reservationPages = usePagination(
    [...reservations].sort((a, b) => compareReservations(b, a) || b.id.localeCompare(a.id)),
    memberId,
  )
  const paymentPages = usePagination(
    [...payments].sort((a, b) => b.paidAt.localeCompare(a.paidAt) || b.id.localeCompare(a.id)),
    memberId,
  )
  return (
    <div className="desktop:grid-cols-2 mt-3 grid items-start gap-3">
      <Panel>
        <SectionHeading title="Historial de reservas" />
        <div id={reservationsId}>
          {reservationPages.total ? (
            <ul>
              {reservationPages.items.map((item) => (
                <li
                  key={item.id}
                  className="border-line flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-sm"
                >
                  <span>
                    {dateLabel(item.date, { day: 'numeric', month: 'long', year: 'numeric' })} ·{' '}
                    {hourLabel(item.hour)} · Pista {item.court}
                  </span>
                  <Badge tone={item.status === 'cancelled' ? 'gray' : 'green'}>
                    {item.status === 'cancelled' ? 'Cancelada' : 'Confirmada'}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted px-4 pb-4 text-sm">No hay reservas registradas.</p>
          )}
        </div>
        {reservationPages.total > 0 && (
          <Pagination pagination={reservationPages} label="reservas" controls={reservationsId} />
        )}
      </Panel>
      <Panel>
        <SectionHeading title="Historial de pagos" />
        <div id={paymentsId}>
          {paymentPages.total ? (
            <ul>
              {paymentPages.items.map((item) => (
                <li
                  key={item.id}
                  className="border-line flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-sm"
                >
                  <span>
                    {periodLabel(item.period)} · {money(item.amountCents)} · {item.invoiceNumber}
                  </span>
                  <Badge tone={item.status === 'voided' ? 'gray' : 'green'}>
                    {item.status === 'voided' ? 'Anulado' : 'Pagado'}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted px-4 pb-4 text-sm">No hay pagos registrados.</p>
          )}
        </div>
        {paymentPages.total > 0 && (
          <Pagination pagination={paymentPages} label="pagos" controls={paymentsId} />
        )}
      </Panel>
    </div>
  )
}
