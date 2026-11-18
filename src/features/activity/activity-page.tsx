import { useMemo, useState } from 'react'

import { useClubClock } from '../../app/club-clock'
import { useClub } from '../../app/club-context'
import { dateLabel } from '../../shared/format'
import { reportRange, type ReportPeriod } from '../../shared/report-period'
import { Button, ButtonLink, PageHeading } from '../../shared/ui'
import { COURTS } from '../club/domain/model'
import { periodKey } from '../club/domain/rules'
import { ActivityCharts } from './activity-charts'
import { reservationReport } from './domain/reservation-report'

export function ActivityPage() {
  const { view } = useClub()
  const now = useClubClock()
  const [month, setMonth] = useState(() => periodKey(now))
  const [period, setPeriod] = useState<ReportPeriod>('month')
  const [court, setCourt] = useState('all')
  const [memberId, setMemberId] = useState('all')
  const { from, to } = reportRange(month, period)
  const { reservations, members, settings } = view!
  const report = useMemo(
    () => reservationReport(reservations, members, settings, from, to, court, memberId),
    [reservations, members, settings, from, to, court, memberId],
  )
  const memberOptions = members
    .filter((member) => member.role === 'member')
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  return (
    <>
      <PageHeading
        title="Actividad del club"
        action={
          <ButtonLink to="/contabilidad" variant="secondary">
            Ver contabilidad
          </ButtonLink>
        }
      />
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <label className="text-muted grid gap-1 text-xs">
          Periodo
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as ReportPeriod)}
          >
            <option value="month">Mes</option>
            <option value="quarter">Trimestre</option>
            <option value="year">Año</option>
          </select>
        </label>
        <label className="text-muted grid gap-1 text-xs">
          Mes de referencia
          <input
            type="month"
            value={month}
            min="1900-01"
            max="9999-12"
            onChange={(event) => {
              if (
                /^\d{4}-(0[1-9]|1[0-2])$/.test(event.target.value) &&
                event.target.value >= '1900-01' &&
                event.target.value <= '9999-12'
              )
                setMonth(event.target.value)
            }}
          />
        </label>
        <label className="text-muted grid gap-1 text-xs">
          Pista
          <select value={court} onChange={(event) => setCourt(event.target.value)}>
            <option value="all">Todas las pistas</option>
            {COURTS.map((item) => (
              <option key={item} value={item}>
                Pista {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-muted grid gap-1 text-xs">
          Socio
          <select value={memberId} onChange={(event) => setMemberId(event.target.value)}>
            <option value="all">Todos los socios</option>
            {memberOptions.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
                {member.active ? '' : ' · de baja'}
              </option>
            ))}
          </select>
        </label>
        {(court !== 'all' || memberId !== 'all') && (
          <Button
            variant="ghost"
            onPress={() => {
              setCourt('all')
              setMemberId('all')
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>
      <p className="text-muted mb-4 text-xs leading-relaxed">
        {dateLabel(from, { day: 'numeric', month: 'short', year: 'numeric' })} —{' '}
        {dateLabel(to, { day: 'numeric', month: 'short', year: 'numeric' })} · Incluye reservas
        futuras
      </p>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: 'Reservas confirmadas', value: report.total },
          { label: 'Socios con reservas', value: report.uniqueMembers },
          { label: 'Reservas canceladas', value: report.cancelled },
        ].map(({ label, value }) => (
          <div key={label} className="border-line rounded-xl border bg-white p-3">
            <p className="text-muted text-xs">{label}</p>
            <strong className="font-heading mt-1 block text-xl tabular-nums">{value}</strong>
          </div>
        ))}
      </div>
      <ActivityCharts report={report} />
    </>
  )
}
