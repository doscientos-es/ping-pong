import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { clubFixture } from '../test/club-fixture'
import { App } from './app'

// Service worker registration needs a real secure browser; keep business flows real.
vi.mock('./install-button', () => ({ InstallButton: () => null }))
// Prepare the real lazy chunk without spending the first query's timeout on transformation.
beforeAll(async () => {
  await import('../features/reservations/booking-flow')
})

async function switchTo(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  await user.click(screen.getByRole('button', { name: 'Menú de usuario' }))
  await user.click(screen.getByRole('menuitem', { name: 'Cambiar perfil' }))
  const dialog = await screen.findByRole('dialog', { name: 'Cambiar perfil' })
  expect(dialog).not.toHaveAttribute('aria-describedby')
  await user.click(within(dialog).getByRole('button', { name }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
}

describe('flujos reales con localStorage, sin backend', () => {
  it('permite cambiar de perfil y cerrar sesión desde el menú de la barra lateral', async () => {
    const { gateway } = clubFixture()
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    await screen.findByLabelText('Ir a una fecha')
    const menu = screen.getByRole('button', { name: 'Menú de usuario de la barra lateral' })
    await user.click(menu)
    const account = screen.getByRole('menu', { name: 'Menú de usuario de la barra lateral' })
    expect(within(account).getByRole('menuitem', { name: 'Ajustes de cuenta' })).toBeInTheDocument()
    await user.click(within(account).getByRole('menuitem', { name: 'Cambiar perfil' }))
    const profiles = await screen.findByRole('dialog', { name: 'Cambiar perfil' })
    await user.click(within(profiles).getByRole('button', { name: /Álex · Administración/ }))
    await screen.findByRole('heading', { name: 'Calendario del club' })
    await user.click(screen.getByRole('button', { name: 'Menú de usuario de la barra lateral' }))
    await user.click(
      within(screen.getByRole('menu', { name: 'Menú de usuario de la barra lateral' })).getByRole(
        'menuitem',
        {
          name: 'Cerrar sesión',
        },
      ),
    )
    await screen.findByRole('button', { name: 'Crear cuenta local' })
    expect(window.location.pathname).toBe('/login')
  })

  it('confirma, conserva tras remontar y cancela una reserva sin generar pagos', async () => {
    const { gateway, repository, seed, slot } = clubFixture()
    const user = userEvent.setup()
    const app = render(<App gateway={gateway} />)
    const date = await screen.findByLabelText('Ir a una fecha')
    await user.click(screen.getByRole('link', { name: 'Saltar al contenido' }))
    expect(screen.getByRole('main')).toHaveFocus()
    expect(window.location.hash).not.toContain('main-content')
    // Native date input is more reliably exercised via change than character typing.
    fireEvent.change(date, { target: { value: slot.date } })
    await user.click(screen.getByRole('button', { name: 'Elegir hora' }))
    await user.click(screen.getByRole('button', { name: '18:00 – 19:00, 8 pistas libres' }))
    await user.click(screen.getByRole('button', { name: 'Pista 1, disponible' }))
    await user.click(screen.getByRole('button', { name: 'Revisar reserva' }))
    expect(screen.queryByText(/Total a pagar/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    expect(await screen.findByRole('heading', { name: 'Reserva confirmada' })).toBeInTheDocument()
    expect(screen.getByText('Sin coste adicional')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Ver mis reservas' }))
    expect(
      await screen.findByRole('heading', { name: 'Mis reservas', level: 1 }),
    ).toBeInTheDocument()
    app.unmount()
    render(<App gateway={gateway} />)
    await screen.findByRole('heading', { name: 'Mis reservas', level: 1 })
    await user.click(screen.getByRole('button', { name: /Pista 1/ }))
    const dialog = await screen.findByRole('dialog', { name: 'Pista 1' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar reserva' }))
    await user.click(within(dialog).getByRole('button', { name: 'Sí, cancelar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const state = await repository.read()
    expect(state.reservations).toHaveLength(1)
    expect(state.reservations[0].status).toBe('cancelled')
    expect(state.payments).toEqual(seed.payments)
  })

  it('cambia de rol en un clic y activa la cuota tras un rechazo simulado', async () => {
    const { gateway, repository, seed } = clubFixture()
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    await screen.findByLabelText('Ir a una fecha')
    await switchTo(user, /Hugo Molina/)
    await screen.findByRole('button', { name: 'Activar suscripción · pago simulado' })
    expect(screen.queryByLabelText('Ir a una fecha')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Activar suscripción · pago simulado' }))
    const dialog = await screen.findByRole('dialog', { name: 'Activar suscripción' })
    expect(dialog).not.toHaveAttribute('aria-describedby')
    expect(within(dialog).getByText('Sin dinero real')).toBeInTheDocument()
    await user.click(within(dialog).getByText('Probar un pago rechazado'))
    await user.selectOptions(
      within(dialog).getByLabelText('Resultado del pago simulado'),
      'failure',
    )
    await user.click(within(dialog).getByRole('button', { name: /Simular pago de/ }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('rechazado')
    expect((await repository.read()).payments).toHaveLength(seed.payments.length)
    await user.selectOptions(
      within(dialog).getByLabelText('Resultado del pago simulado'),
      'success',
    )
    await user.click(within(dialog).getByRole('button', { name: /Simular pago de/ }))
    await screen.findByLabelText('Ir a una fecha')
    expect((await gateway.view('hugo')).subscriptionActive).toBe(true)
    await switchTo(user, /Álex · Administración/)
    expect(await screen.findByRole('heading', { name: 'Calendario del club' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /socios/i }).length).toBeGreaterThan(0)
  })

  it('bloquea un perfil de baja pero permite volver a otro perfil', async () => {
    const { gateway } = clubFixture()
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    await screen.findByLabelText('Ir a una fecha')
    await user.click(screen.getByRole('button', { name: 'Menú de usuario' }))
    await user.click(screen.getByRole('menuitem', { name: 'Cambiar perfil' }))
    const dialog = await screen.findByRole('dialog', { name: 'Cambiar perfil' })
    await user.click(within(dialog).getByRole('button', { name: /Elena Soler/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('desactivada')
    await user.click(within(dialog).getByRole('button', { name: /Alba Martín/ }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByLabelText('Ir a una fecha')).toBeInTheDocument()
  })

  it('crea una cuenta con contraseña local y muestra la cuota pendiente', async () => {
    const { gateway } = clubFixture()
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    await screen.findByLabelText('Ir a una fecha')
    await user.click(screen.getByRole('button', { name: 'Menú de usuario' }))
    await user.click(screen.getByRole('menuitem', { name: 'Cambiar perfil' }))
    await user.click(screen.getByRole('button', { name: 'Crear cuenta local' }))
    const dialog = await screen.findByRole('dialog', { name: 'Cambiar perfil' })
    expect(dialog).not.toHaveAttribute('aria-describedby')
    await user.type(within(dialog).getByLabelText('Nombre y apellidos'), 'Marta Demo')
    await user.type(within(dialog).getByLabelText('Email'), 'marta@doscientos.example')
    await user.type(within(dialog).getByLabelText('Contraseña'), crypto.randomUUID())
    await user.click(within(dialog).getByRole('button', { name: 'Crear cuenta' }))
    await user.click(await screen.findByRole('button', { name: 'He guardado el código' }))
    expect(
      await screen.findByRole('button', { name: 'Activar suscripción · pago simulado' }),
    ).toBeInTheDocument()
    expect(
      (await gateway.profiles()).find((profile) => profile.name === 'Marta Demo'),
    ).toMatchObject({ subscriptionActive: false })
  })

  it('guarda horarios y cuotas decimales desde administración', async () => {
    const { gateway, repository } = clubFixture()
    localStorage.setItem('spin-club:profile', 'admin')
    window.history.replaceState(null, '', '/configuracion')
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    await user.click(await screen.findByRole('tab', { name: 'Cuotas' }))
    const price = await screen.findByLabelText('Cuota mensual (€)')
    await user.clear(price)
    await user.type(price, '45.50')
    await user.click(screen.getByRole('tab', { name: 'Horarios' }))
    await user.click(screen.getByRole('checkbox', { name: 'Abrir Domingo' }))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled(),
    )
    const state = await repository.read()
    expect(state.settings.plans[0].priceCents).toBe(4550)
    expect(state.settings.weekly.find((day) => day.day === 0)?.intervals).toEqual([])
  })

  it('registra y anula cuotas por socio desde administración, manteniendo los documentos', async () => {
    const { gateway, repository, seed } = clubFixture()
    localStorage.setItem('spin-club:profile', 'admin')
    window.history.replaceState(null, '', '/pagos')
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    await screen.findByRole('heading', { name: 'Control de suscripciones' })
    const row = screen.getByRole('row', { name: /Hugo Molina/ })
    await user.click(within(row).getByRole('button', { name: 'Registrar pago' }))
    let dialog = await screen.findByRole('dialog', { name: 'Registrar cuota pagada' })
    expect(dialog).not.toHaveAttribute('aria-describedby')
    expect(within(dialog).getByText('Sin dinero real')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar cuota pagada' }))
    await waitFor(() => expect(within(row).getByText('Al corriente')).toBeInTheDocument())
    await user.click(within(row).getByRole('button', { name: 'Marcar no pagada' }))
    dialog = await screen.findByRole('dialog', { name: '¿Marcar esta cuota como no pagada?' })
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar cuota no pagada' }))
    await waitFor(() => expect(within(row).getByText('Pendiente')).toBeInTheDocument())
    const state = await repository.read()
    expect(state.payments).toHaveLength(seed.payments.length + 1)
    expect(state.payments.at(-1)).toMatchObject({ memberId: 'hugo', status: 'voided' })
    await user.click(screen.getByRole('tab', { name: 'Comprobantes' }))
    await user.click(screen.getByRole('button', { name: /Hugo Molina.*Anulado/ }))
    dialog = await screen.findByRole('dialog')
    expect(dialog).not.toHaveAttribute('aria-describedby')
    expect(within(dialog).getByText(/SIN VALIDEZ FISCAL/i)).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Descargar HTML' })).toBeInTheDocument()
  })
})
