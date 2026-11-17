import { describe, expect, it } from 'vitest'

import { clubFixture } from '../../../test/club-fixture'
import { normalizeDni } from '../domain/billing'
import { createLocalRepository, DATABASE_KEY } from '../infrastructure/local-repository'

const issuer = {
  legalName: 'Club de Prueba SL',
  nif: 'B12345674',
  address: 'Calle de Prueba 1, 08001 Barcelona, España',
}

describe('datos fiscales y persistencia compatible', () => {
  it('lee datos anteriores sin inventar datos fiscales ni reescribir el almacenamiento', async () => {
    const { seed } = clubFixture()
    const raw = localStorage.getItem(DATABASE_KEY)
    const restored = await createLocalRepository(localStorage).read()
    expect(restored).toEqual(seed)
    expect(restored.settings.issuer).toBeUndefined()
    expect(restored.members[0].dni).toBeUndefined()
    expect(restored.payments[0].issuer).toBeUndefined()
    expect(localStorage.getItem(DATABASE_KEY)).toBe(raw)
  })

  it('persiste emisor/destinatario e IVA por pago sin alterar el historial al editar después', async () => {
    const { gateway, repository, seed, subscription } = clubFixture()
    const member = seed.members.find((item) => item.id === 'hugo')!
    await gateway.saveSettings('admin', { ...seed.settings, issuer })
    await gateway.saveMember(
      'admin',
      { ...member, dni: '12345678-z', address: '  Calle Ficticia 2, 28001 Madrid, España  ' },
      member.id,
    )
    await repository.transact((state) => {
      state.accounting.subscriptionVatBps = 2100
    })
    const payment = await gateway.paySubscription('admin', subscription)
    expect(payment).toMatchObject({
      issuer,
      customer: {
        name: member.name,
        email: member.email,
        dni: '12345678Z',
        address: 'Calle Ficticia 2, 28001 Madrid, España',
      },
      vatBps: 2100,
    })
    await gateway.saveSettings('admin', {
      ...seed.settings,
      issuer: { ...issuer, legalName: 'Otro emisor SL', address: 'Otra dirección' },
    })
    await gateway.saveMember(
      'admin',
      { ...member, dni: 'X1234567L', address: 'Otra calle' },
      member.id,
    )
    await repository.transact((state) => {
      state.accounting.subscriptionVatBps = 1000
    })
    const restored = await createLocalRepository(localStorage).read()
    expect(restored.payments.find((item) => item.id === payment.id)).toEqual(payment)
    expect(restored.payments.slice(0, seed.payments.length)).toEqual(seed.payments)
    expect(restored.members.find((item) => item.id === member.id)?.dni).toBe('X1234567L')
  })

  it('permite altas nuevas con datos fiscales y no los borra en ediciones antiguas que los omiten', async () => {
    const { gateway, repository } = clubFixture()
    const member = await gateway.saveMember('admin', {
      name: 'Socio Fiscal',
      email: 'fiscal@doscientos.example',
      phone: '',
      dni: '12345678Z',
      address: 'Calle Ficticia 3',
    })
    await gateway.saveMember(
      'admin',
      { name: member.name, email: member.email, phone: '+34 600000000' },
      member.id,
    )
    expect((await repository.read()).members.find((item) => item.id === member.id)).toMatchObject({
      dni: '12345678Z',
      address: 'Calle Ficticia 3',
    })
  })

  it('rechaza datos inválidos sin escrituras parciales', async () => {
    const { gateway, seed } = clubFixture()
    const raw = localStorage.getItem(DATABASE_KEY)
    await expect(
      gateway.saveSettings('admin', { ...seed.settings, issuer: { ...issuer, nif: '' } }),
    ).rejects.toThrow('Completa')
    await expect(
      gateway.saveSettings('admin', { ...seed.settings, issuer: { ...issuer, nif: 'INVALIDO' } }),
    ).rejects.toThrow('NIF')
    const member = seed.members.find((item) => item.id === 'hugo')!
    await expect(
      gateway.saveMember('admin', { ...member, dni: '12345678A' }, member.id),
    ).rejects.toThrow('letra')
    await expect(
      gateway.saveMember('admin', { ...member, address: 'x'.repeat(301) }, member.id),
    ).rejects.toThrow('dirección')
    expect(localStorage.getItem(DATABASE_KEY)).toBe(raw)
  })

  it('protege el emisor por rol y detecta conflictos entre cambios fiscales', async () => {
    const { gateway, repository, seed } = clubFixture()
    await expect(gateway.saveSettings('alba', { ...seed.settings, issuer })).rejects.toThrow(
      'administración',
    )
    await gateway.saveSettings('admin', { ...seed.settings, issuer }, seed.settings)
    await expect(
      gateway.saveSettings(
        'admin',
        { ...seed.settings, issuer: { ...issuer, nif: 'B87654321' } },
        seed.settings,
      ),
    ).rejects.toThrow('otra pestaña')
    expect((await repository.read()).settings.issuer).toEqual(issuer)
  })

  it('normaliza DNI/NIE y admite dejar los nuevos datos opcionales vacíos', () => {
    expect(normalizeDni(' 12345678-z ')).toBe('12345678Z')
    expect(normalizeDni('x-1234567-l')).toBe('X1234567L')
    expect(normalizeDni('')).toBe('')
    expect(() => normalizeDni('dni inventado')).toThrow('válido')
  })
})
