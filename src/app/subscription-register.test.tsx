import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DATABASE_KEY } from '../features/club/infrastructure/local-repository'
import { clubFixture } from '../test/club-fixture'
import { App } from './app'

vi.mock('./install-button', () => ({ InstallButton: () => null }))

describe('control de cuotas', () => {
  it('combina búsqueda, estado, cuota y acceso sin escribir datos y permite limpiar los filtros', async () => {
    const { gateway, repository, seed } = clubFixture()
    await gateway.saveSettings('admin', {
      ...seed.settings,
      plans: [...seed.settings.plans, { id: 'flexible', name: 'Cuota flexible', priceCents: 2500 }],
    })
    const hugo = seed.members.find((member) => member.id === 'hugo')!
    await gateway.saveMember('admin', { ...hugo, planId: 'flexible' }, hugo.id)
    const persisted = localStorage.getItem(DATABASE_KEY)
    localStorage.setItem('spin-club:profile', 'admin')
    window.history.replaceState(null, '', '/pagos')
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    const table = await screen.findByRole('table', { name: 'Cuotas por socio' })
    await user.selectOptions(screen.getByLabelText('Estado de la cuota'), 'pending')
    await user.selectOptions(screen.getByLabelText('Cuota asignada'), 'flexible')
    await user.selectOptions(screen.getByLabelText('Acceso del socio'), 'active')
    fireEvent.change(screen.getByLabelText('Buscar pagos'), { target: { value: 'hugo' } })
    expect(within(table).getByRole('row', { name: /Hugo Molina/ })).toHaveTextContent('Pendiente')
    expect(within(table).queryByRole('row', { name: /Alba Martín/ })).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Acceso del socio'), 'inactive')
    expect(screen.getByText('No hay socios con estos filtros.')).toBeVisible()
    expect(localStorage.getItem(DATABASE_KEY)).toBe(persisted)
    await user.click(screen.getByRole('button', { name: 'Limpiar filtros de cuotas' }))
    expect(screen.getByLabelText('Buscar pagos')).toHaveValue('')
    expect(screen.getByLabelText('Estado de la cuota')).toHaveValue('all')
    expect(screen.getByLabelText('Cuota asignada')).toHaveValue('all')
    expect(screen.getByLabelText('Acceso del socio')).toHaveValue('all')
    expect(within(table).getByRole('row', { name: /Hugo Molina/ })).toBeVisible()
    const inactive = within(table).getByRole('row', { name: /Elena Soler/ })
    expect(within(inactive).getByRole('button', { name: 'Registrar pago' })).toBeDisabled()
    expect((await repository.read()).members.find((member) => member.id === hugo.id)?.planId).toBe(
      'flexible',
    )
  })

  it('pagina socios y vuelve a la primera página al filtrar', async () => {
    const { gateway, repository, seed } = clubFixture()
    const member = seed.members.find((item) => item.id === 'hugo')!
    await repository.transact((state) => {
      for (let index = 0; index < 15; index++) {
        state.members.push({
          ...member,
          id: `extra-${index}`,
          number: `EX-${index}`,
          name: `Socio adicional ${index}`,
          email: `extra${index}@doscientos.example`,
        })
      }
    })
    localStorage.setItem('spin-club:profile', 'admin')
    window.history.replaceState(null, '', '/pagos')
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    const table = await screen.findByRole('table', { name: 'Cuotas por socio' })
    const pager = screen.getByRole('navigation', { name: 'Paginación de socios' })
    expect(within(pager).getByRole('status')).toHaveTextContent('1–12 de 24 socios')
    await user.click(within(pager).getByRole('button', { name: 'Siguiente' }))
    expect(within(pager).getByRole('status')).toHaveTextContent('13–24 de 24 socios')
    await user.selectOptions(screen.getByLabelText('Estado de la cuota'), 'pending')
    await waitFor(() =>
      expect(within(pager).getByRole('status')).toHaveTextContent('1–12 de 17 socios'),
    )
    expect(within(table).getByRole('row', { name: /Hugo Molina/ })).toBeVisible()
  })
})
