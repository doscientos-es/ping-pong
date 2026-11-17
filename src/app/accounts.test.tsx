import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { clubFixture } from '../test/club-fixture'
import { App } from './app'

vi.mock('./install-button', () => ({ InstallButton: () => null }))
// Load the real lazy calendar chunk outside the session assertion's timeout.
beforeAll(async () => {
  await import('../features/reservations/booking-flow')
})

async function signOut(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Menú de usuario' }))
  await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
  await screen.findByRole('button', { name: 'Crear cuenta local' })
  expect(window.location.pathname).toBe('/login')
}

describe('selección de cuentas y sesiones persistentes', () => {
  it('ignora el antiguo selector como acceso a una cuenta protegida', async () => {
    const { gateway } = clubFixture()
    const account = await gateway.inviteUser('admin', {
      name: 'Cuenta protegida',
      email: 'protegida@doscientos.example',
      phone: '',
      role: 'admin',
      temporaryPassword: crypto.randomUUID(),
    })
    localStorage.setItem('spin-club:profile', account.id)
    window.history.replaceState(null, '', '/contabilidad')
    render(<App gateway={gateway} />)
    await screen.findByRole('button', { name: /Cuenta protegida/ })
    expect(window.location.pathname).toBe('/login')
    expect(screen.queryByRole('heading', { name: 'Contabilidad' })).not.toBeInTheDocument()
  })

  it('sincroniza cierre de sesión de otra pestaña y no se bloquea al recibirlo otra vez', async () => {
    const { gateway } = clubFixture()
    render(<App gateway={gateway} />)
    await screen.findByLabelText('Ir a una fecha')
    const receiveSignOut = () => {
      localStorage.setItem('spin-club:session:v1', 'null')
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'spin-club:session:v1', newValue: 'null' }),
      )
    }
    await act(async () => receiveSignOut())
    await screen.findByRole('button', { name: 'Crear cuenta local' })
    expect(window.location.pathname).toBe('/login')
    await act(async () => receiveSignOut())
    expect(screen.getByRole('button', { name: 'Crear cuenta local' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Ir a una fecha')).not.toBeInTheDocument()
  })

  it('empieza con cuentas, permite entrar y cerrar sesión sin borrar datos ni entrar de nuevo al recargar', async () => {
    const { gateway, repository } = clubFixture()
    localStorage.removeItem('spin-club:profile')
    const before = await repository.read()
    const user = userEvent.setup()
    let app = render(<App gateway={gateway} />)
    await screen.findByRole('button', { name: /Álex · Administración/ })
    expect(window.location.pathname).toBe('/login')
    expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Álex · Administración/ }))
    await screen.findByRole('heading', { name: 'Calendario del club' })
    expect(window.location.pathname).toBe('/')
    app.unmount()
    app = render(<App gateway={gateway} />)
    await screen.findByRole('heading', { name: 'Calendario del club' })
    await signOut(user)
    app.unmount()
    render(<App gateway={gateway} />)
    await screen.findByRole('button', { name: /Álex · Administración/ })
    expect(screen.queryByRole('heading', { name: 'Calendario del club' })).not.toBeInTheDocument()
    expect(await repository.read()).toEqual(before)
  })

  it('invita, cambia la contraseña temporal sin cuota, recupera acceso y mantiene la contraseña fuera de storage', async () => {
    const { gateway } = clubFixture()
    localStorage.setItem('spin-club:profile', 'admin')
    window.history.replaceState(null, '', '/socios')
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    await user.click(await screen.findByRole('button', { name: 'Invitar usuario' }))
    const invitation = await screen.findByRole('dialog', { name: 'Invitar usuario' })
    const temporary = crypto.randomUUID()
    await user.type(within(invitation).getByLabelText('Nombre y apellidos'), 'Marta Invitada')
    await user.type(within(invitation).getByLabelText('Email'), 'invitada@doscientos.example')
    await user.type(within(invitation).getByLabelText('Contraseña temporal'), temporary)
    await user.click(within(invitation).getByRole('button', { name: 'Crear invitación local' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await signOut(user)
    await user.click(screen.getByRole('button', { name: /Marta Invitada/ }))
    await user.type(screen.getByLabelText('Contraseña'), temporary)
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    await screen.findByRole('heading', { name: 'Mi cuenta', level: 1 })
    expect(screen.getByText(/Tu contraseña es temporal/)).toBeInTheDocument()
    const next = crypto.randomUUID()
    await user.type(screen.getByLabelText('Contraseña actual'), temporary)
    await user.type(screen.getByLabelText('Nueva contraseña'), next)
    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
    const code = (await screen.findByLabelText('Código de recuperación')).textContent!
    expect(code.length).toBeGreaterThan(30)
    await user.click(screen.getByRole('button', { name: 'He guardado el código' }))
    await signOut(user)
    await user.click(screen.getByRole('button', { name: 'Recuperar contraseña' }))
    await user.type(screen.getByLabelText('Email'), 'invitada@doscientos.example')
    await user.type(screen.getByLabelText('Código de recuperación'), code)
    const recovered = crypto.randomUUID()
    await user.type(screen.getByLabelText('Nueva contraseña'), recovered)
    await user.click(screen.getByRole('button', { name: 'Restablecer contraseña' }))
    await screen.findByText(/Contraseña restablecida/)
    await user.click(screen.getByRole('button', { name: 'Volver a los perfiles' }))
    await user.click(screen.getByRole('button', { name: /Marta Invitada/ }))
    await user.type(screen.getByLabelText('Contraseña'), recovered)
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    await screen.findByRole('button', { name: 'Activar suscripción · pago simulado' })
    await user.click(screen.getByRole('button', { name: 'Menú de usuario' }))
    await user.click(screen.getByRole('link', { name: 'Ajustes de cuenta' }))
    await screen.findByRole('heading', { name: 'Mi cuenta', level: 1 })
    const profile = (await gateway.profiles()).find((item) => item.name === 'Marta Invitada')!
    await expect(gateway.login(profile.id, next)).rejects.toThrow()
  }, 20000)
})
