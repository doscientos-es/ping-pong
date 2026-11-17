import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Modal } from './modal'

describe('descripción accesible de los diálogos', () => {
  it('enlaza la descripción cuando aporta información', () => {
    render(
      <Modal open onClose={vi.fn()} title="Anular cuota" description="El comprobante se conserva.">
        <button>Confirmar</button>
      </Modal>,
    )

    const dialog = screen.getByRole('dialog', { name: 'Anular cuota' })
    expect(dialog).toHaveAccessibleDescription('El comprobante se conserva.')
    expect(document.getElementById(dialog.getAttribute('aria-describedby')!)).toHaveTextContent(
      'El comprobante se conserva.',
    )
  })

  it('omite la descripción y su referencia cuando no hacen falta', () => {
    render(
      <Modal open onClose={vi.fn()} title="Nueva reserva">
        <button>Elegir hora</button>
      </Modal>,
    )

    const dialog = screen.getByRole('dialog', { name: 'Nueva reserva' })
    expect(dialog).not.toHaveAttribute('aria-describedby')
    expect(dialog).not.toHaveAccessibleDescription()
    expect(dialog.querySelector('p')).toBeNull()
    expect(screen.getByRole('button', { name: 'Elegir hora' })).toBeInTheDocument()
  })
})
