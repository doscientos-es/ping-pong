import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { clubFixture } from '../test/club-fixture'
import { App } from './app'

vi.mock('./install-button', () => ({ InstallButton: () => null }))
beforeAll(async () => {
  await import('../features/accounting/accounting-page')
})

describe('contabilidad administrativa con repositorio real', () => {
  it('abre el trimestre actual y permite consultar otro trimestre, año o mes', async () => {
    const { gateway, now } = clubFixture()
    const previousYear = String(now.getFullYear() - 1)
    localStorage.setItem('spin-club:profile', 'admin')
    window.history.replaceState(null, '', '/contabilidad')
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    const view = await screen.findByRole('combobox', { name: 'Vista' })
    const period = within(screen.getByRole('group', { name: 'Periodo contable' }))
    const chart = screen.getByRole('figure', { name: 'Ingresos y gastos por fecha de documento' })
    const quarter = period.getByRole('combobox', { name: 'Trimestre' })
    expect(view).toHaveValue('quarter')
    expect(period.getByRole('combobox', { name: 'Año' })).toHaveValue(String(now.getFullYear()))
    expect(quarter).toHaveValue(String(Math.floor(now.getMonth() / 3) * 3 + 1).padStart(2, '0'))
    await user.selectOptions(period.getByRole('combobox', { name: 'Año' }), previousYear)
    await user.selectOptions(quarter, '04')
    await user.click(within(chart).getByText('Ver desglose del periodo'))
    expect(chart).toHaveTextContent(`${previousYear}-04-01`)
    expect(chart).toHaveTextContent(`${previousYear}-06-30`)
    expect(chart).not.toHaveTextContent(`${previousYear}-07-01`)
    await user.selectOptions(view, 'year')
    expect(period.queryByRole('combobox', { name: 'Trimestre' })).not.toBeInTheDocument()
    expect(chart).toHaveTextContent(`${previousYear}-12-31`)
    await user.selectOptions(view, 'month')
    await user.selectOptions(period.getByRole('combobox', { name: 'Mes' }), '02')
    expect(chart).toHaveTextContent(`${previousYear}-02-01`)
    expect(chart).not.toHaveTextContent(`${previousYear}-04-01`)
  })

  it('crea una factura, la conserva al recargar, edita el cobro y anula sin borrar historial', async () => {
    const { gateway, now } = clubFixture()
    localStorage.setItem('spin-club:profile', 'admin')
    window.history.replaceState(null, '', '/contabilidad')
    const user = userEvent.setup()
    const app = render(<App gateway={gateway} />)
    await screen.findByRole('heading', { name: 'Contabilidad', level: 1 })
    const expenses = () =>
      within(screen.getByRole('group', { name: 'Totales del periodo' })).getByText(
        'Gastos contables',
      ).parentElement
    expect(
      screen.getByRole('figure', { name: 'Ingresos y gastos por fecha de documento' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Nuevo movimiento' }))
    let dialog = await screen.findByRole('dialog', { name: 'Nuevo movimiento' })
    await user.type(within(dialog).getByLabelText('Concepto'), 'Material deportivo')
    await user.type(within(dialog).getByLabelText('Categoría'), 'Equipamiento')
    await user.type(within(dialog).getByLabelText('Total con IVA (€)'), '12,10')
    await user.clear(within(dialog).getByLabelText('IVA (%)'))
    await user.type(within(dialog).getByLabelText('IVA (%)'), '21')
    await user.click(within(dialog).getByLabelText('IVA deducible (solo gastos)'))
    await user.selectOptions(within(dialog).getByLabelText('Estado'), 'pending')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar movimiento' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('article', { name: 'Material deportivo' })).toHaveTextContent('12,10')
    expect(expenses()).toHaveTextContent('10,00')
    app.unmount()
    render(<App gateway={gateway} />)
    await user.click(await screen.findByRole('tab', { name: 'Movimientos' }))
    expect(await screen.findByRole('article', { name: 'Material deportivo' })).toHaveTextContent(
      'Pendiente',
    )
    await user.click(screen.getByRole('button', { name: 'Editar Material deportivo' }))
    dialog = await screen.findByRole('dialog', { name: 'Editar movimiento' })
    await user.selectOptions(within(dialog).getByLabelText('Estado'), 'paid')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar movimiento' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('article', { name: 'Material deportivo' })).toHaveTextContent(
      'Cobrado / pagado',
    )
    await user.click(screen.getByRole('button', { name: 'Anular Material deportivo' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar anulación' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('article', { name: 'Material deportivo' })).toHaveTextContent('Anulado')
    expect(expenses()).toHaveTextContent('0,00')
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Año' }),
      String(now.getFullYear() - 1),
    )
    expect(screen.queryByRole('article', { name: 'Material deportivo' })).not.toBeInTheDocument()
  }, 15000)
})
