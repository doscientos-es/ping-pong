import { fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { CourtGrid } from './court-grid'

function renderGrid(overrides: Partial<ComponentProps<typeof CourtGrid>> = {}) {
  const props: ComponentProps<typeof CourtGrid> = {
    date: '2026-11-17',
    hours: [19, 20, 21],
    opening: [19, 20, 21],
    daily: [],
    now: new Date(2026, 10, 17, 20, 35),
    members: [],
    onBook: vi.fn(),
    onDetail: vi.fn(),
    ...overrides,
  }
  return { ...render(<CourtGrid {...props} />), props }
}

describe('indicador de hora actual en la cuadrícula', () => {
  it('señala la franja actual de hoy sin añadir elementos accesibles ni enfocables', () => {
    renderGrid()
    const indicators = screen.getAllByTestId('current-time-indicator')
    expect(indicators).toHaveLength(1)
    expect(indicators[0]).toHaveAttribute('aria-hidden', 'true')
    expect(indicators[0]).not.toHaveAttribute('tabindex')
    const row = screen.getByRole('rowheader', { name: '20:00' }).closest('tr')
    expect(indicators[0].closest('tr')).toBe(row)
  })

  it.each([
    { date: '2026-11-16' },
    { date: '2026-11-18' },
    { hours: [8, 9] },
    { now: new Date(2026, 10, 17, 23) },
  ])('no señala otros días ni una franja que no se está mostrando: %j', (overrides) => {
    renderGrid(overrides)
    expect(screen.queryByTestId('current-time-indicator')).not.toBeInTheDocument()
  })

  it('cambia de fila con el reloj y desaparece cuando termina el día mostrado', () => {
    const { props, rerender } = renderGrid()
    rerender(<CourtGrid {...props} now={new Date(2026, 10, 17, 21)} />)
    expect(screen.getByTestId('current-time-indicator').closest('tr')).toBe(
      screen.getByRole('rowheader', { name: '21:00' }).closest('tr'),
    )
    rerender(<CourtGrid {...props} now={new Date(2026, 10, 18)} />)
    expect(screen.queryByTestId('current-time-indicator')).not.toBeInTheDocument()
  })

  it('muestra las ocho pistas juntas y conserva las acciones de reserva y detalle', () => {
    const reservation = {
      id: 'current-reservation',
      memberId: 'alba',
      date: '2026-11-17',
      hour: 20,
      court: 1,
      status: 'confirmed' as const,
      createdAt: new Date(2026, 10, 16).toISOString(),
    }
    const { props } = renderGrid({ daily: [reservation] })
    expect(screen.getByRole('region', { name: /Disponibilidad de las pistas/ })).toHaveAttribute(
      'tabindex',
      '0',
    )
    for (let court = 1; court <= 8; court++) {
      expect(screen.getByRole('columnheader', { name: `Pista ${court}` })).toBeInTheDocument()
    }
    const occupied = screen.getByRole('button', { name: 'Pista 1, 20:00: reserva de socio' })
    const past = screen.getByRole('button', { name: 'Pista 2, 20:00: franja pasada' })
    expect(past).toBeDisabled()
    fireEvent.click(occupied)
    expect(props.onDetail).toHaveBeenCalledWith(reservation)
    expect(screen.getAllByTestId('current-time-indicator')).toHaveLength(1)
    const available = screen.getByRole('button', { name: 'Pista 8, 21:00: disponible' })
    expect(available).toHaveTextContent('Libre')
    fireEvent.click(available)
    expect(props.onBook).toHaveBeenCalledWith({ date: props.date, hour: 21, court: 8 })
  })
})
