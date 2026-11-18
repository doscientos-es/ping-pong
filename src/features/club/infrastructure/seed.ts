import type { LedgerEntry } from '../../accounting/domain/model'
import {
  COURTS,
  type ClubPlan,
  type ClubState,
  type FiscalIssuer,
  type Member,
  type Payment,
  type Reservation,
} from '../domain/model'
import { RECORDED_PAYMENT_METHODS } from '../domain/payment-methods'
import { LEGACY_PLAN_ID, LEGACY_PLAN_NAME } from '../domain/plans'
import { addDays, dateKey, startTime } from '../domain/rules'

const DEMO_ISSUER: FiscalIssuer = {
  legalName: 'Doscientos Club Demo, S. L.',
  nif: 'B00000000',
  address: 'Avenida de Ejemplo, 8, 17001 Girona, Girona, España',
}
const DEMO_SUBSCRIPTION_VAT_BPS = 2100

export function createSeed(now = new Date()): ClubState {
  return buildSeed(now, false)
}

export function createDemoSeed(now = new Date()): ClubState {
  return buildSeed(now, true)
}

function buildSeed(now: Date, showcase: boolean): ClubState {
  const plans: ClubPlan[] = [{ id: LEGACY_PLAN_ID, name: LEGACY_PLAN_NAME, priceCents: 3900 }]
  if (showcase) plans.push({ id: 'demo-reduced', name: 'Cuota reducida', priceCents: 2900 })
  const reducedMembers = new Set(['marcos', 'nora', 'julia'])
  const people = [
    ['alba', 'Alba Martín', 'alba@doscientos.example', true, 'Z9999990D'],
    ['marcos', 'Marcos García', 'marcos@doscientos.example', true, 'Z9999991X'],
    ['lucia', 'Lucía Torres', 'lucia@doscientos.example', true, 'Z9999992B'],
    ['pablo', 'Pablo Ruiz', 'pablo@doscientos.example', true, 'Z9999993N'],
    ['nora', 'Nora Vidal', 'nora@doscientos.example', true, 'Z9999994J'],
    ['david', 'David López', 'david@doscientos.example', true, 'Z9999995Z'],
    ['julia', 'Julia Costa', 'julia@doscientos.example', true, 'Z9999996S'],
    ['hugo', 'Hugo Molina', 'hugo@doscientos.example', true, 'Z9999997Q'],
    ['elena', 'Elena Soler', 'elena@doscientos.example', false, 'Z9999998V'],
  ] as const
  const members: Member[] = people.map(([id, name, email, active, dni], i) => ({
    id,
    name,
    email,
    active,
    phone: `600 000 ${String(i + 1).padStart(3, '0')}`,
    ...(showcase && { dni, address: `Calle de Ejemplo, ${i + 1}, 17001 Girona, Girona, España` }),
    role: 'member',
    planId: showcase && reducedMembers.has(id) ? plans[1].id : LEGACY_PLAN_ID,
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
  const today = dateKey(now)
  const add = (
    offset: number,
    hour: number,
    court: number,
    memberId: string,
    cancelled = false,
  ) => {
    const index = reservations.length + 1
    const date = addDays(today, offset)
    const createdAt = new Date(
      Math.min(now.getTime(), startTime(addDays(date, -3), 10)),
    ).toISOString()
    const reservation: Reservation = {
      id: `seed-${index}`,
      memberId,
      date,
      hour,
      court,
      status: cancelled ? 'cancelled' : 'confirmed',
      createdAt,
    }
    reservations.push(reservation)
  }
  for (let offset = showcase ? -55 : -6; offset <= 7; offset++) {
    const day = new Date(`${addDays(today, offset)}T12:00:00`).getDay()
    for (let hour = 8; hour < 22; hour++) {
      const afternoon = hour >= 17 && hour <= 20
      const density = !afternoon ? 1 : day === 4 || day === 5 ? 11 : 5
      for (const court of COURTS) {
        const sample = hour * 7 + court * 3 + offset * 5 + (showcase ? 300 : 70)
        if (showcase ? sample % 29 < density : sample % 11 < 3) {
          const index = (hour + court + offset + 70) % 8
          add(offset, hour, court, people[index][0], showcase && offset < 0 && sample % 7 === 0)
        }
      }
    }
  }
  // A recognizable next game for the default profile, without colliding with fixtures.
  const nextDate = addDays(today, 1)
  const next = reservations.find(
    (item) => item.date === nextDate && item.hour === 18 && item.court === 3,
  )
  const albaAlreadyBooked = reservations.some(
    (item) => item.date === nextDate && item.hour === 18 && item.memberId === 'alba',
  )
  if (!showcase || !albaAlreadyBooked) {
    if (next) next.memberId = 'alba'
    else add(1, 18, 3, 'alba')
  }
  for (const member of members.filter((item) => item.role === 'member')) {
    const plan = plans.find((item) => item.id === member.planId)!
    for (let offset = -2; offset <= 0; offset++) {
      if (offset === 0 && (member.id === 'hugo' || !member.active)) continue
      const month = new Date(now.getFullYear(), now.getMonth() + offset, 1, 12)
      const period = dateKey(month).slice(0, 7)
      const method = RECORDED_PAYMENT_METHODS[payments.length % RECORDED_PAYMENT_METHODS.length]
      payments.push({
        id: `payment-${payments.length + 1}`,
        memberId: member.id,
        period,
        amountCents: plan.priceCents,
        plan: { id: plan.id, name: plan.name },
        ...(showcase && { issuer: { ...DEMO_ISSUER }, vatBps: DEMO_SUBSCRIPTION_VAT_BPS }),
        status: 'paid',
        paidAt: month.toISOString(),
        method: showcase ? method : 'manual',
        invoiceNumber: `DEMO-${month.getFullYear()}-${String(payments.length + 1).padStart(5, '0')}`,
        customer: {
          name: member.name,
          email: member.email,
          ...(showcase && { dni: member.dni, address: member.address }),
        },
      })
    }
  }
  return {
    version: 2,
    accounting: {
      entries: showcase ? demoExpenses(now) : [],
      openingBalanceCents: 0,
      subscriptionVatBps: showcase ? DEMO_SUBSCRIPTION_VAT_BPS : 0,
    },
    credentials: [],
    members,
    reservations,
    payments,
    settings: {
      plans,
      ...(showcase && { issuer: { ...DEMO_ISSUER } }),
      weekly: Array.from({ length: 7 }, (_, day) => ({ day, intervals: [{ start: 8, end: 22 }] })),
      closedDates: [],
    },
  }
}

function demoExpenses(now: Date): LedgerEntry[] {
  const examples = [
    { description: 'Limpieza de las pistas', category: 'Mantenimiento', grossCents: 9600 },
    {
      description: 'Pelotas y redes de recambio',
      category: 'Material deportivo',
      grossCents: 5400,
    },
  ]
  return [-2, -1, 0].flatMap((offset) =>
    examples.map((example, index) => {
      const issuedAt = new Date(now.getFullYear(), now.getMonth() + offset, 1, 8)
      const date = dateKey(issuedAt)
      const pending = offset === 0 && index === 1
      const id = `demo-expense-${date}-${index + 1}`
      return {
        ...example,
        id,
        revision: id,
        kind: 'expense',
        status: pending ? 'pending' : 'paid',
        documentType: 'invoice',
        date,
        paidDate: pending ? undefined : date,
        reference: `DEMO-G-${date.slice(0, 7)}-${index + 1}`,
        counterparty: 'Proveedor de ejemplo',
        vatBps: 2100,
        deductible: true,
        createdAt: new Date(Math.min(now.getTime(), issuedAt.getTime())).toISOString(),
      }
    }),
  )
}
