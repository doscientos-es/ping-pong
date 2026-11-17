import { hourLabel } from '../../../shared/format'
import {
  COURTS,
  WEEKDAYS,
  type ClubSettings,
  type Member,
  type Reservation,
} from '../../club/domain/model'

export interface CountItem {
  label: string
  value: number
}

export function reservationReport(
  reservations: Reservation[],
  members: Member[],
  settings: ClubSettings,
  from: string,
  to: string,
  court: string,
  memberId: string,
) {
  const selected = reservations.filter(
    (reservation) =>
      reservation.date >= from &&
      reservation.date <= to &&
      (court === 'all' || reservation.court === Number(court)) &&
      (memberId === 'all' || reservation.memberId === memberId),
  )
  const confirmed = selected.filter((reservation) => reservation.status === 'confirmed')
  const courtCounts = new Map<number, number>()
  const dayCounts = new Map<number, number>()
  const hourCounts = new Map<number, number>()
  const slotCounts = new Map<string, number>()
  const memberCounts = new Map<string, number>()
  for (const reservation of confirmed) {
    const day = new Date(`${reservation.date}T12:00:00`).getDay()
    courtCounts.set(reservation.court, (courtCounts.get(reservation.court) ?? 0) + 1)
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1)
    hourCounts.set(reservation.hour, (hourCounts.get(reservation.hour) ?? 0) + 1)
    const slot = `${day}:${reservation.hour}`
    slotCounts.set(slot, (slotCounts.get(slot) ?? 0) + 1)
    memberCounts.set(reservation.memberId, (memberCounts.get(reservation.memberId) ?? 0) + 1)
  }
  const hours = new Set(hourCounts.keys())
  for (const day of settings.weekly) {
    for (const interval of day.intervals) {
      for (let hour = interval.start; hour < interval.end; hour++) hours.add(hour)
    }
  }
  const names = new Map(members.map((member) => [member.id, member.name]))
  return {
    total: confirmed.length,
    cancelled: selected.length - confirmed.length,
    uniqueMembers: memberCounts.size,
    courts: COURTS.filter((item) => court === 'all' || item === Number(court)).map((item) => ({
      label: `Pista ${item}`,
      value: courtCounts.get(item) ?? 0,
    })),
    days: [1, 2, 3, 4, 5, 6, 0].map((day) => ({
      label: WEEKDAYS[day],
      value: dayCounts.get(day) ?? 0,
    })),
    hours: [...hours]
      .sort((a, b) => a - b)
      .map((hour) => ({
        label: `${hourLabel(hour)}–${hourLabel(hour + 1)}`,
        value: hourCounts.get(hour) ?? 0,
      })),
    slots: [...slotCounts].map(([slot, value]) => {
      const [day, hour] = slot.split(':').map(Number)
      return { label: `${WEEKDAYS[day]} ${hourLabel(hour)}–${hourLabel(hour + 1)}`, value }
    }),
    people: [...memberCounts]
      .map(([id, value]) => ({ label: names.get(id) ?? 'Socio no disponible', value }))
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'es')),
  }
}

export function leaders(items: CountItem[]) {
  const max = Math.max(0, ...items.map((item) => item.value))
  return max
    ? { value: max, labels: items.filter((item) => item.value === max).map((item) => item.label) }
    : null
}
