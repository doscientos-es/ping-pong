import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Reservation } from '../club/domain/model'
import { ReservationCard } from './reservation-card'

const reservation: Reservation = {
  id: 'reservation',
  memberId: 'alba',
  court: 1,
  date: '2026-11-18',
  hour: 18,
  status: 'confirmed',
  createdAt: '2026-11-17T10:00:00.000Z',
}

describe('estados y acciones de las tarjetas de reserva', () => {
  it.each([
    {
      status: 'confirmed' as const,
      history: false,
      label: 'Confirmada',
    },
    {
      status: 'confirmed' as const,
      history: true,
      label: 'Jugada',
    },
    {
      status: 'cancelled' as const,
      history: true,
      label: 'Cancelada',
    },
  ])('distingue $label y conserva el acceso al detalle', ({ status, history, label }) => {
    const onClick = vi.fn()
    render(
      <ReservationCard
        reservation={{ ...reservation, status }}
        history={history}
        onClick={onClick}
      />,
    )
    const card = screen.getByRole('button', { name: new RegExp(`Pista 1.*${label}`) })
    expect(card).toHaveTextContent('18:00 – 19:00')
    expect(card).not.toHaveTextContent(/60\s*min/)
    fireEvent.click(card)
    expect(onClick).toHaveBeenCalledOnce()
  })
})
