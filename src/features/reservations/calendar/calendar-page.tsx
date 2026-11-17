import { useState } from 'react'

import { useClubClock } from '../../../app/club-clock'
import { useClub } from '../../../app/club-context'
import { Panel } from '../../../shared/ui'
import type { Reservation } from '../../club/domain/model'
import { BookingFlowLoader } from '../booking-flow-loader'
import { ReservationDetail } from '../reservation-detail'
import { AdminCalendar } from './admin-calendar'
import { CalendarAside } from './calendar-aside'
import { ClubWelcome } from './club-welcome'

export function CalendarPage() {
  const { view } = useClub()
  const now = useClubClock()
  const [detail, setDetail] = useState<Reservation | null>(null)
  const admin = view!.actor.role === 'admin'
  return (
    <>
      {!admin && <ClubWelcome admin={admin} />}
      <div className="wide:grid-cols-[minmax(0,1fr)_248px] wide:gap-4 grid items-start gap-3">
        {admin ? (
          <AdminCalendar onDetail={setDetail} />
        ) : (
          <Panel className="desktop:px-4 desktop:pt-4 min-w-0 px-3 pt-3">
            <BookingFlowLoader />
          </Panel>
        )}
        <CalendarAside view={view!} now={now} onDetail={setDetail} />
      </div>
      {detail && <ReservationDetail reservation={detail} onClose={() => setDetail(null)} />}
    </>
  )
}
