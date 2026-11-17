import { normalizeAddress, normalizeDni, normalizeIssuer } from './billing'
import {
  COURTS,
  type ClubSettings,
  type ClubState,
  type Member,
  type MemberInput,
  type Reservation,
} from './model'
import { validatePlans } from './plans'

export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function addDays(date: string, amount: number): string {
  const value = new Date(`${date}T12:00:00`)
  value.setDate(value.getDate() + amount)
  return dateKey(value)
}

export function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && dateKey(new Date(`${value}T12:00:00`)) === value
}

export function startTime(date: string, hour: number): number {
  return new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`).getTime()
}

export const periodKey = (now = new Date()) => dateKey(now).slice(0, 7)

export function hasSubscription(
  state: Pick<ClubState, 'payments'>,
  memberId: string,
  now = new Date(),
) {
  return state.payments.some(
    (payment) =>
      payment.memberId === memberId &&
      payment.period === periodKey(now) &&
      payment.status === 'paid',
  )
}

export function requireSubscription(state: ClubState, memberId: string, now: Date) {
  if (!hasSubscription(state, memberId, now))
    throw new Error('Tu cuota de este mes está pendiente. Activa tu suscripción para reservar.')
}

export function hoursFor(settings: ClubSettings, date: string): number[] {
  if (!isDate(date) || settings.closedDates.includes(date)) return []
  const day = new Date(`${date}T12:00:00`).getDay()
  return (settings.weekly.find((item) => item.day === day)?.intervals ?? [])
    .flatMap(({ start, end }) => Array.from({ length: end - start }, (_, i) => start + i))
    .sort((a, b) => a - b)
}

export function requireActor(state: ClubState, id: string, admin = false): Member {
  const actor = state.members.find((member) => member.id === id)
  if (!actor?.active) throw new Error('Esta cuenta está desactivada. Contacta con el club.')
  if (admin && actor.role !== 'admin') throw new Error('Esta acción es solo para administración.')
  return actor
}

/** A reservation occupies [hour, hour + 1); the next whole hour is free. */
export function availableCourts(
  state: { settings: ClubSettings; reservations: Reservation[] },
  date: string,
  hour: number,
  now: Date,
  excludeId?: string,
): number[] {
  if (startTime(date, hour) <= now.getTime() || !hoursFor(state.settings, date).includes(hour))
    return []
  const occupied = new Set<number>()
  for (const item of state.reservations) {
    if (
      item.id !== excludeId &&
      item.status === 'confirmed' &&
      item.date === date &&
      item.hour === hour
    )
      occupied.add(item.court)
  }
  return COURTS.filter((court) => !occupied.has(court))
}

export function validateSlot(
  state: ClubState,
  date: string,
  hour: number,
  court: number,
  now: Date,
  excludeId?: string,
) {
  if (!COURTS.includes(court) || !Number.isInteger(hour) || !isDate(date)) {
    throw new Error('La pista o la fecha no son válidas.')
  }
  if (startTime(date, hour) <= now.getTime()) throw new Error('Esta franja ya ha comenzado.')
  if (!hoursFor(state.settings, date).includes(hour))
    throw new Error('El club está cerrado en esta franja.')
  if (!availableCourts(state, date, hour, now, excludeId).includes(court)) {
    throw new Error('Alguien se te ha adelantado. Esta pista ya está reservada; elige otra franja.')
  }
}

export function validateMember(
  input: MemberInput,
  state: ClubState,
  excludeId?: string,
): MemberInput {
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  const phone = input.phone.trim()
  if (name.length < 2 || name.length > 80)
    throw new Error('Introduce un nombre de entre 2 y 80 caracteres.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150)
    throw new Error('Introduce un email válido.')
  if (phone && !/^[+\d\s()-]{6,25}$/.test(phone)) throw new Error('Introduce un teléfono válido.')
  if (
    state.members.some((member) => member.id !== excludeId && member.email.toLowerCase() === email)
  ) {
    throw new Error('Ya existe una cuenta con este email.')
  }
  return {
    name,
    email,
    phone,
    ...(input.dni !== undefined && { dni: normalizeDni(input.dni) }),
    ...(input.address !== undefined && { address: normalizeAddress(input.address) }),
  }
}

export function validateSettings(settings: ClubSettings) {
  validatePlans(settings.plans)
  normalizeIssuer(settings.issuer)
  if (settings.weekly.length !== 7 || new Set(settings.weekly.map((item) => item.day)).size !== 7) {
    throw new Error('Configura los siete días de la semana.')
  }
  for (const { day, intervals } of settings.weekly) {
    if (!Number.isInteger(day) || day < 0 || day > 6) throw new Error('Día de la semana no válido.')
    const occupied = new Set<number>()
    for (const { start, end } of intervals) {
      if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start < 0 ||
        end > 24 ||
        start >= end
      ) {
        throw new Error(
          'Las franjas deben ser horas completas entre 00:00 y 24:00, con inicio anterior al fin.',
        )
      }
      for (let hour = start; hour < end; hour++) {
        if (occupied.has(hour)) throw new Error('Hay franjas de apertura solapadas.')
        occupied.add(hour)
      }
    }
  }
  if (settings.closedDates.some((date) => !isDate(date)))
    throw new Error('Hay una fecha de cierre no válida.')
}
