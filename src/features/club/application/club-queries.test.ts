import { describe, expect, it } from 'vitest'

import { clubFixture } from '../../../test/club-fixture'
import { createClubService } from './club-service'

const now = new Date(2026, 10, 17, 12)

describe('caché de lecturas por snapshot, periodo y perfil', () => {
  it('mantiene referencias estables sin cambios y las invalida tras una escritura', async () => {
    const { gateway, repository, slot } = clubFixture(now)
    const profiles = await gateway.profiles()
    const view = await gateway.view('alba')
    await repository.transact(() => undefined)
    expect(await gateway.profiles()).toBe(profiles)
    expect(await gateway.view('alba')).toBe(view)
    expect(Object.isFrozen(view.settings.weekly)).toBe(true)
    await gateway.book('alba', slot)
    expect(await gateway.view('alba')).not.toBe(view)
    expect((await gateway.view('alba')).reservations).toHaveLength(1)
    expect(view.reservations).toHaveLength(0)
  })

  it('actualiza el acceso al cambiar de mes sin escrituras ni cambio de perfil', async () => {
    const { repository } = clubFixture(now)
    let current = now
    const gateway = createClubService(repository, () => current)
    const previous = await gateway.view('alba')
    const profiles = await gateway.profiles()
    current = new Date(2026, 10, 30, 23, 59)
    expect(await gateway.view('alba')).toBe(previous)
    current = new Date(2026, 11, 1)
    const updated = await gateway.view('alba')
    expect(updated).not.toBe(previous)
    expect(updated.subscriptionActive).toBe(false)
    expect(updated.reservations).toEqual([])
    expect(await gateway.profiles()).not.toBe(profiles)
    expect((await gateway.profiles()).find(({ id }) => id === 'alba')?.subscriptionActive).toBe(
      false,
    )
  })

  it('no comparte datos privados ni permisos entre vistas en caché', async () => {
    const { gateway, slot } = clubFixture(now)
    await gateway.book('alba', slot)
    const admin = await gateway.view('admin')
    const own = await gateway.view('alba')
    const other = await gateway.view('marcos')
    expect(admin.reservations[0].memberId).toBe('alba')
    expect(own.reservations[0].memberId).toBe('alba')
    expect(other.reservations[0].memberId).toBe('occupied')
    expect(other.members.map(({ id }) => id)).toEqual(['marcos'])
    expect(other.payments.every(({ memberId }) => memberId === 'marcos')).toBe(true)
    expect(await gateway.view('admin')).toBe(admin)
    await gateway.setMemberActive('admin', 'alba', false)
    await expect(gateway.view('alba')).rejects.toThrow('desactivada')
  })
})
