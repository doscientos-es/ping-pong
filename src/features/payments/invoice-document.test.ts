import { describe, expect, it } from 'vitest'

import { createSeed } from '../club/infrastructure/seed'
import { invoiceDetails } from './invoice-details'
import { invoiceHtml } from './invoice-document'

describe('documentos mensuales locales', () => {
  it('identifica el periodo y el estado y escapa contenido introducido por el usuario', () => {
    const payment = createSeed(new Date(2026, 10, 17, 12)).payments[0]
    payment.customer.name = '<img src=x onerror=alert(1)>'
    payment.customer.email = 'demo&"@doscientos.example'
    payment.plan = { id: 'snapshot', name: '<script>cuota</script>' }
    payment.customer.dni = '<script>dni</script>'
    payment.customer.address = '<svg onload=alert(1)>'
    payment.issuer = {
      legalName: '<img src=x onerror=alert(1)>',
      nif: '<script>nif</script>',
      address: '</style><script>dirección</script>',
    }
    payment.status = 'voided'
    payment.voidedAt = new Date(2026, 10, 17, 12).toISOString()
    const html = invoiceHtml(payment)
    expect(html).toContain('<h1>Doscientos Club.</h1>')
    expect(html).toContain('septiembre de 2026')
    expect(html).toContain('Reservas ilimitadas')
    expect(html).toContain('SIN VALIDEZ FISCAL')
    expect(html).toContain('ANULADO (SIMULADO)')
    expect(html).toContain('&lt;img')
    expect(html).toContain('demo&amp;&quot;@doscientos.example')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;script&gt;cuota&lt;/script&gt;')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('src="https://')
    const document = new DOMParser().parseFromString(html, 'text/html')
    expect(document.querySelectorAll('script,img,svg,iframe')).toHaveLength(0)
    expect(document.querySelector('[aria-label="Datos del emisor"]')?.textContent).toContain(
      '<script>nif</script>',
    )
    expect(document.querySelector('[aria-label="Datos del destinatario"]')?.textContent).toContain(
      '<svg onload=alert(1)>',
    )
    expect(document.querySelectorAll('[onerror],[onload]')).toHaveLength(0)
  })

  it.each([0, 1000, 2100, 2125])(
    'desglosa el IVA incluido en céntimos sin cambiar el total (%s bps)',
    (vatBps) => {
      const payment = { ...createSeed().payments[0], amountCents: 3900, vatBps }
      const details = invoiceDetails(payment)
      expect(details.netCents! + details.taxCents!).toBe(payment.amountCents)
      const html = invoiceHtml(payment)
      expect(html).toContain('Base imponible')
      expect(html).toContain(`IVA (${details.vatLabel})`)
      if (vatBps === 2100) {
        expect(details).toMatchObject({ netCents: 3223, taxCents: 677 })
        expect(html).toContain('32,23')
        expect(html).toContain('6,77')
      }
    },
  )

  it('muestra todos los datos fiscales del snapshot y no advierte de ausencias si está completo', () => {
    const payment = createSeed().payments[0]
    payment.vatBps = 2100
    payment.issuer = { legalName: 'Club Ficticio SL', nif: 'B12345674', address: 'Calle Emisor 1' }
    payment.customer.dni = '12345678Z'
    payment.customer.address = 'Calle Socio 2'
    const document = new DOMParser().parseFromString(invoiceHtml(payment), 'text/html')
    expect(document.querySelector('[aria-label="Datos del emisor"]')?.textContent).toContain(
      'Club Ficticio SL',
    )
    expect(document.body.textContent).toContain('B12345674')
    expect(document.body.textContent).toContain('Calle Emisor 1')
    expect(document.body.textContent).toContain('12345678Z')
    expect(document.body.textContent).toContain('Calle Socio 2')
    expect(document.querySelector('thead th')?.getAttribute('scope')).toBe('col')
    expect(document.querySelector('[aria-label="Datos fiscales incompletos"]')).toBeNull()
    expect(document.querySelector('meta[http-equiv="Content-Security-Policy"]')).not.toBeNull()
  })

  it('no reconstruye datos ni IVA ausentes en comprobantes anteriores', () => {
    const payment = createSeed().payments[0]
    const before = structuredClone(payment)
    const details = invoiceDetails(payment)
    expect(details.netCents).toBeUndefined()
    expect(details.taxCents).toBeUndefined()
    expect(details.vatLabel).toBe('No consta')
    const html = invoiceHtml(payment)
    expect(html).toContain('Datos fiscales incompletos')
    expect(html).toContain('DNI/NIE del destinatario')
    expect(html).toContain('tipo de IVA del pago')
    expect(payment).toEqual(before)
  })
})
