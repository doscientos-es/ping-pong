import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import type { ClubState } from '../features/club/domain/model'
import { periodKey } from '../features/club/domain/rules'
import { DATABASE_KEY } from '../features/club/infrastructure/local-repository'
import { clubFixture } from '../test/club-fixture'
import { App } from './app'

vi.mock('./install-button', () => ({ InstallButton: () => null }))
beforeAll(async () => {
  await import('../features/reservations/booking-flow')
})

function receiveState(state: ClubState) {
  act(() => {
    localStorage.setItem(DATABASE_KEY, JSON.stringify(state))
    window.dispatchEvent(new StorageEvent('storage', { key: DATABASE_KEY }))
  })
}

describe('actualizaciones recibidas de otra pestaña (eventos simulados)', () => {
  it('actualiza los ajustes sin crear un borrador sucio cuando no se está editando', async () => {
    const { gateway, seed } = clubFixture()
    const user = userEvent.setup()
    localStorage.setItem('spin-club:profile', 'admin')
    window.location.hash = '#/configuracion'
    render(<App gateway={gateway} />)
    await user.click(await screen.findByRole('tab', { name: 'Cuotas' }))
    const price = await screen.findByLabelText('Cuota mensual (€)')
    expect(price).toHaveValue(39)
    seed.settings.plans[0].priceCents = 4200
    receiveState(seed)
    await waitFor(() => expect(price).toHaveValue(42))
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Descartar' })).toBeDisabled()
  })

  it('conserva el borrador y bloquea sobrescribir ajustes recibidos mientras se edita', async () => {
    const { gateway, repository, seed } = clubFixture()
    const user = userEvent.setup()
    localStorage.setItem('spin-club:profile', 'admin')
    window.location.hash = '#/configuracion'
    render(<App gateway={gateway} />)
    await user.click(await screen.findByRole('tab', { name: 'Cuotas' }))
    const price = await screen.findByLabelText('Cuota mensual (€)')
    fireEvent.change(price, { target: { value: '41' } })
    seed.settings.plans[0].priceCents = 4200
    receiveState(seed)
    expect(await screen.findByRole('alert')).toHaveTextContent('otra pestaña')
    expect(price).toHaveValue(41)
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
    expect((await repository.read()).settings.plans[0].priceCents).toBe(4200)
    await user.click(screen.getByRole('button', { name: 'Descartar' }))
    expect(price).toHaveValue(42)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('bloquea el acceso al anular la cuota actual desde otra pestaña sin cambiar de perfil', async () => {
    const { gateway, seed, now } = clubFixture()
    render(<App gateway={gateway} />)
    await screen.findByLabelText('Ir a una fecha')
    const payment = seed.payments.find(
      (item) => item.memberId === 'alba' && item.period === periodKey(now),
    )!
    payment.status = 'voided'
    payment.voidedAt = now.toISOString()
    receiveState(seed)
    await screen.findByRole('button', { name: 'Activar suscripción · pago simulado' })
    expect(screen.queryByLabelText('Ir a una fecha')).not.toBeInTheDocument()
    expect(localStorage.getItem('spin-club:profile')).not.toBe('admin')
  })
})
