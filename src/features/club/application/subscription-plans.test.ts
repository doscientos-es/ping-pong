import { describe, expect, it } from 'vitest'

import { clubFixture } from '../../../test/club-fixture'
import type { ClubPlan } from '../domain/model'

const second: ClubPlan = { id: 'flexible', name: 'Cuota flexible', priceCents: 2550 }
const input = { name: 'Nuevo socio', email: 'nuevo@doscientos.example', phone: '' }

async function fixture() {
  const context = clubFixture()
  await context.gateway.saveSettings('admin', {
    ...context.seed.settings,
    plans: [...context.seed.settings.plans, second],
  })
  return context
}

describe('varias cuotas mensuales sin límites de reservas', () => {
  it('expone solo el catálogo público, inmutable y estable, sin exigir sesión', async () => {
    const { gateway } = await fixture()
    const plans = await gateway.subscriptionPlans()
    expect(plans).toHaveLength(2)
    expect(plans[1]).toEqual(second)
    expect(await gateway.subscriptionPlans()).toBe(plans)
    expect(Object.isFrozen(plans[1])).toBe(true)
  })

  it('asigna la cuota elegida en el alta pública, invitación y alta administrativa', async () => {
    const { gateway, repository } = await fixture()
    const signup = await gateway.signup({ ...input, planId: second.id }, crypto.randomUUID())
    const invited = await gateway.inviteUser('admin', {
      ...input,
      email: 'invitado@doscientos.example',
      planId: second.id,
      role: 'member',
      temporaryPassword: crypto.randomUUID(),
    })
    const saved = await gateway.saveMember('admin', {
      ...input,
      email: 'manual@doscientos.example',
      planId: 'standard',
    })
    expect(signup.member.planId).toBe(second.id)
    expect(invited.planId).toBe(second.id)
    expect(saved.planId).toBe('standard')
    expect(
      (await repository.read()).members.filter((member) => member.planId === second.id),
    ).toHaveLength(2)
  })

  it('rechaza elecciones inexistentes o ausentes con varias cuotas, sin altas parciales', async () => {
    const { gateway, repository } = await fixture()
    const before = await repository.read()
    await expect(
      gateway.signup({ ...input, planId: 'missing' }, crypto.randomUUID()),
    ).rejects.toThrow('cuota')
    await expect(gateway.register(input)).rejects.toThrow('cuota')
    await expect(gateway.saveMember('admin', { ...input, planId: 'missing' })).rejects.toThrow(
      'cuota',
    )
    await expect(
      gateway.inviteUser('admin', {
        ...input,
        planId: 'missing',
        role: 'member',
        temporaryPassword: crypto.randomUUID(),
      }),
    ).rejects.toThrow('cuota')
    expect(await repository.read()).toBe(before)
  })

  it('cobra la cuota asignada, conserva su nombre e importe históricos y no restringe reservas', async () => {
    const { gateway, repository, subscription, slot } = await fixture()
    const hugo = (await repository.read()).members.find((member) => member.id === 'hugo')!
    await gateway.saveMember('admin', { ...hugo, planId: second.id }, hugo.id)
    await expect(gateway.paySubscription('hugo', subscription)).rejects.toThrow('ha cambiado')
    const payment = await gateway.paySubscription('hugo', {
      ...subscription,
      planId: second.id,
      quotedCents: second.priceCents,
    })
    expect(payment).toMatchObject({ amountCents: 2550, plan: { id: second.id, name: second.name } })
    const settings = (await repository.read()).settings
    await gateway.saveSettings('admin', {
      ...settings,
      plans: settings.plans.map((plan) =>
        plan.id === second.id ? { ...plan, name: 'Renombrada', priceCents: 3000 } : plan,
      ),
    })
    expect((await repository.read()).payments.find((item) => item.id === payment.id)).toEqual(
      payment,
    )
    await gateway.book('hugo', slot)
    await gateway.book('hugo', { ...slot, hour: 19 })
    expect((await gateway.view('hugo')).subscriptionActive).toBe(true)
    expect((await repository.read()).reservations).toHaveLength(2)
  })

  it('detecta cambios de cuota durante el pago incluso con igual precio', async () => {
    const { gateway, repository, subscription } = await fixture()
    const settings = (await repository.read()).settings
    await gateway.saveSettings('admin', {
      ...settings,
      plans: [settings.plans[0], { ...second, priceCents: 3900 }],
    })
    const hugo = (await repository.read()).members.find((member) => member.id === 'hugo')!
    await gateway.saveMember('admin', { ...hugo, planId: second.id }, hugo.id)
    await expect(
      gateway.paySubscription('hugo', { ...subscription, planId: 'standard' }),
    ).rejects.toThrow('ha cambiado')
  })

  it('no permite borrar cuotas asignadas ni guardar un catálogo obsoleto', async () => {
    const { gateway, repository } = await fixture()
    const settings = (await repository.read()).settings
    await expect(gateway.saveSettings('admin', { ...settings, plans: [second] })).rejects.toThrow(
      'asignada',
    )
    await gateway.saveSettings(
      'admin',
      { ...settings, plans: settings.plans.map((plan) => ({ ...plan, priceCents: 4000 })) },
      settings,
    )
    await expect(gateway.saveSettings('admin', settings, settings)).rejects.toThrow('otra pestaña')
    const updated = (await repository.read()).settings
    await gateway.saveSettings('admin', { ...updated, plans: [updated.plans[0]] })
    expect(await gateway.subscriptionPlans()).toHaveLength(1)
  })

  it('permite reasignar todas las cuentas antes de eliminar una cuota sin alterar su historial', async () => {
    const { gateway, repository } = await fixture()
    const before = await repository.read()
    await expect(gateway.setMemberPlan('alba', 'alba', second.id)).rejects.toThrow('administración')
    await expect(gateway.setMemberPlan('admin', 'missing', second.id)).rejects.toThrow('cuenta')
    await expect(gateway.setMemberPlan('admin', 'alba', 'missing')).rejects.toThrow('cuota')
    expect(await repository.read()).toBe(before)
    for (const member of before.members) await gateway.setMemberPlan('admin', member.id, second.id)
    await gateway.saveSettings('admin', { ...before.settings, plans: [second] })
    const after = await repository.read()
    expect(after.members.every((member) => member.planId === second.id)).toBe(true)
    expect(after.payments).toEqual(before.payments)
    expect((await gateway.view('alba')).subscriptionActive).toBe(true)
    expect((await gateway.view('admin')).subscriptionActive).toBe(true)
  })

  it.each([
    { plans: [], error: 'al menos una cuota' },
    { plans: [second, second], error: 'identificadores únicos' },
    {
      plans: [second, { ...second, id: 'another', name: ' CUOTA FLEXIBLE ' }],
      error: 'nombre único',
    },
    { plans: [{ ...second, name: '' }], error: 'nombre único' },
    { plans: [{ ...second, priceCents: 99 }], error: 'entre 1 €' },
    { plans: [{ ...second, priceCents: 100001 }], error: 'entre 1 €' },
    { plans: [{ ...second, priceCents: 100.5 }], error: 'entre 1 €' },
  ])('valida el catálogo y aplica permisos en el servicio ($error)', async ({ plans, error }) => {
    const { gateway, repository, seed } = clubFixture()
    const before = await repository.read()
    const settings = { ...seed.settings, plans }
    await expect(gateway.saveSettings('alba', settings)).rejects.toThrow('administración')
    await expect(gateway.saveSettings('admin', settings)).rejects.toThrow(error)
    expect(await repository.read()).toBe(before)
  })
})
