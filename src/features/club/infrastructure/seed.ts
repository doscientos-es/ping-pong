import type { ClubState, Member, Payment, Reservation } from '../domain/model'
import { LEGACY_PLAN_ID, LEGACY_PLAN_NAME } from '../domain/plans'
import { addDays, dateKey, startTime } from '../domain/rules'

export function createSeed(now = new Date()): ClubState {
  const people = [
    ['alba', 'Alba Martín', 'alba@doscientos.example', true],
    ['marcos', 'Marcos García', 'marcos@doscientos.example', true],
    ['lucia', 'Lucía Torres', 'lucia@doscientos.example', true],
    ['pablo', 'Pablo Ruiz', 'pablo@doscientos.example', true],
    ['nora', 'Nora Vidal', 'nora@doscientos.example', true],
    ['david', 'David López', 'david@doscientos.example', true],
    ['julia', 'Julia Costa', 'julia@doscientos.example', true],
    ['hugo', 'Hugo Molina', 'hugo@doscientos.example', true],
    ['elena', 'Elena Soler', 'elena@doscientos.example', false],
  ] as const
  const members: Member[] = people.map(([id, name, email, active], i) => ({
    id,
    name,
    email,
    active,
    phone: `600 000 ${String(i + 1).padStart(3, '0')}`,
    role: 'member',
    planId: LEGACY_PLAN_ID,
    number: `SC-${String(i + 1).padStart(4, '0')}`,
    joinedAt: new Date(startTime(addDays(dateKey(now), -90), 12)).toISOString(),
  }))
  members.push({
    id: 'admin',
    name: 'Álex · Administración',
    email: 'club@doscientos.example',
    phone: '900 000 008',
    role: 'admin',
    planId: LEGACY_PLAN_ID,
    active: true,
    number: 'STAFF',
    joinedAt: now.toISOString(),
  })
  const reservations: Reservation[] = []
  const payments: Payment[] = []
  const add = (offset: number, hour: number, court: number, memberId: string) => {
    const index = reservations.length + 1
    const date = addDays(dateKey(now), offset)
    const createdAt = new Date(startTime(addDays(date, -3), 10)).toISOString()
    const reservation: Reservation = {
      id: `seed-${index}`,
      memberId,
      date,
      hour,
      court,
      status: 'confirmed',
      createdAt,
    }
    reservations.push(reservation)
  }
  for (let offset = -6; offset <= 7; offset++) {
    for (let hour = 8; hour < 22; hour++) {
      for (let court = 1; court <= 8; court++) {
        if ((hour * 7 + court * 3 + offset * 5 + 70) % 11 < 3) {
          const index = (hour + court + offset + 14) % 8
          add(offset, hour, court, people[index][0])
        }
      }
    }
  }
  // A recognizable next game for the default profile, without colliding with fixtures.
  const nextDate = addDays(dateKey(now), 1)
  const next = reservations.find(
    (item) => item.date === nextDate && item.hour === 18 && item.court === 3,
  )
  if (next) {
    next.memberId = 'alba'
  } else add(1, 18, 3, 'alba')
  for (const member of members.filter((item) => item.role === 'member')) {
    for (let offset = -2; offset <= 0; offset++) {
      if (offset === 0 && (member.id === 'hugo' || !member.active)) continue
      const month = new Date(now.getFullYear(), now.getMonth() + offset, 1, 12)
      const period = dateKey(month).slice(0, 7)
      payments.push({
        id: `payment-${payments.length + 1}`,
        memberId: member.id,
        period,
        amountCents: 3900,
        plan: { id: LEGACY_PLAN_ID, name: LEGACY_PLAN_NAME },
        status: 'paid',
        paidAt: month.toISOString(),
        method: 'manual',
        invoiceNumber: `DEMO-${month.getFullYear()}-${String(payments.length + 1).padStart(5, '0')}`,
        customer: { name: member.name, email: member.email },
      })
    }
  }
  return {
    version: 2,
    accounting: { entries: [], openingBalanceCents: 0, subscriptionVatBps: 0 },
    credentials: [],
    members,
    reservations,
    payments,
    settings: {
      plans: [{ id: LEGACY_PLAN_ID, name: LEGACY_PLAN_NAME, priceCents: 3900 }],
      weekly: Array.from({ length: 7 }, (_, day) => ({ day, intervals: [{ start: 8, end: 22 }] })),
      closedDates: [],
    },
  }
}
