import { render, screen, waitFor, within } from '@testing-library/react'
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
  it.each(['/socios', '/configuracion', '/contabilidad'])(
    'redirige a un socio que abre %s directamente',
    async (route) => {
      const { gateway } = clubFixture()
      window.location.hash = `#${route}`
      render(<App gateway={gateway} />)
      await screen.findByRole('navigation', { name: 'Pasos de la reserva' })
      await waitFor(() => expect(window.location.hash).toBe('#/'))
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
    window.location.hash = '#/configuracion'
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
    window.location.hash = '#/ruta-inexistente'
    render(<App gateway={gateway} />)
    await screen.findByRole('navigation', { name: 'Pasos de la reserva' })
    await waitFor(() => expect(window.location.hash).toBe('#/'))
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
