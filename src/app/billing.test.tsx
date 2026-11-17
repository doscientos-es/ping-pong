import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { clubFixture } from '../test/club-fixture'
import { App } from './app'

vi.mock('./install-button', () => ({ InstallButton: () => null }))

describe('configuración y formularios fiscales con repositorio local real', () => {
  it('valida el emisor, conserva su borrador entre pestañas y guarda/descarta los datos fiscales', async () => {
    const { gateway, repository } = clubFixture()
    localStorage.setItem('spin-club:profile', 'admin')
    window.history.replaceState(null, '', '/configuracion')
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    await user.click(await screen.findByRole('tab', { name: 'Datos fiscales' }))
    expect(screen.getByRole('tabpanel', { name: 'Datos fiscales' })).toBeVisible()
    fireEvent.change(screen.getByLabelText('Razón social'), {
      target: { value: 'Club Ficticio SL' },
    })
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Completa el NIF')
    expect((await repository.read()).settings.issuer).toBeUndefined()
    fireEvent.change(screen.getByLabelText('NIF del emisor'), { target: { value: 'b-12345674' } })
    fireEvent.change(screen.getByLabelText('Dirección fiscal'), {
      target: { value: 'Calle de Prueba 1, 08001 Barcelona, España' },
    })
    await user.click(screen.getByRole('tab', { name: 'Horarios' }))
    expect(screen.queryByRole('textbox', { name: 'NIF del emisor' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Datos fiscales' }))
    expect(screen.getByLabelText('Razón social')).toHaveValue('Club Ficticio SL')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled(),
    )
    expect((await repository.read()).settings.issuer).toEqual({
      legalName: 'Club Ficticio SL',
      nif: 'B12345674',
      address: 'Calle de Prueba 1, 08001 Barcelona, España',
    })
    expect(screen.getByLabelText('NIF del emisor')).toHaveValue('B12345674')
    fireEvent.change(screen.getByLabelText('Dirección fiscal'), {
      target: { value: 'Sin guardar' },
    })
    await user.click(screen.getByRole('button', { name: 'Descartar' }))
    expect(screen.getByLabelText('Dirección fiscal')).toHaveValue(
      'Calle de Prueba 1, 08001 Barcelona, España',
    )
  })

  it('crea y edita socios con DNI y dirección sin perder sus datos', async () => {
    const { gateway, repository } = clubFixture()
    localStorage.setItem('spin-club:profile', 'admin')
    window.history.replaceState(null, '', '/socios')
    const user = userEvent.setup()
    render(<App gateway={gateway} />)
    await user.click(await screen.findByRole('button', { name: 'Nuevo socio' }))
    const dialog = screen.getByRole('dialog', { name: 'Nuevo socio' })
    fireEvent.change(within(dialog).getByLabelText('Nombre y apellidos'), {
      target: { value: 'Socio de Prueba Fiscal' },
    })
    fireEvent.change(within(dialog).getByLabelText('Email'), {
      target: { value: 'sociofiscal@doscientos.example' },
    })
    fireEvent.change(within(dialog).getByLabelText('DNI / NIE'), {
      target: { value: '12345678Z' },
    })
    fireEvent.change(within(dialog).getByLabelText('Dirección postal'), {
      target: { value: 'Calle Socio 2, 28001 Madrid, España' },
    })
    await user.click(within(dialog).getByRole('button', { name: 'Crear socio' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const member = (await repository.read()).members.find(
      (item) => item.email === 'sociofiscal@doscientos.example',
    )!
    expect(member).toMatchObject({
      dni: '12345678Z',
      address: 'Calle Socio 2, 28001 Madrid, España',
    })
    await user.click(screen.getByRole('link', { name: /Socio de Prueba Fiscal/ }))
    expect(window.location.pathname).toBe(`/socios/${member.id}`)
    expect(screen.getByLabelText('DNI / NIE')).toHaveValue('12345678Z')
    expect(screen.getByLabelText('Dirección postal')).toHaveValue(
      'Calle Socio 2, 28001 Madrid, España',
    )
    fireEvent.change(screen.getByLabelText('Dirección postal'), { target: { value: 'Otra calle' } })
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(async () =>
      expect((await repository.read()).members.find((item) => item.id === member.id)).toMatchObject(
        {
          dni: '12345678Z',
          address: 'Otra calle',
        },
      ),
    )
  })
})
