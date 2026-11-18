import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'

import { createClubService } from '../features/club/application/club-service'
import { addDays, dateKey } from '../features/club/domain/rules'
import { DATABASE_KEY } from '../features/club/infrastructure/local-repository'
import { createDemoSeed } from '../features/club/infrastructure/seed'
import { clubFixture } from '../test/club-fixture'
import { App } from './app'

vi.mock('./install-button', () => ({ InstallButton: () => null }))

it('con cuota pendiente permite consultar y cancelar reservas propias y abrir comprobantes, pero no reservar', async () => {
  const { gateway, repository, slot, now, seed } = clubFixture()
  const past = addDays(dateKey(now), -35)
  const receipt = seed.payments.find(
    (payment) => payment.memberId === 'hugo' && payment.period === past.slice(0, 7),
  )!
  await repository.transact((state) => {
    const own = {
      ...slot,
      id: 'own-upcoming',
      memberId: 'hugo',
      status: 'confirmed' as const,
      createdAt: now.toISOString(),
    }
    state.reservations.push(
      own,
      { ...own, id: 'own-past', date: past },
      { ...own, id: 'other-upcoming', memberId: 'alba', court: 2 },
    )
  })
  localStorage.setItem('spin-club:profile', 'hugo')
  const user = userEvent.setup()
  render(<App gateway={gateway} />)
  await screen.findByRole('heading', { name: 'Activa tu suscripción para reservar' })
  expect(screen.queryByLabelText('Ir a una fecha')).not.toBeInTheDocument()
  const nav = within(screen.getByRole('navigation', { name: 'Navegación principal' }))

  await user.click(nav.getByRole('link', { name: 'Mis reservas' }))
  const results = await screen.findByRole('region', { name: 'Resultados de reservas' })
  expect(within(results).queryByRole('button', { name: /Pista 2/ })).not.toBeInTheDocument()
  await user.click(within(results).getByRole('button', { name: /Pista 1/ }))
  const reservation = within(screen.getByRole('dialog', { name: 'Pista 1' }))
  await user.click(reservation.getByRole('button', { name: 'Cancelar reserva' }))
  await user.click(reservation.getByRole('button', { name: 'Sí, cancelar reserva' }))
  await screen.findByRole('button', { name: 'Canceladas (1)' })

  await user.click(nav.getByRole('link', { name: 'Historial de partidas' }))
  await user.click(
    within(screen.getByRole('region', { name: 'Resultados de reservas' })).getByRole('button', {
      name: /Pista 1/,
    }),
  )
  expect(
    screen.getByRole('button', { name: `Descargar comprobante ${receipt.invoiceNumber}` }),
  ).toBeVisible()
  await user.keyboard('{Escape}')

  await user.click(nav.getByRole('link', { name: 'Mis pagos' }))
  const payments = within(await screen.findByRole('region', { name: 'Resultados de pagos' }))
  await user.click(payments.getByRole('button', { name: new RegExp(receipt.invoiceNumber) }))
  expect(screen.getByRole('dialog', { name: 'Tu comprobante' })).toHaveTextContent(
    receipt.invoiceNumber,
  )
})

it('el reinicio solo sustituye los datos locales después de confirmar y vuelve a la selección de perfil', async () => {
  const { repository, now } = clubFixture()
  const gateway = createClubService(repository, () => now, createDemoSeed)
  const original = localStorage.getItem(DATABASE_KEY)
  localStorage.setItem('spin-club:profile', 'admin')
  localStorage.setItem('unrelated-local-setting', 'conservar')
  window.history.replaceState(null, '', '/configuracion')
  const user = userEvent.setup()
  render(<App gateway={gateway} />)

  const trigger = await screen.findByRole('button', { name: 'Reiniciar demo' })
  await user.click(trigger)
  let dialog = within(screen.getByRole('dialog', { name: '¿Reiniciar la demo?' }))
  expect(dialog.getByRole('button', { name: 'Conservar datos' })).toHaveFocus()
  await user.click(dialog.getByRole('button', { name: 'Conservar datos' }))
  expect(localStorage.getItem(DATABASE_KEY)).toBe(original)

  await user.click(trigger)
  dialog = within(screen.getByRole('dialog', { name: '¿Reiniciar la demo?' }))
  await user.click(dialog.getByRole('button', { name: 'Reiniciar y sustituir datos' }))
  await screen.findByRole('heading', { name: 'Perception' })
  expect(window.location.pathname).toBe('/login')
  expect(localStorage.getItem('unrelated-local-setting')).toBe('conservar')
  const fresh = await repository.read()
  expect(fresh.members.filter((member) => member.role === 'member')).toHaveLength(80)
  const bookingsByMember = new Map<string, number>()
  for (const { memberId } of fresh.reservations) {
    bookingsByMember.set(memberId, (bookingsByMember.get(memberId) ?? 0) + 1)
  }
  expect(bookingsByMember.size).toBeGreaterThan(70)
  expect(Math.max(...bookingsByMember.values())).toBeLessThanOrEqual(4)
  expect(fresh.settings.plans.map((plan) => plan.priceCents)).toEqual([3900, 2900])
  expect(fresh.accounting.entries.some((entry) => entry.status === 'pending')).toBe(true)
  expect(fresh.reservations.some((item) => item.status === 'cancelled')).toBe(true)
  await user.click(screen.getByRole('button', { name: /Álex · Administración/ }))
  await waitFor(() => expect(window.location.pathname).toBe('/'))
  expect(await screen.findByRole('heading', { name: 'Calendario del club' })).toBeVisible()

  const nav = within(screen.getByRole('navigation', { name: 'Navegación principal' }))
  await user.click(nav.getByRole('link', { name: 'Configuración' }))
  await user.click(await screen.findByRole('tab', { name: 'Datos fiscales' }))
  expect(screen.getByLabelText('Razón social')).toHaveValue('Perception Demo, S. L.')
  expect(screen.getByLabelText('NIF del emisor')).toHaveValue('B00000000')

  await user.click(nav.getByRole('link', { name: 'Pagos y comprobantes' }))
  await user.click(await screen.findByRole('tab', { name: 'Comprobantes' }))
  await user.type(screen.getByRole('searchbox', { name: 'Buscar pagos' }), 'Alba Martín')
  await user.click(await screen.findByRole('button', { name: /Alba Martín.*Tarjeta/ }))
  const receipt = within(screen.getByRole('dialog', { name: 'Tu comprobante' }))
  expect(receipt.getByText('Perception Demo, S. L.')).toBeVisible()
  expect(receipt.getByText('DNI / NIE: Z9999990D')).toBeVisible()
  expect(receipt.getByText('IVA (21 %)')).toBeVisible()
  expect(receipt.queryByText('Datos fiscales incompletos.')).not.toBeInTheDocument()
})
