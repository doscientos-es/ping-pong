import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { addDays, dateKey } from '../features/club/domain/rules'
import { dateLabel } from '../shared/format'
import { clubFixture } from '../test/club-fixture'
import { App } from './app'

vi.mock('./install-button', () => ({ InstallButton: () => null }))

async function renderAdminCalendar() {
  const fixture = clubFixture()
  localStorage.setItem('spin-club:profile', 'admin')
  render(<App gateway={fixture.gateway} />)
  await screen.findByRole('heading', { name: 'Calendario del club', level: 1 })
  return fixture
}

describe('cabecera del calendario de administración', () => {
  it('no muestra la cuota del socio en el calendario de administración', async () => {
    await renderAdminCalendar()
    expect(screen.getByRole('table', { name: /Disponibilidad/ })).toBeInTheDocument()
    expect(
      screen.queryByRole('complementary', { name: 'Información del club' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Reservas ilimitadas incluidas.')).not.toBeInTheDocument()
  })

  it('mantiene la información de cuota para los socios', async () => {
    const { gateway } = clubFixture()
    render(<App gateway={gateway} />)
    const information = await screen.findByRole('complementary', { name: 'Información del club' })
    expect(within(information).getByText('Cuota general')).toBeInTheDocument()
    expect(within(information).getByText('Reservas ilimitadas incluidas.')).toBeInTheDocument()
  })

  it('presenta un único título y agrupa las acciones sin la descripción anterior', async () => {
    await renderAdminCalendar()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.queryByRole('heading', { name: 'Gestión de pistas' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Pulsa un hueco libre/)).not.toBeInTheDocument()
    const actions = screen.getByRole('group', { name: 'Acciones del calendario' })
    expect(within(actions).getByRole('link', { name: 'Editar horarios' })).toHaveAttribute(
      'href',
      '/configuracion',
    )
    const user = userEvent.setup()
    await user.click(within(actions).getByRole('button', { name: 'Nueva reserva' }))
    expect(await screen.findByRole('dialog', { name: 'Nueva reserva' })).toBeVisible()
  })

  it('navega por semanas, selecciona un día y vuelve a hoy con la fecha sincronizada', async () => {
    const { now } = await renderAdminCalendar()
    const user = userEvent.setup()
    const today = dateKey(now)
    const picker = screen.getByLabelText('Ir a una fecha')
    const days = screen.getByRole('group', { name: 'Días de la semana' })
    expect(
      within(days).getByRole('button', { name: dateLabel(today), pressed: true }),
    ).toHaveAttribute('aria-current', 'date')
    await user.click(screen.getByRole('button', { name: 'Semana siguiente' }))
    expect(picker).toHaveValue(addDays(today, 7))
    await user.click(screen.getByRole('button', { name: 'Semana anterior' }))
    expect(picker).toHaveValue(today)
    fireEvent.change(picker, { target: { value: '2026-12-31' } })
    expect(screen.getByText(/28.*2026.*3.*2027/)).toHaveAttribute('aria-live', 'polite')
    expect(
      within(days).getByRole('button', { name: dateLabel('2026-12-31'), pressed: true }),
    ).toBeVisible()
    expect(within(days).getAllByRole('button')).toHaveLength(7)
    await user.click(within(days).getByRole('button', { name: dateLabel('2027-01-01') }))
    expect(picker).toHaveValue('2027-01-01')
    expect(screen.getByRole('table')).toHaveAccessibleName(/Disponibilidad del 1 de enero\./)
    await user.click(screen.getByRole('button', { name: 'Hoy' }))
    expect(picker).toHaveValue(today)
  })

  it('mantiene el acceso a la configuración desde la cabecera', async () => {
    await renderAdminCalendar()
    const user = userEvent.setup()
    await user.click(screen.getByRole('link', { name: 'Editar horarios' }))
    expect(await screen.findByRole('tab', { name: 'Horarios', selected: true })).toBeVisible()
  })
})
