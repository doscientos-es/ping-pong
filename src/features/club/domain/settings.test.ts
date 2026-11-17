import { describe, expect, it } from 'vitest'

import type { ClubSettings } from './model'
import { sameSettings } from './settings'

const settings: ClubSettings = {
  plans: [{ id: 'standard', name: 'Cuota general', priceCents: 3900 }],
  closedDates: ['2026-12-26', '2026-12-25'],
  weekly: [
    {
      day: 2,
      intervals: [
        { start: 16, end: 22 },
        { start: 8, end: 12 },
      ],
    },
    { day: 1, intervals: [{ start: 8, end: 22 }] },
  ],
}

describe('comparación de ajustes para detectar conflictos', () => {
  it('ignora el orden de claves, días, franjas y cierres sin modificar los originales', () => {
    const before = structuredClone(settings)
    const reordered = {
      weekly: [...settings.weekly].reverse().map(({ day, intervals }) => ({
        intervals: [...intervals].reverse().map(({ start, end }) => ({ end, start })),
        day,
      })),
      closedDates: [...settings.closedDates].reverse(),
      plans: settings.plans.map(({ id, name, priceCents }) => ({ priceCents, name, id })),
    }
    expect(sameSettings(settings, reordered)).toBe(true)
    expect(settings).toEqual(before)
  })

  it.each([
    { ...settings, plans: [{ ...settings.plans[0], priceCents: 4200 }] },
    { ...settings, plans: [{ ...settings.plans[0], name: 'Otra cuota' }] },
    { ...settings, closedDates: [] },
    { ...settings, issuer: { legalName: 'Club', nif: 'B12345674', address: 'Calle 1' } },
    { ...settings, weekly: [{ day: 1, intervals: [{ start: 9, end: 22 }] }] },
  ])('detecta cambios reales de precio, cierres o disponibilidad', (changed) => {
    expect(sameSettings(settings, changed)).toBe(false)
  })

  it('compara cada dato fiscal y trata el emisor vacío como no configurado', () => {
    const issuer = { legalName: 'Club', nif: 'B12345674', address: 'Calle 1' }
    const base = { ...settings, issuer }
    for (const key of ['legalName', 'nif', 'address'] as const) {
      expect(sameSettings(base, { ...settings, issuer: { ...issuer, [key]: 'otro' } })).toBe(false)
    }
    expect(
      sameSettings(settings, { ...settings, issuer: { legalName: '', nif: '', address: '' } }),
    ).toBe(true)
  })
})
