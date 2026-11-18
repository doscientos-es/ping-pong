import { CLUB_NAME } from '../../../shared/brand'
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
  legalName: `${CLUB_NAME} Demo, S. L.`,
  nif: 'B00000000',
  address: 'Avenida de Ejemplo, 8, 17001 Girona, Girona, España',
}
const DEMO_SUBSCRIPTION_VAT_BPS = 2100
const DEMO_EMAIL_DOMAIN = 'perception.example'
const DEMO_MEMBER_COUNT = 80

const DEMO_PROFILES = [
  { id: 'alba', name: 'Alba Martín', dni: 'Z9999990D' },
  { id: 'marcos', name: 'Marcos García', dni: 'Z9999991X' },
  { id: 'lucia', name: 'Lucía Torres', dni: 'Z9999992B' },
  { id: 'pablo', name: 'Pablo Ruiz', dni: 'Z9999993N' },
  { id: 'nora', name: 'Nora Vidal', dni: 'Z9999994J' },
  { id: 'david', name: 'David López', dni: 'Z9999995Z' },
  { id: 'julia', name: 'Julia Costa', dni: 'Z9999996S' },
  { id: 'hugo', name: 'Hugo Molina', dni: 'Z9999997Q' },
  { id: 'elena', name: 'Elena Soler', dni: 'Z9999998V' },
]

function extraDemoProfiles() {
  const names = [
    'Ada',
    'Adrià',
    'Aina',
    'Arnau',
    'Berta',
    'Bruno',
    'Carla',
    'Dídac',
    'Gala',
    'Irene',
    'Jan',
    'Jana',
    'Laia',
    'Leo',
    'Lola',
    'Marc',
    'Marta',
    'Nil',
    'Ona',
    'Oriol',
    'Paula',
    'Pol',
    'Roger',
    'Sara',
  ]
  const surnames = ['Serra', 'Ferrer', 'Pons', 'Navarro', 'Roca', 'Gil', 'Vila']
  return Array.from({ length: DEMO_MEMBER_COUNT - DEMO_PROFILES.length }, (_, index) => ({
    id: `socio-${DEMO_PROFILES.length + index + 1}`,
    name: `${names[index % names.length]} ${surnames[index % surnames.length]}`,
    dni: undefined,
  }))
}

export function createSeed(now = new Date()): ClubState {
  return buildSeed(now, false)
}

export function createDemoSeed(now = new Date()): ClubState {
  return buildSeed(now, true)
}

function buildSeed(now: Date, showcase: boolean): ClubState {
  const plans: ClubPlan[] = [{ id: LEGACY_PLAN_ID, name: LEGACY_PLAN_NAME, priceCents: 3900 }]
  const reducedPlan: ClubPlan = { id: 'demo-reduced', name: 'Cuota reducida', priceCents: 2900 }
  if (showcase) plans.push(reducedPlan)
  const reducedMembers = new Set(['marcos', 'nora', 'julia'])
  const people = showcase ? [...DEMO_PROFILES, ...extraDemoProfiles()] : DEMO_PROFILES
  const today = dateKey(now)
  const joinedAt = new Date(startTime(addDays(today, -90), 12)).toISOString()
  const members: Member[] = people.map(({ id, name, dni }, i) => ({
    id,
    name,
    email: `${id}@${DEMO_EMAIL_DOMAIN}`,
    active: id !== 'elena',
    phone: `600 000 ${String(i + 1).padStart(3, '0')}`,
    ...(showcase && { dni, address: `Calle de Ejemplo, ${i + 1}, 17001 Girona, Girona, España` }),
    role: 'member',
    planId: showcase && reducedMembers.has(id) ? reducedPlan.id : LEGACY_PLAN_ID,
    number: `SC-${String(i + 1).padStart(4, '0')}`,
    joinedAt,
  }))
  members.push({
    id: 'admin',
    name: 'Álex · Administración',
    email: `club@${DEMO_EMAIL_DOMAIN}`,
    phone: '900 000 008',
    role: 'admin',
    planId: LEGACY_PLAN_ID,
    active: true,
    number: 'STAFF',
    joinedAt: now.toISOString(),
  })
  const players = members.filter((member) => member.role === 'member')
  const hasCurrentQuota = (member: Member) => member.active && member.id !== 'hugo'
  const reservations = seedReservations(now, today, players.filter(hasCurrentQuota), showcase)
  const payments: Payment[] = []
  for (const member of players) {
    const plan = plans.find((item) => item.id === member.planId)!
    for (let offset = -2; offset <= 0; offset++) {
      if (offset === 0 && !hasCurrentQuota(member)) continue
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

function seedReservations(now: Date, today: string, players: Member[], showcase: boolean) {
  const firstDay = showcase ? -55 : -6
  const hours = [18, 17, 19, 18, 20]
  const reservations: Reservation[] = []
  let nextPlayer = 0
  for (let offset = firstDay; offset <= 7; offset++) {
    const date = addDays(today, offset)
    const weekday = new Date(startTime(date, 12)).getDay()
    const count = weekday === 4 || weekday === 5 ? hours.length : 3
    const createdAt = new Date(
      Math.min(now.getTime(), startTime(addDays(date, -3), 10)),
    ).toISOString()
    for (let slot = 0; slot < count; slot++) {
      // Keep recognizable bookings for the active and pending demo profiles.
      const example =
        slot === 0 && (offset === 1 ? 'alba' : showcase && offset === -35 ? 'hugo' : undefined)
      const memberId = example || players[nextPlayer++ % players.length].id
      const court = COURTS[(offset - firstDay + slot * 3) % COURTS.length]
      reservations.push({
        id: `seed-${reservations.length + 1}`,
        memberId,
        date,
        hour: hours[slot],
        court,
        status:
          showcase && offset < 0 && !example && nextPlayer % 13 === 0 ? 'cancelled' : 'confirmed',
        createdAt,
      })
    }
  }
  return reservations
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
