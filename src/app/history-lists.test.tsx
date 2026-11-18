import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Payment, Reservation } from '../features/club/domain/model'
import { addDays, dateKey, periodKey } from '../features/club/domain/rules'
import { DATABASE_KEY } from '../features/club/infrastructure/local-repository'
import { dateLabel, money } from '../shared/format'
import { clubFixture } from '../test/club-fixture'
import { App } from './app'

vi.mock('./install-button', () => ({ InstallButton: () => null }))

function reservations(today: string, count: number, direction = 1): Reservation[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `reservation-${direction}-${index}`,
    memberId: 'alba',
    court: (index % 2) + 1,
    date: addDays(today, direction * (index + 1)),
    hour: 18,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  }))
}

function changeDate(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

describe('reservas e históricos filtrados y paginados con repositorio real', () => {
  it('combina pista/fechas, reinicia páginas, limpia filtros y permite cancelar desde otra página', async () => {
    const { gateway, repository, now } = clubFixture()
    const today = dateKey(now)
    await repository.transact((state) => {
      state.reservations = [
        ...reservations(today, 29),
        { ...reservations(today, 1)[0], id: 'other-member', memberId: 'hugo' },
      ]
    })
    const persisted = localStorage.getItem(DATABASE_KEY)
    window.history.replaceState(null, '', '/reservas')
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    const region = await screen.findByRole('region', { name: 'Resultados de reservas' })
    const pager = within(screen.getByRole('navigation', { name: 'Paginación de reservas' }))
    expect(within(region).getAllByRole('button')).toHaveLength(12)
    expect(pager.getByRole('status')).toHaveTextContent('1–12 de 29 reservas')
    await user.click(pager.getByRole('button', { name: 'Siguiente' }))
    await user.click(screen.getByRole('button', { name: 'Filtros' }))
    await user.selectOptions(screen.getByLabelText('Pista'), '2')
    expect(pager.getByRole('status')).toHaveTextContent('1–12 de 14 reservas · Página 1 de 2')
    changeDate('Fecha de la reserva: desde', addDays(today, 4))
    changeDate('Fecha de la reserva: hasta', addDays(today, 8))
    expect(pager.getByRole('status')).toHaveTextContent('1–3 de 3 reservas')
    expect(within(region).getAllByRole('button')).toHaveLength(3)
    expect(within(region).queryByRole('button', { name: /Pista 1/ })).not.toBeInTheDocument()
    expect(localStorage.getItem(DATABASE_KEY)).toBe(persisted)
    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    await user.click(pager.getByRole('button', { name: 'Siguiente' }))
    const chosen = within(region).getAllByRole('button')[0]
    await user.click(chosen)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent(
      dateLabel(addDays(today, 13), {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    )
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar reserva' }))
    await user.click(within(dialog).getByRole('button', { name: 'Sí, cancelar reserva' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(pager.getByRole('status')).toHaveTextContent('13–24 de 28 reservas')
    expect(
      (await repository.read()).reservations.find((item) => item.id === 'reservation-1-12')?.status,
    ).toBe('cancelled')
    await user.click(screen.getByRole('button', { name: 'Canceladas (1)' }))
    expect(within(region).getAllByRole('button')).toHaveLength(1)
    expect(pager.getByRole('status')).toHaveTextContent('1–1 de 1 reservas · Página 1 de 1')
  })

  it('pagina la actividad pasada, conserva orden descendente y explica rangos invertidos y filtros vacíos', async () => {
    const { gateway, repository, now } = clubFixture()
    const today = dateKey(now)
    await repository.transact((state) => {
      state.reservations = [...reservations(today, 1000, -1), ...reservations(today, 1)]
    })
    window.history.replaceState(null, '', '/historial')
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    const region = await screen.findByRole('region', { name: 'Resultados de reservas' })
    const pager = within(screen.getByRole('navigation', { name: 'Paginación de reservas' }))
    await user.click(pager.getByRole('button', { name: 'Última' }))
    expect(within(region).getAllByRole('button')).toHaveLength(4)
    await user.click(screen.getByRole('button', { name: 'Filtros' }))
    await user.selectOptions(screen.getByLabelText('Pista'), '2')
    changeDate('Fecha de la reserva: desde', addDays(today, -10))
    changeDate('Fecha de la reserva: hasta', addDays(today, -4))
    expect(within(region).getAllByRole('button')).toHaveLength(4)
    expect(within(region).getAllByRole('button')[0]).toHaveTextContent(
      dateLabel(addDays(today, -4), { weekday: 'short', day: 'numeric', month: 'long' }),
    )
    changeDate('Fecha de la reserva: desde', addDays(today, -2))
    const from = screen.getByLabelText('Fecha de la reserva: desde')
    expect(from).toHaveAttribute('aria-invalid', 'true')
    expect(document.getElementById(from.getAttribute('aria-describedby')!)).toBe(
      screen.getByRole('alert'),
    )
    expect(pager.getByRole('status')).toHaveTextContent('0–0 de 0 reservas')
    expect(screen.getByText('No hay reservas con estos filtros')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(pager.getByRole('status')).toHaveTextContent('1–12 de 1000 reservas')
  })

  it('pagina los pagos sin recortar totales, combina filtros y abre comprobantes de páginas posteriores', async () => {
    const { gateway, repository, seed, now } = clubFixture()
    const member = seed.members.find((item) => item.id === 'alba')!
    const base: Payment = {
      ...seed.payments[0],
      memberId: member.id,
      customer: { name: member.name, email: member.email },
    }
    await repository.transact((state) => {
      state.payments = Array.from({ length: 30 }, (_, index) => ({
        ...base,
        id: `receipt-${index + 1}`,
        invoiceNumber: `TEST-${String(index + 1).padStart(3, '0')}`,
        // Keep the current subscription active; payment date and covered month differ.
        period: index === 0 ? periodKey(now) : '2025-01',
        paidAt: new Date(2025, 0, index + 1, 23, 59).toISOString(),
        status: index % 2 === 0 ? 'paid' : 'voided',
      }))
      state.payments.push({
        ...base,
        id: 'foreign',
        memberId: 'hugo',
        invoiceNumber: 'FOREIGN',
        period: '2025-01',
      })
    })
    expect((await gateway.view('alba')).subscriptionActive).toBe(true)
    const persisted = localStorage.getItem(DATABASE_KEY)
    window.history.replaceState(null, '', '/pagos')
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    await user.click(await screen.findByRole('button', { name: 'Ver historial completo' }))
    const region = screen.getByRole('region', { name: 'Resultados de pagos' })
    const pager = within(screen.getByRole('navigation', { name: 'Paginación de movimientos' }))
    expect(within(region).getAllByRole('button')).toHaveLength(12)
    expect(region).not.toHaveTextContent('FOREIGN')
    expect(pager.getByRole('status')).toHaveTextContent('1–12 de 30 movimientos')
    const total = screen.getByText(money(15 * base.amountCents), { normalizer: (text) => text })
    expect(total).toBeVisible()
    await user.click(pager.getByRole('button', { name: 'Siguiente' }))
    expect(total).toHaveTextContent(money(15 * base.amountCents).replaceAll('\u00a0', ' '))
    await user.click(within(region).getByRole('button', { name: /TEST-018/ }))
    expect(screen.getByRole('dialog', { name: 'Tu comprobante' })).toHaveTextContent('TEST-018')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Filtros' }))
    await user.selectOptions(screen.getByLabelText('Estado del pago'), 'paid')
    expect(pager.getByRole('status')).toHaveTextContent('1–12 de 15 movimientos · Página 1 de 2')
    changeDate('Fecha de pago: desde', '2025-01-05')
    changeDate('Fecha de pago: hasta', '2025-01-09')
    expect(within(region).getAllByRole('button')).toHaveLength(3)
    expect(region).toHaveTextContent('TEST-009')
    expect(region).toHaveTextContent('TEST-005')
    expect(region).not.toHaveTextContent('TEST-010')
    const period = within(screen.getByRole('group', { name: 'Periodo de la cuota' }))
    await user.selectOptions(period.getByRole('combobox', { name: 'Año' }), '2024')
    expect(screen.getByText('No hay comprobantes con estos filtros')).toBeVisible()
    await user.selectOptions(period.getByRole('combobox', { name: 'Año' }), '2025')
    expect(within(region).getAllByRole('button')).toHaveLength(3)
    await user.selectOptions(period.getByRole('combobox', { name: 'Mes' }), '02')
    expect(screen.getByText('No hay comprobantes con estos filtros')).toBeVisible()
    await user.selectOptions(period.getByRole('combobox', { name: 'Mes' }), '01')
    fireEvent.change(screen.getByLabelText('Buscar pagos'), { target: { value: 'TEST-007' } })
    expect(pager.getByRole('status')).toHaveTextContent('1–1 de 1 movimientos')
    await user.click(screen.getByRole('button', { name: 'Limpiar filtros de pagos' }))
    await user.selectOptions(screen.getByLabelText('Resultados por página'), '24')
    expect(within(region).getAllByRole('button')).toHaveLength(24)
    expect(pager.getByRole('status')).toHaveTextContent('1–24 de 30 movimientos')
    expect(localStorage.getItem(DATABASE_KEY)).toBe(persisted)
  })
})
