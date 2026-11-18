import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { clubFixture } from '../test/club-fixture'
import { App } from './app'

vi.mock('./install-button', () => ({ InstallButton: () => null }))
beforeAll(async () => {
  await import('../features/accounting/accounting-page')
})

describe('módulos administrativos en pestañas con repositorio real', () => {
  it('conserva borradores locales al cambiar de sección y guarda o descarta todos los ajustes juntos', async () => {
    const { gateway, repository, seed, slot } = clubFixture()
    await gateway.book('alba', slot)
    localStorage.setItem('spin-club:profile', 'admin')
    window.history.replaceState(null, '', '/configuracion')
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    await screen.findByRole('tabpanel', { name: 'Horarios' })
    await user.selectOptions(screen.getByLabelText('Apertura Lunes franja 1'), '10')
    await user.click(screen.getByRole('tab', { name: 'Cierres' }))
    fireEvent.change(screen.getByLabelText('Fecha de cierre'), { target: { value: slot.date } })
    await user.click(screen.getByRole('tab', { name: 'Cuotas' }))
    const price = screen.getByLabelText('Cuota mensual (€)')
    fireEvent.change(price, { target: { value: '45.50' } })
    await user.click(screen.getByRole('tab', { name: 'Cierres' }))
    expect(screen.getByLabelText('Fecha de cierre')).toHaveValue(slot.date)
    await user.click(screen.getByRole('button', { name: 'Añadir cierre' }))
    expect((await repository.read()).settings).toEqual(seed.settings)
    await user.click(screen.getByRole('tab', { name: 'Cuotas' }))
    expect(price).toHaveValue(45.5)
    expect(screen.getByText('1 reservas fuera del nuevo horario.')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled(),
    )
    const saved = (await repository.read()).settings
    expect(saved.plans[0].priceCents).toBe(4550)
    expect(saved.closedDates).toContain(slot.date)
    expect(saved.weekly.find((day) => day.day === 1)?.intervals[0].start).toBe(10)
    await user.click(screen.getByRole('tab', { name: 'Horarios' }))
    expect(screen.getByLabelText('Apertura Lunes franja 1')).toHaveValue('10')
    await user.selectOptions(screen.getByLabelText('Apertura Lunes franja 1'), '11')
    await user.click(screen.getByRole('tab', { name: 'Cuotas' }))
    fireEvent.change(price, { target: { value: '50' } })
    await user.click(screen.getByRole('button', { name: 'Descartar' }))
    expect(price).toHaveValue(45.5)
    await user.click(screen.getByRole('tab', { name: 'Horarios' }))
    expect(screen.getByLabelText('Apertura Lunes franja 1')).toHaveValue('10')
    expect((await repository.read()).settings).toEqual(saved)
  })

  it('mantiene la búsqueda de socios al gestionar roles desde su módulo', async () => {
    const { gateway, repository } = clubFixture()
    localStorage.setItem('spin-club:profile', 'admin')
    window.history.replaceState(null, '', '/socios')
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    await screen.findByRole('tabpanel', { name: 'Socios' })
    await user.type(screen.getByRole('searchbox', { name: 'Buscar socios' }), 'Alba')
    await user.click(screen.getByRole('tab', { name: 'Accesos y roles' }))
    expect(screen.getByRole('tabpanel', { name: 'Accesos y roles' })).toBeInTheDocument()
    expect(screen.getByLabelText('Buscar socios')).not.toBeVisible()
    const member = (await repository.read()).members.find((item) => item.id === 'hugo')!
    await user.selectOptions(
      screen.getByRole('combobox', { name: `Rol de ${member.name}` }),
      'admin',
    )
    await waitFor(() => expect(screen.getByLabelText(`Rol de ${member.name}`)).toHaveValue('admin'))
    expect((await repository.read()).members.find((item) => item.id === 'hugo')?.role).toBe('admin')
    await user.click(screen.getByRole('tab', { name: 'Socios' }))
    expect(screen.getByRole('searchbox', { name: 'Buscar socios' })).toHaveValue('Alba')
    expect(screen.getByRole('tabpanel', { name: 'Socios' })).toHaveTextContent('Alba Martín')
  })

  it('conserva los parámetros contables sin guardar y los filtros entre módulos', async () => {
    const { gateway, repository } = clubFixture()
    localStorage.setItem('spin-club:profile', 'admin')
    window.history.replaceState(null, '', '/contabilidad')
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    await user.click(await screen.findByRole('tab', { name: 'Parámetros' }))
    const balance = screen.getByLabelText('Saldo inicial global (€)')
    await user.clear(balance)
    await user.type(balance, '125,50')
    await user.click(screen.getByRole('tab', { name: 'Movimientos' }))
    await user.selectOptions(screen.getByLabelText('Filtrar movimientos'), 'pending')
    await user.click(screen.getByRole('tab', { name: 'Resumen' }))
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
    await user.click(screen.getByRole('tab', { name: 'Parámetros' }))
    expect(balance).toHaveValue('125,50')
    expect((await repository.read()).accounting.openingBalanceCents).toBe(0)
    await user.click(screen.getByRole('button', { name: 'Guardar parámetros' }))
    await waitFor(() => expect(screen.getByText('Parámetros guardados.')).toBeInTheDocument())
    expect((await repository.read()).accounting.openingBalanceCents).toBe(12550)
    await user.click(screen.getByRole('tab', { name: 'Movimientos' }))
    expect(screen.getByLabelText('Filtrar movimientos')).toHaveValue('pending')
  })

  it('mantiene el estado de comprobantes al volver a la gestión de cuotas', async () => {
    const { gateway } = clubFixture()
    localStorage.setItem('spin-club:profile', 'admin')
    window.history.replaceState(null, '', '/pagos')
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    await screen.findByRole('tabpanel', { name: 'Cuotas' })
    await user.click(screen.getByRole('tab', { name: 'Comprobantes' }))
    await user.selectOptions(screen.getByLabelText('Estado del pago'), 'voided')
    fireEvent.change(screen.getByLabelText('Fecha de pago: desde'), {
      target: { value: '2025-01-01' },
    })
    await user.click(screen.getByRole('tab', { name: 'Cuotas' }))
    expect(
      within(screen.getByRole('table', { name: 'Cuotas por socio' })).getAllByRole('row').length,
    ).toBeGreaterThan(0)
    expect(screen.queryByRole('combobox', { name: 'Estado del pago' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Comprobantes' }))
    expect(screen.getByLabelText('Estado del pago')).toHaveValue('voided')
    expect(screen.getByLabelText('Fecha de pago: desde')).toHaveValue('2025-01-01')
    await user.click(screen.getByRole('tab', { name: 'Cuotas' }))
    await user.click(screen.getByRole('button', { name: 'Ver historial completo' }))
    expect(screen.getByRole('tab', { name: 'Comprobantes' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    const period = within(screen.getByRole('group', { name: 'Periodo de la cuota' }))
    expect(period.getByRole('combobox', { name: 'Año' })).toHaveValue('')
    expect(period.getByRole('combobox', { name: 'Mes' })).toHaveValue('')
    expect(screen.getByLabelText('Estado del pago')).toHaveValue('voided')
  })
})
