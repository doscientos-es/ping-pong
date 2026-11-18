import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import type { Reservation } from '../../club/domain/model'
import { startTime } from '../../club/domain/rules'
import { BookingConfirmation } from './booking-confirmation'

describe('confirmación de reserva', () => {
  it('ofrece un evento descargable con la fecha y la pista de la reserva', () => {
    const reservation: Reservation = {
      id: 'reserva-123',
      memberId: 'socio',
      court: 3,
      date: '2027-06-21',
      hour: 18,
      status: 'confirmed',
      createdAt: '2026-11-17T12:00:00.000Z',
    }
    render(
      <MemoryRouter>
        <BookingConfirmation
          reservation={reservation}
          editing={false}
          admin={false}
          headingRef={createRef()}
          onRestart={() => {}}
        />
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: 'Añadir al calendario' })
    expect(link).toHaveAttribute('download', 'reserva-perception.ics')
    const href = link.getAttribute('href')!
    expect(href).toMatch(/^data:text\/calendar;charset=utf-8,/)
    const calendar = decodeURIComponent(href.split(',')[1])
    const utc = (value: number) =>
      new Date(value)
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}Z$/, 'Z')
    const start = startTime(reservation.date, reservation.hour)
    expect(calendar).toContain('METHOD:PUBLISH\r\n')
    expect(calendar).toContain('UID:reserva-123@doscientos.club\r\n')
    expect(calendar).toContain(`DTSTART:${utc(start)}\r\n`)
    expect(calendar).toContain(`DTEND:${utc(start + 60 * 60 * 1000)}\r\n`)
    expect(calendar).toContain('Perception · Pista 3')
    expect(screen.getByText(/no se actualizan automáticamente/)).toBeInTheDocument()
  })
})
