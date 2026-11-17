import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { money } from '../shared/format'
import { clubFixture } from '../test/club-fixture'
import { App } from './app'

vi.mock('./install-button', () => ({ InstallButton: () => null }))
const flexible = { id: 'flexible', name: 'Cuota flexible', priceCents: 2550 }
beforeAll(async () => {
  await import('../features/accounting/accounting-page')
})

describe('catálogo de cuotas y selección en altas con repositorio real', () => {
  it('calcula la previsión contable sumando las cuotas de los socios activos', async () => {
    const { gateway, repository, seed } = clubFixture()
    await gateway.saveSettings('admin', {
      ...seed.settings,
      plans: [...seed.settings.plans, flexible],
    })
    const hugo = seed.members.find((member) => member.id === 'hugo')!
    await gateway.saveMember('admin', { ...hugo, planId: flexible.id }, hugo.id)
    localStorage.setItem('spin-club:profile', 'admin')
    window.history.replaceState(null, '', '/contabilidad')
    render(<App gateway={gateway} />)
    const forecast = await screen.findByText('Previsión mensual bruta')
    expect(forecast.nextElementSibling?.textContent).toBe(money(7 * 3900 + flexible.priceCents))
    expect((await repository.read()).members.find((member) => member.id === hugo.id)?.planId).toBe(
      flexible.id,
    )
  })

  it('configura varias cuotas, conserva el borrador y permite elegir al crear un socio', async () => {
    const { gateway, repository } = clubFixture()
    localStorage.setItem('spin-club:profile', 'admin')
    window.history.replaceState(null, '', '/configuracion')
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    await user.click(await screen.findByRole('tab', { name: 'Cuotas' }))
    expect(screen.getByRole('button', { name: 'Eliminar cuota Cuota general' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Añadir cuota' }))
    const second = screen.getByRole('group', { name: 'Cuota 2' })
    fireEvent.change(within(second).getByLabelText('Nombre de la cuota'), {
      target: { value: flexible.name },
    })
    fireEvent.change(within(second).getByLabelText('Cuota mensual (€)'), {
      target: { value: '25.50' },
    })
    await user.click(screen.getByRole('tab', { name: 'Horarios' }))
    await user.click(screen.getByRole('tab', { name: 'Cuotas' }))
    expect(within(second).getByLabelText('Cuota mensual (€)')).toHaveValue(25.5)
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled(),
    )
    const plans = (await repository.read()).settings.plans
    expect(plans[1]).toMatchObject({ name: flexible.name, priceCents: flexible.priceCents })
    await user.click(screen.getAllByRole('link', { name: 'Socios' })[0])
    await user.click(await screen.findByRole('button', { name: 'Nuevo socio' }))
    const dialog = screen.getByRole('dialog', { name: 'Nuevo socio' })
    await user.type(within(dialog).getByLabelText('Nombre y apellidos'), 'Socio flexible')
    await user.type(within(dialog).getByLabelText('Email'), 'flexible@doscientos.example')
    await user.selectOptions(within(dialog).getByLabelText('Cuota del club'), plans[1].id)
    await user.click(within(dialog).getByRole('button', { name: 'Crear socio' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const member = (await repository.read()).members.find(
      (item) => item.email === 'flexible@doscientos.example',
    )!
    expect(member.planId).toBe(plans[1].id)
    await user.click(screen.getByRole('link', { name: /Socio flexible/ }))
    expect(screen.getByLabelText('Cuota del club')).toHaveValue(plans[1].id)
  })

  it('elige cuota en una invitación y persiste la asignación', async () => {
    const { gateway, repository, seed } = clubFixture()
    await gateway.saveSettings('admin', {
      ...seed.settings,
      plans: [...seed.settings.plans, flexible],
    })
    localStorage.setItem('spin-club:profile', 'admin')
    window.history.replaceState(null, '', '/socios')
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    await user.click(await screen.findByRole('button', { name: 'Invitar usuario' }))
    const dialog = screen.getByRole('dialog', { name: 'Invitar usuario' })
    await user.type(within(dialog).getByLabelText('Nombre y apellidos'), 'Cuenta invitada')
    await user.type(within(dialog).getByLabelText('Email'), 'invitada@doscientos.example')
    fireEvent.change(within(dialog).getByLabelText('DNI / NIE'), { target: { value: '12345678Z' } })
    fireEvent.change(within(dialog).getByLabelText('Dirección postal'), {
      target: { value: 'Calle Invitada 1' },
    })
    await user.selectOptions(within(dialog).getByLabelText('Cuota del club'), flexible.id)
    await user.type(within(dialog).getByLabelText('Contraseña temporal'), crypto.randomUUID())
    await user.click(within(dialog).getByRole('button', { name: 'Crear invitación local' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(
      (await repository.read()).members.find((member) => member.name === 'Cuenta invitada')?.planId,
    ).toBe(flexible.id)
    expect(
      (await repository.read()).members.find((member) => member.name === 'Cuenta invitada'),
    ).toMatchObject({
      dni: '12345678Z',
      address: 'Calle Invitada 1',
    })
    await user.click(screen.getByRole('tab', { name: 'Accesos y roles' }))
    const adminName = seed.members.find((member) => member.id === 'admin')!.name
    await user.selectOptions(screen.getByLabelText(`Cuota de ${adminName}`), flexible.id)
    await waitFor(() =>
      expect(screen.getByLabelText(`Cuota de ${adminName}`)).toHaveValue(flexible.id),
    )
    expect((await repository.read()).members.find((member) => member.id === 'admin')?.planId).toBe(
      flexible.id,
    )
  })

  it('ofrece cuotas sin sesión y usa la elegida al activar la suscripción', async () => {
    const { gateway, repository, seed } = clubFixture()
    await gateway.saveSettings('admin', {
      ...seed.settings,
      plans: [...seed.settings.plans, flexible],
    })
    localStorage.removeItem('spin-club:profile')
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    await user.click(await screen.findByRole('button', { name: 'Crear cuenta local' }))
    await user.type(screen.getByLabelText('Nombre y apellidos'), 'Alta flexible')
    await user.type(screen.getByLabelText('Email'), 'alta@doscientos.example')
    fireEvent.change(screen.getByLabelText('DNI / NIE'), { target: { value: '12345678Z' } })
    fireEvent.change(screen.getByLabelText('Dirección postal'), {
      target: { value: 'Calle Alta 1' },
    })
    await user.selectOptions(screen.getByLabelText('Cuota del club'), flexible.id)
    await user.type(screen.getByLabelText('Contraseña'), crypto.randomUUID())
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    await user.click(await screen.findByRole('button', { name: 'He guardado el código' }))
    const activate = await screen.findByRole('button', {
      name: 'Activar suscripción · pago simulado',
    })
    expect(screen.getByText(flexible.name)).toBeVisible()
    expect(screen.getByText(/25,50\s*€/)).toBeVisible()
    await user.click(activate)
    const dialog = screen.getByRole('dialog', { name: 'Activar suscripción' })
    expect(within(dialog).getByText(flexible.name)).toBeVisible()
    await user.click(within(dialog).getByRole('button', { name: /Simular pago de 25,50\s*€/ }))
    await screen.findByLabelText('Ir a una fecha')
    const state = await repository.read()
    const member = state.members.find((item) => item.email === 'alta@doscientos.example')!
    expect(member.planId).toBe(flexible.id)
    expect(member).toMatchObject({ dni: '12345678Z', address: 'Calle Alta 1' })
    expect(state.payments.find((payment) => payment.memberId === member.id)).toMatchObject({
      amountCents: flexible.priceCents,
      plan: { id: flexible.id, name: flexible.name },
      customer: { dni: '12345678Z', address: 'Calle Alta 1' },
    })
  })
})
