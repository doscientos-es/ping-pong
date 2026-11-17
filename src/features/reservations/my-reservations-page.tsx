import { ArrowUpRight, CalendarDays, History, SlidersHorizontal, Ban } from 'lucide-react'
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
  Pagination,
  Panel,
  SegmentedControl,
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
  const [filtersOpen, setFiltersOpen] = useState(false)
  const resultsId = useId()
  const filtersId = useId()
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
  const activeFilterCount = Number(court !== 'all') + Number(Boolean(range.from || range.to))
  const hasFilters = activeFilterCount > 0
  const playedThisMonth = past.filter((item) =>
    item.date.startsWith(dateKey(now).slice(0, 7)),
  ).length

  return (
    <>
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="desktop:text-xl min-w-0 text-lg font-semibold tracking-tight">
          {history ? 'Historial de partidas' : 'Mis reservas'}
        </h1>
        {!history && (
          <ButtonLink to="/" size="sm">
            <CalendarDays size={17} />
            Reservar pista
          </ButtonLink>
        )}
      </header>
      <div className="desktop:mb-4 mb-3 grid grid-cols-3 gap-2">
        {(history
          ? [
              { label: 'Partidas jugadas', value: past.length },
              { label: 'Horas este mes', value: playedThisMonth },
              { label: 'Próximas', value: upcoming.length },
            ]
          : [
              { label: 'Próximas', value: upcoming.length },
              { label: 'Canceladas', value: cancelled.length },
              { label: 'Partidas jugadas', value: past.length },
            ]
        ).map((stat) => (
          <div
            key={stat.label}
            className="border-line min-w-0 rounded-xl border bg-white px-3 py-2"
          >
            <strong className="font-heading block text-lg leading-6 tabular-nums">
              {stat.value}
            </strong>
            <span className="text-muted block text-xs leading-4">{stat.label}</span>
          </div>
        ))}
      </div>
      <Panel>
        <div className="desktop:px-4 flex flex-wrap items-center justify-between gap-2 px-3 py-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">
              {history ? 'Partidas pasadas' : 'Tus reservas'}
            </h2>
            <p className="text-muted text-xs">
              {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {!history && (
              <SegmentedControl
                className="w-fit max-w-full p-0.5"
                value={tab}
                onChange={setTab}
                options={[
                  { value: 'upcoming', label: `Próximas (${upcoming.length})` },
                  { value: 'cancelled', label: `Canceladas (${cancelled.length})` },
                ]}
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={filtersOpen}
              aria-controls={filtersId}
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <SlidersHorizontal size={16} aria-hidden="true" />
              Filtros
              {hasFilters && (
                <span className="bg-accent-soft text-green grid size-5 place-items-center rounded-full text-xs">
                  {activeFilterCount}
                  <span className="sr-only"> filtros activos</span>
                </span>
              )}
            </Button>
          </div>
        </div>
        <div
          id={filtersId}
          hidden={!filtersOpen}
          className="border-line desktop:px-4 border-t px-3 py-3"
        >
          <div className="desktop:flex grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-3 [&>fieldset]:col-span-2">
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
        </div>
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
