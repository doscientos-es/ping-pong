import { ArrowUpRight, CalendarDays, History, Trophy, Ban } from 'lucide-react'
import { useId, useMemo, useState } from 'react'

import { useClubClock } from '../../app/club-clock'
import { useClub } from '../../app/club-context'
import { emptyDateRange, withinDateRange } from '../../shared/date-range'
import { compareReservations } from '../../shared/format'
import {
  Button,
  ButtonLink,
  DateRangeFields,
  Empty,
  ListToolbar,
  PageHeading,
  Pagination,
  Panel,
  SectionHeading,
  SegmentedControl,
  Stat,
  StatsGrid,
} from '../../shared/ui'
import { usePagination } from '../../shared/use-pagination'
import { COURTS, type Reservation } from '../club/domain/model'
import { dateKey, startTime } from '../club/domain/rules'
import { ReservationCard } from './reservation-card'
import { ReservationDetail } from './reservation-detail'

export function MyReservationsPage({ history = false }: { history?: boolean }) {
  const { view } = useClub()
  const now = useClubClock()
  const [tab, setTab] = useState('upcoming')
  const [detail, setDetail] = useState<Reservation | null>(null)
  const [court, setCourt] = useState('all')
  const [range, setRange] = useState(emptyDateRange)
  const resultsId = useId()
  const { actor, reservations } = view!
  const { upcoming, past, cancelled } = useMemo(() => {
    const groups = {
      upcoming: [] as Reservation[],
      past: [] as Reservation[],
      cancelled: [] as Reservation[],
    }
    for (const item of reservations) {
      if (item.memberId !== actor.id) continue
      if (item.status === 'cancelled') groups.cancelled.push(item)
      else if (startTime(item.date, item.hour) > now.getTime()) groups.upcoming.push(item)
      else groups.past.push(item)
    }
    const compare = (a: Reservation, b: Reservation) =>
      compareReservations(a, b) || a.id.localeCompare(b.id)
    groups.upcoming.sort(compare)
    groups.past.sort((a, b) => compare(b, a))
    groups.cancelled.sort((a, b) => compare(b, a))
    return groups
  }, [reservations, actor.id, now])
  const list = history ? past : tab === 'upcoming' ? upcoming : cancelled
  const filtered = useMemo(
    () =>
      list.filter(
        (item) =>
          (court === 'all' || item.court === Number(court)) && withinDateRange(item.date, range),
      ),
    [list, court, range],
  )
  const pagination = usePagination(filtered, JSON.stringify([actor.id, history, tab, court, range]))
  const hasFilters = court !== 'all' || Boolean(range.from || range.to)
  const playedThisMonth = past.filter((item) =>
    item.date.startsWith(dateKey(now).slice(0, 7)),
  ).length

  return (
    <>
      <PageHeading
        title={history ? 'Historial de partidas' : 'Mis reservas'}
        action={
          <ButtonLink to="/">
            <CalendarDays size={17} />
            Reservar pista
          </ButtonLink>
        }
      />
      <StatsGrid>
        <Stat label="Próximas" value={upcoming.length} icon={CalendarDays} />
        <Stat label="Jugadas" value={past.length} icon={History} />
        <Stat label="Horas este mes" value={playedThisMonth} icon={Trophy} />
      </StatsGrid>
      <Panel>
        <SectionHeading
          title={history ? 'Partidas pasadas' : 'Reservas'}
          action={
            !history && (
              <SegmentedControl
                value={tab}
                onChange={setTab}
                options={[
                  { value: 'upcoming', label: `Próximas (${upcoming.length})` },
                  { value: 'cancelled', label: `Canceladas (${cancelled.length})` },
                ]}
              />
            )
          }
        />
        <ListToolbar>
          <div className="desktop:flex grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-3 pb-1 [&>fieldset]:col-span-2">
            <DateRangeFields label="Fecha de la reserva" value={range} onChange={setRange} />
            <label className="text-muted desktop:w-40 grid w-full gap-1 text-xs">
              Pista
              <select
                className="min-h-11 w-full"
                value={court}
                onChange={(event) => setCourt(event.target.value)}
              >
                <option value="all">Todas las pistas</option>
                {COURTS.map((number) => (
                  <option key={number} value={number}>
                    Pista {number}
                  </option>
                ))}
              </select>
            </label>
            <Button
              variant="secondary"
              disabled={!hasFilters}
              onClick={() => {
                setCourt('all')
                setRange(emptyDateRange)
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        </ListToolbar>
        <section id={resultsId} aria-label="Resultados de reservas">
          {filtered.length ? (
            <div className="desktop:grid-cols-2 desktop:px-4 desktop:pb-4 wide:grid-cols-3 grid gap-2 px-3 pb-3">
              {pagination.items.map((item) => (
                <ReservationCard
                  key={item.id}
                  reservation={item}
                  history={history}
                  onClick={() => setDetail(item)}
                />
              ))}
            </div>
          ) : (
            <Empty
              icon={history ? History : tab === 'cancelled' ? Ban : CalendarDays}
              title={
                hasFilters
                  ? 'No hay reservas con estos filtros'
                  : history
                    ? 'Todavía no hay partidas pasadas'
                    : tab === 'cancelled'
                      ? 'No hay reservas canceladas'
                      : 'No tienes reservas próximas'
              }
              action={
                !history && tab === 'upcoming' ? (
                  <ButtonLink to="/">
                    Reservar pista
                    <ArrowUpRight size={17} />
                  </ButtonLink>
                ) : undefined
              }
            >
              {hasFilters
                ? 'Prueba con otra pista o cambia el rango de fechas.'
                : history
                  ? 'Las reservas pasan al historial al comenzar su horario.'
                  : tab === 'cancelled'
                    ? 'Tus reservas canceladas aparecerán aquí. Tu cuota no cambia.'
                    : 'Elige día, hora y pista para reservar.'}
            </Empty>
          )}
        </section>
        <Pagination pagination={pagination} label="reservas" controls={resultsId} />
      </Panel>
      {detail && <ReservationDetail reservation={detail} onClose={() => setDetail(null)} />}
    </>
  )
}
