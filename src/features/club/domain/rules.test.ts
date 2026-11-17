import { describe, expect, it } from 'vitest'

import { createSeed } from '../infrastructure/seed'
import {
  addDays,
  availableCourts,
  dateKey,
  hoursFor,
  isDate,
  validateSettings,
  validateSlot,
} from './rules'

const now = new Date(2026, 10, 17, 12)

describe('fechas civiles y horarios', () => {
  it('maneja cambios de mes, año y años bisiestos sin desplazamientos UTC', () => {
    expect(dateKey(now)).toBe('2026-11-17')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(isDate('2026-02-29')).toBe(false)
    expect(isDate('2024-02-29')).toBe(true)
  })

  it('admite franjas partidas, un día cerrado y cierres excepcionales', () => {
    const { settings } = createSeed(now)
    settings.weekly[2].intervals = [
      { start: 8, end: 10 },
      { start: 18, end: 20 },
    ]
    expect(hoursFor(settings, '2026-11-17')).toEqual([8, 9, 18, 19])
    settings.weekly[2].intervals = []
    expect(hoursFor(settings, '2026-11-17')).toEqual([])
    settings.closedDates = ['2026-11-18']
    expect(hoursFor(settings, '2026-11-18')).toEqual([])
  })

  it('rechaza franjas solapadas, incompletas, invertidas o fuera de rango', () => {
    const { settings } = createSeed(now)
    settings.weekly[2].intervals = [
      { start: 8, end: 12 },
      { start: 11, end: 14 },
    ]
    expect(() => validateSettings(settings)).toThrow('solapadas')
    for (const interval of [
      { start: 8.5, end: 12 },
      { start: 12, end: 8 },
      { start: 8, end: 25 },
    ]) {
      settings.weekly[2].intervals = [interval]
      expect(() => validateSettings(settings)).toThrow('horas completas')
    }
    settings.weekly.pop()
    expect(() => validateSettings(settings)).toThrow('siete días')
  })

  it.each([
    ['2026-11-17', 12, 1],
    ['2026-11-18', 7, 1],
    ['2026-11-18', 22, 1],
    ['2026-11-18', 18.5, 1],
    ['2026-11-18', 18, 9],
    ['2026-02-30', 18, 1],
  ])('no reserva una franja inválida: %s a las %s en pista %s', (date, hour, court) => {
    const state = createSeed(now)
    expect(() => validateSlot(state, date, hour, court, now)).toThrow()
  })

  it('la disponibilidad excluye ocupadas y cierres, no canceladas ni el turno siguiente', () => {
    const state = createSeed(now)
    state.reservations = [
      {
        id: 'test',
        memberId: 'alba',
        date: '2026-11-18',
        hour: 18,
        court: 1,
        status: 'confirmed',
        createdAt: now.toISOString(),
      },
    ]
    expect(availableCourts(state, '2026-11-18', 18, now)).toEqual([2, 3, 4, 5, 6, 7, 8])
    expect(availableCourts(state, '2026-11-18', 18, now, 'test')).toHaveLength(8)
    expect(availableCourts(state, '2026-11-18', 19, now)).toHaveLength(8)
    expect(availableCourts(state, '2026-11-17', 12, now)).toEqual([])
    state.reservations[0].status = 'cancelled'
    expect(availableCourts(state, '2026-11-18', 18, now)).toHaveLength(8)
    state.settings.closedDates = ['2026-11-18']
    expect(availableCourts(state, '2026-11-18', 18, now)).toEqual([])
  })
})
