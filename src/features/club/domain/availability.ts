import type { ClubView, Reservation } from './model'
import { availableCourts } from './rules'

/** Index occupancy once per data/clock revision, not once per day, hour and court. */
export function createAvailability(
  state: Pick<ClubView, 'settings' | 'reservations'>,
  now: Date,
  excludeId?: string,
) {
  const slots = new Map<string, Reservation[]>()
  const results = new Map<string, number[]>()
  for (const reservation of state.reservations) {
    if (reservation.status !== 'confirmed' || reservation.id === excludeId) continue
    const key = `${reservation.date}|${reservation.hour}`
    const slot = slots.get(key)
    if (slot) slot.push(reservation)
    else slots.set(key, [reservation])
  }
  return (date: string, hour: number): number[] => {
    const key = `${date}|${hour}`
    let result = results.get(key)
    if (!result) {
      result = availableCourts(
        { settings: state.settings, reservations: slots.get(key) ?? [] },
        date,
        hour,
        now,
      )
      results.set(key, result)
    }
    return result
  }
}
