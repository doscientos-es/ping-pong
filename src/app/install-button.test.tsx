import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { DATABASE_KEY } from '../features/club/infrastructure/local-repository'
import { InstallationProvider } from '../features/pwa/installation-provider'
import { clubFixture } from '../test/club-fixture'
import { App } from './app'
import { InstallButton } from './install-button'

function renderInstallButton(element: ReactElement = <InstallButton />) {
  return render(element, { wrapper: InstallationProvider })
}

function installationEvent(outcome?: 'accepted' | 'dismissed') {
  const prompt = vi.fn(async () => (outcome ? { outcome } : undefined))
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt,
    userChoice: Promise.resolve({ outcome: 'dismissed' as 'accepted' | 'dismissed' }),
  })
  act(() => {
    window.dispatchEvent(event)
  })
  return { event, prompt }
}

describe('instalación PWA (API del navegador simulada)', () => {
  it('ofrece la app en el login y abre el aviso directamente cuando el navegador lo permite', async () => {
    const { gateway } = clubFixture()
    localStorage.removeItem('spin-club:profile')
    window.history.replaceState(null, '', '/login')
    render(<App gateway={gateway} />)
    const card = await screen.findByRole('complementary', { name: 'La app del club' })
    const { event, prompt } = installationEvent('accepted')
    const userChoice = vi.fn(() => Promise.resolve({ outcome: 'dismissed' }))
    Object.defineProperty(event, 'userChoice', { get: userChoice })
    await userEvent.click(within(card).getByRole('button', { name: 'Instalar app' }))
    const dialog = await screen.findByRole('dialog', { name: 'Instalar app' })
    expect(within(dialog).getByRole('status')).toHaveTextContent('Solicitud aceptada')
    expect(prompt).toHaveBeenCalledOnce()
    expect(userChoice).not.toHaveBeenCalled()
    fireEvent(window, new Event('appinstalled'))
    expect(within(card).getByText('App instalada')).toBeVisible()
  })

  it('conserva el aviso de instalación al pasar del login a la sesión', async () => {
    const { gateway } = clubFixture()
    localStorage.removeItem('spin-club:profile')
    window.history.replaceState(null, '', '/login')
    render(<App gateway={gateway} />)
    const profile = await screen.findByRole('button', { name: /Álex · Administración/ })
    const { prompt } = installationEvent()
    await userEvent.click(profile)
    const [desktopInstall] = await screen.findAllByRole('button', { name: 'Instalar app' })
    await userEvent.click(desktopInstall)
    await userEvent.click(screen.getByRole('button', { name: 'Instalar en este dispositivo' }))
    expect(prompt).toHaveBeenCalledOnce()
  })

  it('comparte el estado de instalación entre la cabecera móvil y la barra lateral', async () => {
    const target = document.createElement('div')
    document.body.appendChild(target)
    try {
      renderInstallButton(<InstallButton sidebar mobileTarget={target} />)
      const [desktop, mobile] = screen.getAllByRole('button', { name: 'Instalar app' })
      const { prompt } = installationEvent()
      await userEvent.click(mobile)
      await userEvent.click(screen.getByRole('button', { name: 'Instalar en este dispositivo' }))
      expect(prompt).toHaveBeenCalledOnce()
      await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
      expect(mobile).toHaveFocus()
      await userEvent.click(desktop)
      expect(screen.queryByRole('button', { name: 'Instalar en este dispositivo' })).toBeNull()
      fireEvent(window, new Event('appinstalled'))
      expect(screen.queryByRole('button', { name: 'Instalar app' })).not.toBeInTheDocument()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    } finally {
      target.remove()
    }
  })

  it('ofrece instrucciones útiles cuando no existe instalación nativa', async () => {
    renderInstallButton(<InstallButton login />)
    await userEvent.click(screen.getByRole('button', { name: 'Instalar app' }))
    const dialog = screen.getByRole('dialog', { name: 'Instalar app' })
    expect(within(dialog).getByText('iPhone / iPad:')).toBeInTheDocument()
    expect(within(dialog).getByText('Android / ordenador:')).toBeInTheDocument()
    expect(
      within(dialog).queryByRole('button', { name: 'Instalar en este dispositivo' }),
    ).toBeNull()
    expect(within(dialog).getByRole('status')).toHaveTextContent('desde el menú de tu navegador')
    expect(within(dialog).getByRole('region', { name: 'Instalación manual' })).toBeVisible()
  })

  it('consume cada permiso una vez y permite abrir ayuda tras rechazarlo', async () => {
    renderInstallButton()
    const { event, prompt } = installationEvent()
    expect(event.defaultPrevented).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Instalar app' }))
    expect(prompt).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Instalar en este dispositivo' }))
    expect(prompt).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status')).toHaveTextContent('Has cancelado')
    expect(screen.queryByRole('button', { name: 'Instalar en este dispositivo' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Instalar app' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(prompt).toHaveBeenCalledTimes(1)
  })

  it.each(['prompt', 'choice'])(
    'recupera un fallo de %s sin dejar una promesa rechazada',
    async (step) => {
      renderInstallButton()
      const { event, prompt } = installationEvent()
      if (step === 'prompt') prompt.mockRejectedValueOnce(new Error('Instalación no disponible'))
      else
        Object.defineProperty(event, 'userChoice', {
          get: () => Promise.reject(new Error('Fallo del navegador')),
        })
      await userEvent.click(screen.getByRole('button', { name: 'Instalar app' }))
      await userEvent.click(screen.getByRole('button', { name: 'Instalar en este dispositivo' }))
      const dialog = await screen.findByRole('dialog')
      expect(within(dialog).getByRole('alert')).toHaveTextContent('desde su menú')
      expect(screen.getByRole('button', { name: 'Cerrar' })).toBeEnabled()
    },
  )

  it('solo da por completada la instalación al recibir appinstalled', async () => {
    clubFixture()
    const saved = localStorage.getItem(DATABASE_KEY)
    const profile = localStorage.getItem('spin-club:profile')
    renderInstallButton()
    const { event } = installationEvent()
    event.userChoice = Promise.resolve({ outcome: 'accepted' })
    const trigger = screen.getByRole('button', { name: 'Instalar app' })
    await userEvent.click(trigger)
    await userEvent.click(screen.getByRole('button', { name: 'Instalar en este dispositivo' }))
    expect(screen.getByRole('status')).toHaveTextContent('Solicitud aceptada')
    expect(trigger).toBeInTheDocument()
    fireEvent(window, new Event('appinstalled'))
    expect(screen.queryByRole('button', { name: 'Instalar app' })).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(localStorage.getItem(DATABASE_KEY)).toBe(saved)
    expect(localStorage.getItem('spin-club:profile')).toBe(profile)
  })

  it('habilita la instalación si el navegador la ofrece con el diálogo ya abierto', async () => {
    renderInstallButton()
    await userEvent.click(screen.getByRole('button', { name: 'Instalar app' }))
    expect(screen.queryByRole('button', { name: 'Instalar en este dispositivo' })).toBeNull()
    const { prompt } = installationEvent()
    const install = screen.getByRole('button', { name: 'Instalar en este dispositivo' })
    expect(install).toBeEnabled()
    expect(install).toHaveAccessibleDescription(/permite instalar/)
    await userEvent.click(install)
    expect(prompt).toHaveBeenCalledOnce()
    expect(screen.getByText('iPhone / iPad:')).toBeVisible()
    const retry = installationEvent()
    await userEvent.click(screen.getByRole('button', { name: 'Instalar en este dispositivo' }))
    expect(retry.prompt).toHaveBeenCalledOnce()
  })

  it('impide instalaciones simultáneas mientras se espera la respuesta del navegador', async () => {
    renderInstallButton()
    const { event, prompt } = installationEvent()
    let finish!: (choice: { outcome: 'dismissed' }) => void
    event.userChoice = new Promise((resolve) => {
      finish = resolve
    })
    await userEvent.click(screen.getByRole('button', { name: 'Instalar app' }))
    const install = screen.getByRole('button', { name: 'Instalar en este dispositivo' })
    fireEvent.click(install)
    fireEvent.click(install)
    expect(install).toBeDisabled()
    const installation = screen.getByRole('group', { name: 'Instalación en este dispositivo' })
    expect(installation).toHaveAttribute('aria-busy', 'true')
    expect(prompt).toHaveBeenCalledOnce()
    await act(async () => {
      finish({ outcome: 'dismissed' })
    })
    expect(installation).toHaveAttribute('aria-busy', 'false')
    expect(screen.getByRole('status')).toHaveTextContent('Has cancelado')
  })

  it('permite abrir y cerrar con teclado, contiene el foco y lo devuelve al botón', async () => {
    renderInstallButton()
    installationEvent()
    const user = userEvent.setup()
    const trigger = screen.getByRole('button', { name: 'Instalar app' })
    await user.tab()
    expect(trigger).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Instalar en este dispositivo' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('reconoce el modo instalado de Safari iOS y no muestra otra instalación', () => {
    const previous = Object.getOwnPropertyDescriptor(navigator, 'standalone')
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: true })
    try {
      renderInstallButton()
      expect(screen.queryByRole('button', { name: 'Instalar app' })).not.toBeInTheDocument()
    } finally {
      if (previous) Object.defineProperty(navigator, 'standalone', previous)
      else Reflect.deleteProperty(navigator, 'standalone')
    }
  })

  it('retira los listeners al desmontar', () => {
    const app = renderInstallButton()
    app.unmount()
    expect(installationEvent().event.defaultPrevented).toBe(false)
  })
})
