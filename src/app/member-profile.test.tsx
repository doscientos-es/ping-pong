import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { money } from '../shared/format'
import { clubFixture } from '../test/club-fixture'
import { App } from './app'

vi.mock('./install-button', () => ({ InstallButton: () => null }))

describe('ficha de socio', () => {
  it('abre una página navegable con historial propio y conserva las bajas y reactivaciones', async () => {
    const { gateway, repository, seed, slot } = clubFixture()
    const reservation = await gateway.book('alba', slot)
    await gateway.cancel('admin', reservation.id)
    const voided = seed.payments.find((item) => item.memberId === 'alba')!
    await gateway.voidPayment('admin', voided.id)
    localStorage.setItem('spin-club:profile', 'admin')
    window.history.replaceState(null, '', '/socios')
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    const link = await screen.findByRole('link', { name: /Alba Martín/ })
    expect(link).toHaveAttribute('href', '/socios/alba')
    await user.click(link)
    await screen.findByRole('heading', { name: 'Ficha del socio', level: 1 })
    expect(window.location.pathname).toBe('/socios/alba')
    expect(document.title).toBe('Ficha del socio · Perception')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Cancelada')).toBeVisible()
    expect(screen.getByText('Anulado')).toBeVisible()
    expect(screen.getByText(voided.invoiceNumber, { exact: false })).toBeVisible()
    expect(
      screen.queryByText(seed.payments.find((item) => item.memberId === 'marcos')!.invoiceNumber, {
        exact: false,
      }),
    ).not.toBeInTheDocument()
    const expectedTotal = seed.payments
      .filter((item) => item.memberId === 'alba' && item.id !== voided.id)
      .reduce((sum, item) => sum + item.amountCents, 0)
    const statistic = screen.getByText('Total cobrado').parentElement!
    expect(
      within(statistic).getByText(money(expectedTotal), { normalizer: (text) => text }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Dar de baja al socio' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar baja' }))
    await screen.findByRole('button', { name: 'Reactivar acceso' })
    expect((await repository.read()).members.find((item) => item.id === 'alba')?.active).toBe(false)
    await user.click(screen.getByRole('button', { name: 'Reactivar acceso' }))
    await screen.findByRole('button', { name: 'Dar de baja al socio' })
    expect(
      (await repository.read()).reservations.find((item) => item.id === reservation.id)?.status,
    ).toBe('cancelled')
    await user.click(screen.getByRole('link', { name: 'Volver a socios' }))
    expect(await screen.findByRole('heading', { name: 'Socios', level: 1 })).toBeVisible()
  })

  it('abre directamente, valida cambios y mantiene los datos tras recargar', async () => {
    const { gateway, repository } = clubFixture()
    localStorage.setItem('spin-club:profile', 'admin')
    window.history.replaceState(null, '', '/socios/alba')
    const user = userEvent.setup()
    const app = render(<App gateway={gateway} />)
    await screen.findByRole('heading', { name: 'Ficha del socio' })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'marcos@perception.example' },
    })
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe')
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'alba-nueva@doscientos.example' },
    })
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(async () =>
      expect((await repository.read()).members.find((item) => item.id === 'alba')?.email).toBe(
        'alba-nueva@doscientos.example',
      ),
    )
    app.unmount()
    render(<App gateway={gateway} />)
    expect(await screen.findByLabelText('Email')).toHaveValue('alba-nueva@doscientos.example')
  })

  it.each(['/socios/inexistente', '/socios/admin'])(
    'muestra una salida clara para %s',
    async (path) => {
      const { gateway } = clubFixture()
      localStorage.setItem('spin-club:profile', 'admin')
      window.history.replaceState(null, '', path)
      render(<App gateway={gateway} />)
      await screen.findByRole('heading', { name: 'Socio no encontrado' })
      expect(screen.getByRole('link', { name: 'Volver a socios' })).toHaveAttribute(
        'href',
        '/socios',
      )
      expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
    },
  )
})
