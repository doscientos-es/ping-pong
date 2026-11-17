import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RegisterSWOptions } from 'virtual:pwa-register/react'

import { PwaUpdateNotice } from './pwa-update-notice'

const registration = vi.hoisted(() => ({
  needed: false,
  update: vi.fn<() => Promise<void>>(),
  dismiss: vi.fn(),
  options: null as RegisterSWOptions | null,
}))
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: (options: RegisterSWOptions) => {
    registration.options = options
    return {
      needRefresh: [registration.needed, registration.dismiss],
      updateServiceWorker: registration.update,
    }
  },
}))
beforeEach(() => {
  registration.needed = false
  registration.update.mockReset().mockResolvedValue(undefined)
  registration.dismiss.mockReset()
  registration.options = null
})

describe('actualización PWA (registro simulado)', () => {
  it('no recarga automáticamente y permite aplazar la actualización', async () => {
    registration.needed = true
    render(<PwaUpdateNotice />)
    expect(screen.getByRole('status')).toHaveTextContent('Tus datos locales se conservan')
    expect(registration.update).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Después' }))
    expect(registration.dismiss).toHaveBeenCalledWith(false)
    expect(registration.update).not.toHaveBeenCalled()
  })

  it('informa de un fallo y permite reintentar sin alterar los datos', async () => {
    registration.needed = true
    registration.update.mockRejectedValueOnce(new Error('Sin conexión'))
    localStorage.setItem('spin-club:database:v2', 'estado conservado')
    render(<PwaUpdateNotice />)
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Inténtalo de nuevo con conexión')
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar' }))
    expect(registration.update).toHaveBeenCalledTimes(2)
    expect(registration.update).toHaveBeenLastCalledWith(true)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(localStorage.getItem('spin-club:database:v2')).toBe('estado conservado')
  })

  it('no afirma tener modo offline si el registro falla', () => {
    render(<PwaUpdateNotice />)
    act(() => {
      registration.options?.onRegisterError?.(new Error('No registrado'))
    })
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo preparar el modo sin conexión')
    expect(screen.queryByRole('button', { name: 'Actualizar' })).not.toBeInTheDocument()
  })
})
