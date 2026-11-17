import { describe, expect, it } from 'vitest'

import { createSeed } from '../infrastructure/seed'
import { createAvailability } from './availability'
import { availableCourts } from './rules'

const now = new Date(2026, 10, 17, 12)

describe('disponibilidad indexada', () => {
  it('conserva las reglas de ocupación, cancelaciones, cierres y franjas pasadas', () => {
    const state = createSeed(now)
    state.reservations = Array.from({ length: 8 }, (_, index) => ({
      id: `reservation-${index}`,
      memberId: 'alba',
      date: '2026-11-18',
      hour: 18,
      court: index + 1,
      status: index === 7 ? 'cancelled' : 'confirmed',
      createdAt: now.toISOString(),
    }))
    state.settings.closedDates.push('2026-11-19')
    const courtsFor = createAvailability(state, now)
    expect(courtsFor('2026-11-18', 18)).toEqual([8])
    for (const date of ['2026-11-17', '2026-11-18', '2026-11-19']) {
      for (const hour of [7, 12, 18, 19, 22]) {
        expect(courtsFor(date, hour)).toEqual(availableCourts(state, date, hour, now))
        expect(courtsFor(date, hour)).toBe(courtsFor(date, hour))
      }
    }
    const editing = createAvailability(state, now, 'reservation-0')
    expect(editing('2026-11-18', 18)).toEqual([1, 8])
    expect(courtsFor('2026-11-18', 18)).toEqual([8])
  })
})
