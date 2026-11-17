import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { Profile } from '../../features/club/domain/model'
import { navigationFor } from '../app-routes'
import { ClubNavigation } from './club-navigation'
import { ClubSidebar } from './club-sidebar'

describe('navegación del club', () => {
  it('protege la etiqueta completa y el tamaño del icono en enlaces estrechos', () => {
    render(
      <MemoryRouter initialEntries={['/pagos']}>
        <ClubNavigation items={navigationFor('admin')} />
      </MemoryRouter>,
    )

    const navigation = screen.getByRole('navigation', { name: 'Navegación principal' })
    const payments = within(navigation).getByRole('link', { name: 'Pagos y comprobantes' })
    expect(payments).toHaveAttribute('title', 'Pagos y comprobantes')
    expect(payments).toHaveAttribute('aria-current', 'page')
    expect(payments).toHaveClass('min-w-0', 'min-h-11')
    expect(within(payments).getByText('Pagos y comprobantes')).toHaveClass('truncate', 'min-w-0')
    expect(payments.querySelector('svg')).toHaveClass('shrink-0')
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
    expect(navigation).toHaveClass('overflow-x-auto', 'desktop:hidden')
    const payments = within(navigation).getByRole('link', { name: 'Pagos' })
    expect(payments).toHaveClass('min-h-11', 'min-w-16')
    expect(within(payments).getByText('Pagos')).toHaveClass('whitespace-nowrap')
    expect(within(navigation).queryByText('Pagos y comprobantes')).not.toBeInTheDocument()
    await user.click(payments)
    expect(payments).toHaveAttribute('aria-current', 'page')
  })

  it('conserva las acciones de ayuda y perfil con nombres largos y controles de @doscientos/ui', async () => {
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
        />
      </MemoryRouter>,
    )

    const sidebar = screen.getByRole('complementary')
    expect(within(sidebar).getByText('Administración')).toBeInTheDocument()
    expect(within(sidebar).getByRole('link', { name: 'Doscientos Club.' })).toHaveAttribute(
      'href',
      '/',
    )
    const profile = within(sidebar).getByRole('button', {
      name: 'María del Carmen Fernández de la Torre Administrador',
    })
    expect(profile).toHaveAttribute('data-slot', 'button')
    expect(within(profile).getByText('María del Carmen Fernández de la Torre')).toHaveClass(
      'truncate',
    )
    expect(within(profile).getByText('Administrador')).toBeInTheDocument()
    await user.click(within(sidebar).getByRole('button', { name: '¿Cómo funciona?' }))
    expect(onHelp).toHaveBeenCalledTimes(1)
    await user.tab()
    expect(profile).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onSwitchProfile).toHaveBeenCalledTimes(1)
  })
})
