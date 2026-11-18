import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { clubFixture } from '../test/club-fixture'
import { App } from './app'

vi.mock('./install-button', () => ({ InstallButton: () => null }))
beforeAll(async () => {
  await import('../features/accounting/accounting-page')
})

describe('contabilidad administrativa con repositorio real', () => {
  it('crea una factura, la conserva al recargar, edita el cobro y anula sin borrar historial', async () => {
    const { gateway, now } = clubFixture()
    localStorage.setItem('spin-club:profile', 'admin')
    window.history.replaceState(null, '', '/contabilidad')
    const user = userEvent.setup()
    const app = render(<App gateway={gateway} />)
    await screen.findByRole('heading', { name: 'Contabilidad', level: 1 })
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
    expect(screen.getByText('Gastos contables').parentElement).toHaveTextContent('10,00')
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
    expect(screen.getByText('Gastos contables').parentElement).toHaveTextContent('0,00')
    fireEvent.change(screen.getByLabelText('Mes de referencia'), {
      target: { value: `${now.getFullYear() - 1}-01` },
    })
    expect(screen.queryByRole('article', { name: 'Material deportivo' })).not.toBeInTheDocument()
  }, 15000)
})
