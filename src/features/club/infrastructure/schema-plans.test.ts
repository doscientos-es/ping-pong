import { describe, expect, it } from 'vitest'

import { createClubService } from '../application/club-service'
import { createLocalRepository, DATABASE_KEY } from './local-repository'
import { createSeed } from './seed'

describe('migración local de cuota única a catálogo', () => {
  it('conserva el precio configurado, usuarios, reservas y documentos sin reescribir al leer', async () => {
    const seed = createSeed()
    const { plans: _plans, ...schedule } = seed.settings
    const legacy = {
      ...seed,
      settings: { ...schedule, priceCents: 4550 },
      members: seed.members.map(({ planId: _planId, ...member }) => member),
      payments: seed.payments.map(({ plan: _plan, ...payment }) => payment),
    }
    const raw = JSON.stringify(legacy)
    localStorage.setItem(DATABASE_KEY, raw)
    const repository = createLocalRepository(localStorage)
    const state = await repository.read()
    expect(state.settings.plans).toEqual([
      { id: 'standard', name: 'Cuota general', priceCents: 4550 },
    ])
    expect(state.members.every((member) => member.planId === 'standard')).toBe(true)
    expect(state.reservations).toEqual(legacy.reservations)
    expect(state.payments).toEqual(legacy.payments)
    expect(state.credentials).toEqual(legacy.credentials)
    expect(state.accounting).toEqual(legacy.accounting)
    expect(localStorage.getItem(DATABASE_KEY)).toBe(raw)
    await createClubService(repository).saveMember('admin', {
      name: 'Nuevo socio',
      email: 'nuevo@doscientos.example',
      phone: '',
      planId: 'standard',
    })
    const restored = await createLocalRepository(localStorage).read()
    expect(restored.settings).toEqual(state.settings)
    expect(restored.payments).toEqual(legacy.payments)
    expect(restored.members.at(-1)?.planId).toBe('standard')
    expect(restored.settings).not.toHaveProperty('priceCents')
  })

  it.each(['missing', undefined])(
    'rechaza referencias nuevas inválidas sin reiniciar los datos (%s)',
    async (planId) => {
      const seed = createSeed()
      const raw = JSON.stringify({
        ...seed,
        members: seed.members.map((member) => ({ ...member, planId })),
      })
      localStorage.setItem(DATABASE_KEY, raw)
      await expect(createLocalRepository(localStorage).read()).rejects.toThrow('cuota')
      expect(localStorage.getItem(DATABASE_KEY)).toBe(raw)
    },
  )
})
