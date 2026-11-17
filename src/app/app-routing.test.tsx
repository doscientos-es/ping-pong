import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { clubFixture } from '../test/club-fixture'
import { App } from './app'
import { ErrorBoundary } from './error-boundary'

vi.mock('./install-button', () => ({ InstallButton: () => null }))
beforeAll(async () => {
  await import('../features/reservations/booking-flow')
})

describe('composición y rutas por rol', () => {
  it.each(['/', '/login', '/reservas', '/pagos', '/cuenta', '/configuracion', '/desconocida'])(
    'muestra la selección solo en /login al abrir %s sin perfil',
    async (route) => {
      const { gateway } = clubFixture()
      localStorage.removeItem('spin-club:profile')
      window.history.replaceState(null, '', route)
      render(<App gateway={gateway} />)

      await screen.findByRole('button', { name: /Álex · Administración/ })
      expect(window.location.pathname).toBe('/login')
      expect(window.location.hash).toBe('')
      expect(document.title).toBe('Iniciar sesión · Doscientos Club')
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Ir a una fecha')).not.toBeInTheDocument()
    },
  )

  it('redirige al calendario si se abre /login con una sesión válida', async () => {
    const { gateway } = clubFixture()
    window.history.replaceState(null, '', '/login')
    render(<App gateway={gateway} />)

    await screen.findByRole('navigation', { name: 'Pasos de la reserva' })
    expect(window.location.pathname).toBe('/')
    expect(screen.queryByRole('button', { name: 'Crear cuenta local' })).not.toBeInTheDocument()
  })

  it('espera a validar la sesión y envía a /login si ya no es válida', async () => {
    const { gateway } = clubFixture()
    let finishValidation!: (valid: boolean) => void
    const validation = new Promise<boolean>((resolve) => {
      finishValidation = resolve
    })
    vi.spyOn(gateway, 'sessionValid').mockReturnValue(validation)
    window.history.replaceState(null, '', '/pagos')
    render(<App gateway={gateway} />)

    expect(screen.getByText('Cargando…')).toHaveAttribute('role', 'status')
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    await act(async () => finishValidation(false))

    await screen.findByRole('button', { name: 'Crear cuenta local' })
    expect(window.location.pathname).toBe('/login')
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it.each(['/socios', '/configuracion', '/contabilidad'])(
    'redirige a un socio que abre %s directamente',
    async (route) => {
      const { gateway } = clubFixture()
      window.history.replaceState(null, '', route)
      render(<App gateway={gateway} />)
      await screen.findByRole('navigation', { name: 'Pasos de la reserva' })
      await waitFor(() => expect(window.location.pathname).toBe('/'))
      const navigation = screen.getByRole('navigation', { name: 'Navegación principal' })
      expect(
        within(navigation).queryByRole('link', { name: /socios|configuración/i }),
      ).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Socios', level: 1 })).not.toBeInTheDocument()
    },
  )

  it('abre una ruta administrativa al recargar y comparte el estado activo con el menú', async () => {
    const { gateway } = clubFixture()
    localStorage.setItem('spin-club:profile', 'admin')
    window.history.replaceState(null, '', '/configuracion')
    render(<App gateway={gateway} />)
    await screen.findByRole('heading', { name: 'Configuración', level: 1 })
    expect(document.title).toBe('Configuración · Doscientos Club')
    expect(screen.getByRole('link', { name: 'Doscientos Club.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Doscientos.' })).toBeInTheDocument()
    const navigation = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(within(navigation).getByRole('link', { name: 'Configuración' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByLabelText('Cuota mensual (€)')).toBeInTheDocument()
  })

  it('recupera una ruta desconocida sin dejar la pantalla vacía', async () => {
    const { gateway } = clubFixture()
    window.history.replaceState(null, '', '/ruta-inexistente')
    render(<App gateway={gateway} />)
    await screen.findByRole('navigation', { name: 'Pasos de la reserva' })
    await waitFor(() => expect(window.location.pathname).toBe('/'))
  })

  it('permite recuperar un error de lectura cambiando de perfil sin borrar datos', async () => {
    const { gateway, repository } = clubFixture()
    const previous = await repository.read()
    vi.spyOn(gateway, 'view').mockRejectedValueOnce(new Error('No se pudo abrir el perfil.'))
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo abrir el perfil.')
    await user.click(screen.getByRole('button', { name: 'Cambiar de perfil' }))
    const dialog = await screen.findByRole('dialog', { name: 'Cambiar perfil' })
    await user.click(within(dialog).getByRole('button', { name: /Álex · Administración/ }))
    await screen.findByRole('heading', { name: 'Calendario del club' })
    expect(await repository.read()).toEqual(previous)
  })

  it('contiene un fallo de renderizado con una recuperación explícita', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    function BrokenScreen(): never {
      throw new Error('Render de prueba')
    }
    render(
      <ErrorBoundary>
        <BrokenScreen />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('No se borrarán tus datos locales.')
    expect(screen.getByRole('button', { name: 'Recargar' })).toBeInTheDocument()
  })
})
