import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { Profile } from '../../features/club/domain/model'
import { navigationFor } from '../app-routes'
import { ClubNavigation } from './club-navigation'
import { ClubSidebar } from './club-sidebar'

vi.mock('../../app/club-context', () => ({ useClub: () => ({ signOut: vi.fn() }) }))
vi.mock('../install-button', () => ({ InstallButton: () => <button>Instalar app</button> }))

describe('navegación del club', () => {
  it('identifica el enlace activo y mantiene accesible su etiqueta completa', () => {
    render(
      <MemoryRouter initialEntries={['/pagos']}>
        <ClubNavigation items={navigationFor('admin')} />
      </MemoryRouter>,
    )

    const navigation = screen.getByRole('navigation', { name: 'Navegación principal' })
    const payments = within(navigation).getByRole('link', { name: 'Pagos y comprobantes' })
    expect(payments).toHaveAttribute('title', 'Pagos y comprobantes')
    expect(payments).toHaveAttribute('aria-current', 'page')
    expect(payments.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(
      within(navigation).getByRole('link', { name: 'Calendario del club' }),
    ).not.toHaveAttribute('aria-current')
  })

  it('permite navegar con teclado y actualiza un único enlace activo', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ClubNavigation items={navigationFor('admin')} />
      </MemoryRouter>,
    )

    const calendar = screen.getByRole('link', { name: 'Calendario del club' })
    const payments = screen.getByRole('link', { name: 'Pagos y comprobantes' })
    expect(calendar).toHaveAttribute('aria-current', 'page')
    for (let index = 0; index < 4; index += 1) await user.tab()
    expect(payments).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(payments).toHaveAttribute('aria-current', 'page')
    expect(calendar).not.toHaveAttribute('aria-current')
    expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1)
  })

  it('mantiene las etiquetas cortas y la navegación móvil independiente', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ClubNavigation items={navigationFor('admin')} mobile />
      </MemoryRouter>,
    )

    const navigation = screen.getByRole('navigation', { name: 'Navegación móvil' })
    const payments = within(navigation).getByRole('link', { name: 'Pagos' })
    expect(within(navigation).queryByText('Pagos y comprobantes')).not.toBeInTheDocument()
    await user.click(payments)
    expect(payments).toHaveAttribute('aria-current', 'page')
  })

  it('ofrece instalación y el menú de usuario en la barra lateral', async () => {
    const user = userEvent.setup()
    const onHelp = vi.fn()
    const onSwitchProfile = vi.fn()
    const actor: Profile = {
      id: 'admin',
      name: 'María del Carmen Fernández de la Torre · Administración',
      role: 'admin',
      active: true,
      subscriptionActive: true,
      passwordRequired: false,
      mustChangePassword: false,
    }
    render(
      <MemoryRouter>
        <ClubSidebar
          actor={actor}
          navigation={navigationFor(actor.role)}
          onHelp={onHelp}
          onSwitchProfile={onSwitchProfile}
          mobileInstallTarget={null}
        />
      </MemoryRouter>,
    )

    const sidebar = screen.getByRole('complementary')
    expect(within(sidebar).getByText('Administración')).toBeInTheDocument()
    expect(within(sidebar).getByRole('link', { name: 'Perception.' })).toHaveAttribute('href', '/')
    const profile = within(sidebar).getByRole('button', {
      name: 'Menú de usuario de la barra lateral',
    })
    expect(profile).toHaveAttribute('data-slot', 'button')
    expect(within(profile).getByText('María del Carmen Fernández de la Torre')).toBeInTheDocument()
    expect(within(profile).getByText('Administrador')).toBeInTheDocument()
    expect(within(sidebar).getByRole('button', { name: 'Instalar app' })).toBeInTheDocument()
    await user.click(profile)
    const menu = screen.getByRole('menu', { name: 'Menú de usuario de la barra lateral' })
    expect(within(menu).getByRole('menuitem', { name: 'Ajustes de cuenta' })).toBeInTheDocument()
    await user.click(within(menu).getByRole('menuitem', { name: 'Cambiar perfil' }))
    expect(onSwitchProfile).toHaveBeenCalledTimes(1)
    await user.click(profile)
    await user.click(
      within(screen.getByRole('menu', { name: 'Menú de usuario de la barra lateral' })).getByRole(
        'menuitem',
        {
          name: '¿Cómo funciona?',
        },
      ),
    )
    expect(onHelp).toHaveBeenCalledTimes(1)
  })

  it('abre y cierra el menú con teclado y devuelve el foco al botón', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ClubSidebar
          navigation={navigationFor('member')}
          onHelp={vi.fn()}
          onSwitchProfile={vi.fn()}
          mobileInstallTarget={null}
        />
      </MemoryRouter>,
    )
    const trigger = screen.getByRole('button', { name: 'Menú de usuario de la barra lateral' })
    trigger.focus()
    await user.keyboard('{Enter}')
    const menu = await screen.findByRole('menu', { name: 'Menú de usuario de la barra lateral' })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(within(menu).getByRole('menuitem', { name: 'Ajustes de cuenta' })).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(within(menu).getByRole('menuitem', { name: 'Cambiar perfil' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(
      screen.queryByRole('menu', { name: 'Menú de usuario de la barra lateral' }),
    ).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
