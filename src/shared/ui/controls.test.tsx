import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { Avatar } from './avatar'
import { Button, ButtonLink, IconButton } from './button'

describe('adaptadores de @doscientos/ui', () => {
  it('conserva botones de formulario, acciones deshabilitadas y tipo por defecto seguro', async () => {
    const user = userEvent.setup()
    const submit = vi.fn()
    const action = vi.fn()
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <Button onClick={action}>Acción</Button>
        <Button disabled onClick={action}>
          Bloqueado
        </Button>
        <Button type="submit">Confirmar</Button>
      </form>,
    )
    expect(screen.getByRole('button', { name: 'Acción' })).toHaveAttribute('data-slot', 'button')
    await user.click(screen.getByRole('button', { name: 'Acción' }))
    await user.click(screen.getByRole('button', { name: 'Bloqueado' }))
    expect(action).toHaveBeenCalledTimes(1)
    expect(submit).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(submit).toHaveBeenCalledTimes(1)
  })

  it('expone nombre accesible y tooltip al enfocar un botón con icono', async () => {
    const user = userEvent.setup()
    const action = vi.fn()
    render(
      <IconButton label="Siguiente día" onClick={action}>
        <span aria-hidden="true">→</span>
      </IconButton>,
    )
    const button = screen.getByRole('button', { name: 'Siguiente día' })
    await user.tab()
    expect(button).toHaveFocus()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Siguiente día')
    await user.keyboard('{Enter}')
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('reutiliza tooltip y fallback de avatar sin perder el contenido del botón', async () => {
    const user = userEvent.setup()
    render(
      <Button tooltip="Cambiar perfil">
        <Avatar aria-hidden="true">AL</Avatar>Alba
      </Button>,
    )
    await user.tab()
    expect(screen.getByRole('button', { name: 'Alba' })).toHaveFocus()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Cambiar perfil')
    expect(screen.getByText('AL')).toHaveAttribute('data-slot', 'avatar-fallback')
  })

  it('navega sin recarga y respeta la cancelación del evento del enlace', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ButtonLink to="/socios" onClick={(event) => event.preventDefault()}>
          Cancelar navegación
        </ButtonLink>
        <ButtonLink to="/socios">Ver socios</ButtonLink>
        <Routes>
          <Route path="/" element={<h1>Calendario</h1>} />
          <Route path="/socios" element={<h1>Socios</h1>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Ver socios' })).toHaveAttribute('href', '/socios')
    await user.click(screen.getByRole('link', { name: 'Cancelar navegación' }))
    expect(screen.getByRole('heading', { name: 'Calendario' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Ver socios' }))
    expect(screen.getByRole('heading', { name: 'Socios' })).toBeInTheDocument()
  })
})
