import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createSeed } from '../club/infrastructure/seed'
import { InvoiceDialog } from './invoice-dialog'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('acciones del comprobante (APIs de descarga e impresión simuladas)', () => {
  it('presenta los datos fiscales y el IVA del pago con el mismo HTML seguro de la descarga', () => {
    const payment = createSeed().payments[0]
    payment.issuer = {
      legalName: 'Club Ficticio <script>SL</script>',
      nif: 'B12345674',
      address: 'Calle Emisor 1',
    }
    payment.customer.dni = '12345678Z'
    payment.customer.address = 'Calle Socio 2'
    payment.vatBps = 2100
    render(<InvoiceDialog payment={payment} onClose={vi.fn()} />)
    const dialog = screen.getByRole('dialog', { name: 'Tu comprobante' })
    expect(dialog).toHaveTextContent('Club Ficticio <script>SL</script>')
    expect(dialog).toHaveTextContent('B12345674')
    expect(dialog).toHaveTextContent('12345678Z')
    expect(dialog).toHaveTextContent('Calle Socio 2')
    expect(dialog).toHaveTextContent('IVA (21 %)')
    expect(dialog).toHaveTextContent('32,23')
    expect(dialog).toHaveTextContent('6,77')
    expect(dialog.querySelector('script')).toBeNull()
    expect(screen.queryByLabelText('Datos fiscales incompletos')).not.toBeInTheDocument()
  })

  it('descarga un HTML local con nombre seguro y libera la URL después de iniciarlo', () => {
    vi.useFakeTimers()
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:comprobante-local')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal(
      'URL',
      class extends URL {
        static createObjectURL = createObjectURL
        static revokeObjectURL = revokeObjectURL
      },
    )
    let download: { href: string; filename: string } | undefined
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      download = { href: this.href, filename: this.download }
    })
    const payment = createSeed().payments[0]
    payment.invoiceNumber = 'DEMO/2026:01'
    render(<InvoiceDialog payment={payment} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Descargar HTML' }))
    const blob = createObjectURL.mock.calls[0][0]
    expect(blob.type).toBe('text/html;charset=utf-8')
    expect(blob.size).toBeGreaterThan(0)
    expect(download?.filename).toBe('DEMO-2026-01.html')
    expect(download?.href).toBe('blob:comprobante-local')
    expect(revokeObjectURL).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:comprobante-local')
  })

  it.each(['paid', 'voided'] as const)(
    'imprime un comprobante %s sin cambiar el pago',
    (status) => {
      const payment = { ...createSeed().payments[0], status }
      if (status === 'voided') payment.voidedAt = new Date().toISOString()
      const before = structuredClone(payment)
      const print = vi.spyOn(window, 'print').mockImplementation(() => {})
      render(<InvoiceDialog payment={payment} onClose={vi.fn()} />)
      const dialog = screen.getByRole('dialog', { name: 'Tu comprobante' })
      expect(dialog).toHaveTextContent('Doscientos Club.')
      expect(dialog).toHaveTextContent('Suscripción mensual · Doscientos Club')
      expect(dialog).toHaveTextContent(status === 'paid' ? 'Pagado · demo' : 'Anulado · demo')
      expect(dialog).toHaveTextContent('SIN VALIDEZ FISCAL')
      expect(dialog).toHaveTextContent('momento del pago de la cuota')
      fireEvent.click(screen.getByRole('button', { name: 'Imprimir / PDF' }))
      expect(print).toHaveBeenCalledTimes(1)
      expect(payment).toEqual(before)
    },
  )
})
