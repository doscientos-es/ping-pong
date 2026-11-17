import { describe, expect, it } from 'vitest'

import { clubFixture } from '../../../test/club-fixture'
import { createLocalRepository } from '../infrastructure/local-repository'
import { createClubService } from './club-service'

const now = new Date(2026, 10, 17, 12)
const fixture = () => clubFixture(now)

describe('reservas incluidas en la suscripción', () => {
  it('permite múltiples reservas sin crear pagos ni modificar la cuota', async () => {
    const { gateway, repository, slot, seed } = fixture()
    for (let court = 1; court <= 8; court++) await gateway.book('alba', { ...slot, court })
    const state = await repository.read()
    expect(state.reservations).toHaveLength(8)
    expect(state.payments).toEqual(seed.payments)
  })

  it('serializa confirmaciones simultáneas incluso con dos repositorios', async () => {
    const { gateway, repository, slot } = fixture()
    const other = createClubService(createLocalRepository(localStorage), () => now)
    const results = await Promise.allSettled([
      gateway.book('alba', slot),
      other.book('marcos', slot),
    ])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
    expect((await repository.read()).reservations).toHaveLength(1)
  })

  it.each(['hugo', 'elena', 'admin'])('bloquea reservas para el perfil %s', async (id) => {
    const { gateway, repository, slot } = fixture()
    await expect(gateway.book(id, slot)).rejects.toThrow()
    expect((await repository.read()).reservations).toHaveLength(0)
  })

  it('rechaza cancelar reservas ajenas y libera la pista al cancelar la propia', async () => {
    const { gateway, repository, slot, seed } = fixture()
    const reservation = await gateway.book('alba', slot)
    await expect(gateway.cancel('marcos', reservation.id)).rejects.toThrow('No puedes cancelar')
    await gateway.cancel('alba', reservation.id)
    await expect(gateway.cancel('alba', reservation.id)).rejects.toThrow('ya está cancelada')
    await gateway.book('marcos', slot)
    const state = await repository.read()
    expect(state.reservations.map((item) => item.status)).toEqual(['cancelled', 'confirmed'])
    expect(state.payments).toEqual(seed.payments)
  })

  it('el administrador puede cancelar pero nadie cancela una partida comenzada', async () => {
    const { gateway, repository, slot } = fixture()
    const first = await gateway.book('alba', slot)
    await gateway.cancel('admin', first.id)
    const second = await gateway.book('alba', { ...slot, court: 2 })
    const later = createClubService(repository, () => new Date(`${slot.date}T19:00:00`))
    await expect(later.cancel('admin', second.id)).rejects.toThrow('ya han comenzado')
  })
})

describe('reservas de 60 minutos y gestión administrativa', () => {
  it('ocupa solo una hora y permite reservar el turno siguiente en la misma pista', async () => {
    const { gateway, slot, repository } = fixture()
    await gateway.book('alba', slot)
    await expect(gateway.book('marcos', slot)).rejects.toThrow('ya está reservada')
    await gateway.book('marcos', { ...slot, hour: slot.hour + 1 })
    expect((await repository.read()).reservations.map((item) => item.hour)).toEqual([18, 19])
  })

  it('crea y modifica para un socio, conserva la identidad y libera el hueco original', async () => {
    const { gateway, slot, repository, seed } = fixture()
    const first = await gateway.saveReservation('admin', { ...slot, memberId: 'alba' })
    await expect(
      gateway.saveReservation('admin', { ...slot, memberId: 'marcos' }, first.id),
    ).resolves.toMatchObject({ id: first.id, memberId: 'marcos', createdAt: first.createdAt })
    await gateway.saveReservation(
      'admin',
      { ...slot, hour: 19, court: 2, memberId: 'alba' },
      first.id,
    )
    await gateway.book('marcos', slot)
    const state = await repository.read()
    expect(state.reservations).toHaveLength(2)
    expect(state.reservations[0]).toMatchObject({ id: first.id, hour: 19, court: 2 })
    expect(state.payments).toEqual(seed.payments)
  })

  it('un conflicto no modifica ni pierde la reserva original', async () => {
    const { gateway, slot, repository } = fixture()
    const first = await gateway.book('alba', slot)
    await gateway.book('marcos', { ...slot, court: 2 })
    const before = await repository.read()
    await expect(
      gateway.saveReservation('admin', { ...slot, court: 2, memberId: 'alba' }, first.id),
    ).rejects.toThrow('ya está reservada')
    expect(await repository.read()).toEqual(before)
  })

  it('revalida horarios al editar, incluso si el horario original se ha cerrado', async () => {
    const { gateway, slot, repository, seed } = fixture()
    const first = await gateway.book('alba', slot)
    await gateway.saveSettings('admin', { ...seed.settings, closedDates: [slot.date] })
    await expect(
      gateway.saveReservation('admin', { ...slot, court: 2, memberId: 'alba' }, first.id),
    ).rejects.toThrow('cerrado')
    expect((await repository.read()).reservations[0]).toEqual(first)
    await expect(
      gateway.saveReservation('admin', { ...slot, date: '2026-11-19', memberId: 'alba' }, first.id),
    ).resolves.toMatchObject({ id: first.id, date: '2026-11-19' })
  })

  it('solo administración puede guardar; el titular debe ser un socio activo con cuota', async () => {
    const { gateway, slot, repository, seed } = fixture()
    await expect(gateway.saveReservation('alba', { ...slot, memberId: 'alba' })).rejects.toThrow(
      'administración',
    )
    for (const memberId of ['hugo', 'elena', 'admin', 'inexistente']) {
      await expect(gateway.saveReservation('admin', { ...slot, memberId })).rejects.toThrow()
    }
    await expect(
      gateway.saveReservation('admin', { ...slot, memberId: 'alba' }, 'inexistente'),
    ).rejects.toThrow('ya no se puede modificar')
    expect(await repository.read()).toEqual(seed)
  })

  it('no modifica reservas canceladas ni comenzadas', async () => {
    const { gateway, slot, repository } = fixture()
    const first = await gateway.book('alba', slot)
    await gateway.cancel('admin', first.id)
    await expect(
      gateway.saveReservation('admin', { ...slot, memberId: 'alba' }, first.id),
    ).rejects.toThrow('ya no se puede modificar')
    const next = await gateway.book('alba', slot)
    const later = createClubService(repository, () => new Date(`${slot.date}T18:30:00`))
    await expect(
      later.saveReservation('admin', { ...slot, hour: 20, memberId: 'alba' }, next.id),
    ).rejects.toThrow('ya han comenzado')
  })
})

describe('cuotas mensuales e históricos', () => {
  it('un rechazo no guarda cambios; un pago activa acceso y no se puede duplicar', async () => {
    const { gateway, repository, seed, subscription, slot } = fixture()
    await expect(
      gateway.paySubscription('hugo', { ...subscription, paymentOutcome: 'failure' }),
    ).rejects.toThrow('rechazado')
    expect(await repository.read()).toEqual(seed)
    expect((await gateway.view('hugo')).subscriptionActive).toBe(false)
    const payment = await gateway.paySubscription('hugo', subscription)
    expect(payment).toMatchObject({ period: '2026-11', method: 'demo', amountCents: 3900 })
    expect((await gateway.view('hugo')).subscriptionActive).toBe(true)
    await expect(gateway.paySubscription('hugo', subscription)).rejects.toThrow('ya está pagada')
    await expect(gateway.book('hugo', slot)).resolves.toMatchObject({ status: 'confirmed' })
  })

  it('un pago de otro periodo no activa el actual y el cambio de mes caduca el acceso', async () => {
    const { gateway, repository, subscription } = fixture()
    await gateway.paySubscription('admin', { ...subscription, period: '2026-12' })
    expect((await gateway.view('hugo')).subscriptionActive).toBe(false)
    const december = createClubService(repository, () => new Date(2026, 11, 1, 12))
    expect((await december.view('hugo')).subscriptionActive).toBe(true)
    expect((await december.view('alba')).subscriptionActive).toBe(false)
  })

  it('anular conserva documentos y reservas, bloquea acceso y permite registrar un nuevo pago', async () => {
    const { gateway, repository, subscription, slot } = fixture()
    const payment = await gateway.paySubscription('admin', subscription)
    await gateway.book('hugo', slot)
    await expect(gateway.voidPayment('alba', payment.id)).rejects.toThrow('administración')
    await gateway.voidPayment('admin', payment.id)
    expect((await gateway.view('hugo')).subscriptionActive).toBe(false)
    const replacement = await gateway.paySubscription('admin', subscription)
    expect(replacement.invoiceNumber).not.toBe(payment.invoiceNumber)
    const state = await repository.read()
    expect(state.reservations).toHaveLength(1)
    expect(state.payments.find((item) => item.id === payment.id)).toMatchObject({
      status: 'voided',
      voidedAt: now.toISOString(),
    })
  })

  it('valida importe, periodo, titular y estado de la cuenta antes de pagar', async () => {
    const { gateway, repository, subscription, seed } = fixture()
    await expect(
      gateway.paySubscription('hugo', { ...subscription, quotedCents: 1 }),
    ).rejects.toThrow('ha cambiado')
    await expect(
      gateway.paySubscription('hugo', { ...subscription, period: '2026-13' }),
    ).rejects.toThrow('periodo')
    await expect(gateway.paySubscription('alba', subscription)).rejects.toThrow(
      'propia suscripción',
    )
    await expect(
      gateway.paySubscription('admin', { ...subscription, memberId: 'elena' }),
    ).rejects.toThrow('Reactiva')
    expect(await repository.read()).toEqual(seed)
  })
})

describe('socios, permisos y configuración', () => {
  it('oculta identidades y pagos ajenos, conservando la ocupación de las pistas', async () => {
    const { gateway, slot } = fixture()
    await gateway.book('marcos', slot)
    const view = await gateway.view('alba')
    expect(view.members.map((item) => item.id)).toEqual(['alba'])
    expect(view.payments.every((item) => item.memberId === 'alba')).toBe(true)
    expect(view.reservations[0].memberId).toBe('occupied')
    const pending = await gateway.view('hugo')
    expect(pending.reservations).toEqual([])
    expect(pending.payments.every((item) => item.memberId === 'hugo')).toBe(true)
  })

  it('crea una cuenta normalizada y pendiente, sin permitir emails duplicados', async () => {
    const { gateway } = fixture()
    const input = { name: '  Nueva Socia  ', email: ' NUEVA@doscientos.example ', phone: '' }
    const member = await gateway.register(input)
    expect(member).toMatchObject({
      name: 'Nueva Socia',
      email: 'nueva@doscientos.example',
      role: 'member',
      active: true,
    })
    expect((await gateway.view(member.id)).subscriptionActive).toBe(false)
    await expect(gateway.register(input)).rejects.toThrow('Ya existe')
  })

  it('gestiona bajas y edición sin perder pagos, reservas ni datos del comprobante', async () => {
    const { gateway, repository, seed, slot } = fixture()
    await gateway.book('alba', slot)
    await expect(gateway.setMemberActive('marcos', 'alba', false)).rejects.toThrow('administración')
    await gateway.setMemberActive('admin', 'alba', false)
    await expect(gateway.view('alba')).rejects.toThrow('desactivada')
    await gateway.saveMember(
      'admin',
      { name: 'Alba Editada', email: 'editada@doscientos.example', phone: '' },
      'alba',
    )
    await gateway.setMemberActive('admin', 'alba', true)
    expect((await gateway.view('alba')).actor.name).toBe('Alba Editada')
    const state = await repository.read()
    expect(state.payments).toEqual(seed.payments)
    expect(state.reservations).toHaveLength(1)
  })

  it('rechaza un borrador desactualizado dentro de la transacción sin perder los cambios nuevos', async () => {
    const { gateway, repository, seed } = fixture()
    const previous = structuredClone(seed.settings)
    await gateway.saveSettings(
      'admin',
      { ...previous, plans: [{ ...previous.plans[0], priceCents: 4200 }] },
      previous,
    )
    await expect(
      gateway.saveSettings(
        'admin',
        { ...previous, plans: [{ ...previous.plans[0], priceCents: 4100 }] },
        previous,
      ),
    ).rejects.toThrow('otra pestaña')
    expect((await repository.read()).settings.plans[0].priceCents).toBe(4200)
  })

  it('revalida cierres y precios sin borrar reservas ni actualizar pagos anteriores', async () => {
    const { gateway, repository, seed, slot, subscription } = fixture()
    await gateway.book('alba', slot)
    const settings = {
      ...seed.settings,
      plans: [{ ...seed.settings.plans[0], priceCents: 4500 }],
      closedDates: [slot.date],
    }
    await expect(gateway.saveSettings('alba', settings)).rejects.toThrow('administración')
    await gateway.saveSettings('admin', settings)
    await expect(gateway.book('alba', { ...slot, court: 2 })).rejects.toThrow('cerrado')
    await expect(gateway.paySubscription('hugo', subscription)).rejects.toThrow('ha cambiado')
    const state = await repository.read()
    expect(state.reservations).toHaveLength(1)
    expect(state.payments).toEqual(seed.payments)
  })
})
