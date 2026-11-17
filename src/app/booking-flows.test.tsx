import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { addDays } from '../features/club/domain/rules'
import { dateLabel } from '../shared/format'
import { clubFixture } from '../test/club-fixture'
import { App } from './app'

vi.mock('./install-button', () => ({ InstallButton: () => null }))
beforeAll(async () => {
  await import('../features/reservations/booking-flow')
})

describe('reserva guiada y gestión con persistencia real', () => {
  it('abre y actualiza la próxima reserva propia y permite continuar desde la navegación móvil', async () => {
    const { gateway, slot } = clubFixture()
    await gateway.book('alba', { ...slot, hour: 19 })
    await gateway.book('alba', slot)
    await gateway.book('marcos', { ...slot, hour: 17 })
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    const date = await screen.findByLabelText('Ir a una fecha')
    fireEvent.change(date, { target: { value: slot.date } })
    const information = screen.getByRole('complementary', { name: 'Información del club' })
    const next = () => within(information).getByRole('button', { name: 'Ver próxima reserva' })
    expect(next()).toHaveTextContent('18:00 – 19:00')
    expect(next()).toHaveTextContent('Pista 1')
    await user.click(next())
    const dialog = await screen.findByRole('dialog', { name: 'Pista 1' })
    expect(dialog).toHaveTextContent('18:00 – 19:00')
    expect(dialog).not.toHaveTextContent(/60\s*min/)
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar reserva' }))
    await user.click(within(dialog).getByRole('button', { name: 'Sí, cancelar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByLabelText('Ir a una fecha')).toHaveValue(slot.date)
    expect(next()).toHaveTextContent('19:00 – 20:00')
    const mobile = screen.getByRole('navigation', { name: 'Navegación móvil' })
    await user.click(within(mobile).getByRole('link', { name: 'Reservas' }))
    await screen.findByRole('heading', { name: 'Mis reservas', level: 1 })
    expect(within(mobile).getByRole('link', { name: 'Reservas' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('button', { name: /Pista 1.*Confirmada/ })).toHaveTextContent(
      '19:00 – 20:00',
    )
    await user.click(screen.getByRole('button', { name: /Canceladas/ }))
    expect(screen.getByRole('button', { name: /Pista 1.*Cancelada/ })).toHaveTextContent(
      '18:00 – 19:00',
    )
  })

  it('presenta día, pista y horario sin repetir la duración durante toda la reserva', async () => {
    const { gateway, slot, repository, seed } = clubFixture()
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    fireEvent.change(await screen.findByLabelText('Ir a una fecha'), {
      target: { value: slot.date },
    })
    const flow = screen.getByRole('region', { name: 'Reservar una pista' })
    expect(flow).not.toHaveTextContent(/60\s*min/)
    await user.click(within(flow).getByRole('button', { name: 'Elegir hora' }))
    expect(flow).not.toHaveTextContent(/60\s*min/)
    await user.click(within(flow).getByRole('button', { name: '18:00 – 19:00, 8 pistas libres' }))
    expect(flow).not.toHaveTextContent(/60\s*min/)
    await user.click(within(flow).getByRole('button', { name: 'Pista 1, disponible' }))
    await user.click(within(flow).getByRole('button', { name: 'Revisar reserva' }))
    expect(within(flow).getByText('Pista 1')).toBeInTheDocument()
    expect(within(flow).getByText('18:00 – 19:00')).toBeInTheDocument()
    expect(flow).not.toHaveTextContent(/60\s*min/)
    await user.click(within(flow).getByRole('button', { name: 'Confirmar reserva' }))
    const confirmation = await screen.findByRole('region', { name: 'Reserva confirmada' })
    expect(
      within(confirmation)
        .getAllByRole('term')
        .map((term) => term.textContent),
    ).toEqual(['Pista', 'Fecha', 'Horario'])
    const values = within(confirmation).getAllByRole('definition')
    expect(values[0]).toHaveTextContent('Pista 1')
    expect(values[1]).toHaveTextContent(
      dateLabel(slot.date, { weekday: 'long', day: 'numeric', month: 'long' }),
    )
    expect(values[2]).toHaveTextContent('18:00 – 19:00')
    expect(confirmation).not.toHaveTextContent(/60\s*min/)
    expect(within(confirmation).getByRole('link', { name: 'Ver mis reservas' })).toHaveAttribute(
      'href',
      '/reservas',
    )
    const state = await repository.read()
    expect(state.reservations).toHaveLength(1)
    expect(state.reservations[0]).toMatchObject(slot)
    expect(state.payments).toEqual(seed.payments)
  })

  it('deshabilita una hora completa y mantiene disponible el turno siguiente', async () => {
    const { gateway, slot } = clubFixture()
    for (let court = 1; court <= 8; court++) await gateway.book('marcos', { ...slot, court })
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    fireEvent.change(await screen.findByLabelText('Ir a una fecha'), {
      target: { value: slot.date },
    })
    await user.click(screen.getByRole('button', { name: 'Elegir hora' }))
    expect(screen.getByRole('button', { name: '18:00 – 19:00, completo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '19:00 – 20:00, 8 pistas libres' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: '19:00 – 20:00, 8 pistas libres' }))
    expect(screen.getByRole('heading', { name: 'Elige una pista' })).toHaveFocus()
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenLastCalledWith({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'instant',
    })
    expect(screen.getByRole('button', { name: 'Revisar reserva' })).toBeDisabled()
  })

  it('deshabilita pistas ocupadas y borra la selección al cambiar de día', async () => {
    const { gateway, slot } = clubFixture()
    await gateway.book('marcos', slot)
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    fireEvent.change(await screen.findByLabelText('Ir a una fecha'), {
      target: { value: slot.date },
    })
    await user.click(screen.getByRole('button', { name: 'Elegir hora' }))
    await user.click(screen.getByRole('button', { name: '18:00 – 19:00, 7 pistas libres' }))
    expect(screen.getByRole('button', { name: 'Pista 1, no disponible' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Pista 2, disponible' }))
    await user.click(screen.getByRole('button', { name: 'Revisar reserva' }))
    await user.click(screen.getByRole('button', { name: 'Cambiar día' }))
    fireEvent.change(screen.getByLabelText('Ir a una fecha'), {
      target: { value: addDays(slot.date, 1) },
    })
    await user.click(screen.getByRole('button', { name: 'Elegir hora' }))
    await user.click(screen.getByRole('button', { name: '18:00 – 19:00, 8 pistas libres' }))
    expect(screen.getByRole('button', { name: 'Pista 2, disponible' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: 'Revisar reserva' })).toBeDisabled()
  })

  it('reacciona a una ocupación mientras se revisa y permite elegir otra pista', async () => {
    const { gateway, slot, repository } = clubFixture()
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    fireEvent.change(await screen.findByLabelText('Ir a una fecha'), {
      target: { value: slot.date },
    })
    await user.click(screen.getByRole('button', { name: 'Elegir hora' }))
    await user.click(screen.getByRole('button', { name: '18:00 – 19:00, 8 pistas libres' }))
    await user.click(screen.getByRole('button', { name: 'Pista 1, disponible' }))
    await user.click(screen.getByRole('button', { name: 'Revisar reserva' }))
    await act(async () => {
      await gateway.book('marcos', slot)
    })
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Confirmar reserva' })).toBeDisabled(),
    )
    expect(screen.getByText(/Esta pista ya no está disponible/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cambiar pista' }))
    await user.click(screen.getByRole('button', { name: 'Pista 2, disponible' }))
    await user.click(screen.getByRole('button', { name: 'Revisar reserva' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    await screen.findByRole('heading', { name: 'Reserva confirmada' })
    expect((await repository.read()).reservations).toHaveLength(2)
  })

  it('admin crea desde un hueco y reprograma sin duplicar ni cobrar', async () => {
    const { gateway, slot, repository, seed } = clubFixture()
    localStorage.setItem('spin-club:profile', 'admin')
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    fireEvent.change(await screen.findByLabelText('Ir a una fecha'), {
      target: { value: slot.date },
    })
    await user.click(screen.getByRole('button', { name: 'Nueva reserva' }))
    const newDialog = await screen.findByRole('dialog', { name: 'Nueva reserva' })
    expect(await within(newDialog).findByLabelText('Ir a una fecha')).toHaveValue(slot.date)
    await user.click(within(newDialog).getByRole('button', { name: 'Cerrar' }))
    await user.click(screen.getByRole('button', { name: 'Pista 1, 18:00: disponible' }))
    let dialog = await screen.findByRole('dialog', { name: 'Nueva reserva' })
    expect(await within(dialog).findByRole('button', { name: 'Confirmar reserva' })).toBeDisabled()
    expect(within(dialog).queryByRole('option', { name: /Hugo Molina/ })).not.toBeInTheDocument()
    await user.selectOptions(within(dialog).getByLabelText('Socio de la reserva'), 'alba')
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar reserva' }))
    await within(dialog).findByRole('heading', { name: 'Reserva confirmada' })
    await user.click(within(dialog).getByRole('button', { name: 'Volver al calendario' }))
    const original = (await repository.read()).reservations[0]
    await user.click(screen.getByRole('button', { name: 'Pista 1, 18:00: reserva de Alba Martín' }))
    await user.click(screen.getByRole('button', { name: 'Modificar reserva' }))
    dialog = await screen.findByRole('dialog', { name: 'Modificar reserva' })
    expect(within(dialog).getByRole('button', { name: 'Guardar reserva' })).toBeEnabled()
    await user.click(within(dialog).getByRole('button', { name: 'Cambiar hora' }))
    await user.click(within(dialog).getByRole('button', { name: '19:00 – 20:00, 8 pistas libres' }))
    await user.click(within(dialog).getByRole('button', { name: 'Pista 2, disponible' }))
    await user.click(within(dialog).getByRole('button', { name: 'Revisar reserva' }))
    await user.click(within(dialog).getByRole('button', { name: 'Guardar reserva' }))
    await within(dialog).findByRole('heading', { name: 'Reserva actualizada' })
    await user.click(within(dialog).getByRole('button', { name: 'Volver al calendario' }))
    expect(screen.getByRole('button', { name: 'Pista 1, 18:00: disponible' })).toBeEnabled()
    expect(
      screen.getByRole('button', { name: 'Pista 2, 19:00: reserva de Alba Martín' }),
    ).toBeEnabled()
    const state = await repository.read()
    expect(state.reservations).toEqual([{ ...original, hour: 19, court: 2 }])
    expect(state.payments).toEqual(seed.payments)
  })

  it('copia horarios solo al borrador, permite descartarlos y guarda un cierre', async () => {
    const { gateway, repository, seed } = clubFixture()
    localStorage.setItem('spin-club:profile', 'admin')
    window.history.replaceState(null, '', '/configuracion')
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    await screen.findByLabelText('Apertura Lunes franja 1')
    await user.selectOptions(screen.getByLabelText('Apertura Lunes franja 1'), '10')
    await user.click(screen.getByRole('button', { name: 'Copiar horarios' }))
    const dialog = await screen.findByRole('dialog', { name: 'Copiar horarios' })
    expect(dialog).not.toHaveAttribute('aria-describedby')
    expect(dialog).toHaveTextContent('Se reemplazarán las franjas de los días seleccionados.')
    expect(dialog).toHaveTextContent('No se guardan hasta pulsar «Guardar cambios».')
    await user.click(within(dialog).getByRole('button', { name: 'Aplicar al borrador' }))
    expect(screen.getByLabelText('Apertura Martes franja 1')).toHaveValue('10')
    expect((await repository.read()).settings).toEqual(seed.settings)
    await user.click(screen.getByRole('button', { name: 'Descartar' }))
    expect(screen.getByLabelText('Apertura Martes franja 1')).toHaveValue('8')
    await user.click(screen.getByRole('checkbox', { name: 'Abrir Miércoles' }))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled(),
    )
    expect(
      (await repository.read()).settings.weekly.find((day) => day.day === 3)?.intervals,
    ).toEqual([])
  })
})
