import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { usePagination } from '../use-pagination'
import { Pagination } from './pagination'

const records = Array.from({ length: 10000 }, (_, index) => index + 1)

function List({ count = records.length, filter = '' }: { count?: number; filter?: string }) {
  const pagination = usePagination(records.slice(0, count), filter)
  return (
    <>
      <ul id="records" aria-label="Registros">
        {pagination.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <Pagination pagination={pagination} label="registros" controls="records" />
    </>
  )
}

describe('paginación local accesible con renderizado acotado', () => {
  it('limita 10.000 registros, mantiene foco/teclado y permite saltar a los extremos', async () => {
    const user = userEvent.setup()
    render(<List />)
    expect(screen.getAllByRole('listitem')).toHaveLength(12)
    expect(screen.getByRole('status')).toHaveTextContent(
      '1–12 de 10000 registros · Página 1 de 834',
    )
    expect(screen.getByRole('button', { name: 'Primera' })).toBeDisabled()
    const next = screen.getByRole('button', { name: 'Siguiente' })
    expect(document.getElementById(next.getAttribute('aria-controls')!)).toBe(
      screen.getByRole('list'),
    )
    next.focus()
    await user.keyboard('{Enter}')
    expect(next).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent('13–24 de 10000')
    expect(within(screen.getByRole('list')).getAllByRole('listitem')[0]).toHaveTextContent('13')
    await user.click(screen.getByRole('button', { name: 'Última' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getByRole('status')).toHaveTextContent('9997–10000 de 10000')
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Primera' }))
    await user.selectOptions(screen.getByLabelText('Resultados por página'), '48')
    expect(screen.getAllByRole('listitem')).toHaveLength(48)
    expect(screen.getByRole('status')).toHaveTextContent('1–48 de 10000')
  })

  it('ajusta la página al borrar datos, reinicia con filtros y representa el vacío sin páginas inválidas', async () => {
    const user = userEvent.setup()
    const app = render(<List count={40} />)
    await user.click(screen.getByRole('button', { name: 'Última' }))
    app.rerender(<List count={13} />)
    expect(screen.getByRole('status')).toHaveTextContent('13–13 de 13 registros · Página 2 de 2')
    app.rerender(<List count={40} />)
    expect(screen.getByRole('status')).toHaveTextContent('Página 2 de 4')
    app.rerender(<List count={40} filter="pista-2" />)
    expect(screen.getByRole('status')).toHaveTextContent('Página 1 de 4')
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    await user.selectOptions(screen.getByLabelText('Resultados por página'), '24')
    expect(screen.getByRole('status')).toHaveTextContent('1–24 de 40 registros · Página 1 de 2')
    app.rerender(<List count={0} filter="pista-2" />)
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(screen.getByRole('status')).toHaveTextContent('0–0 de 0 registros · Página 1 de 1')
    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled()
  })
})
