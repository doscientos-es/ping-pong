import { CLUB_NAME } from '../../shared/brand'
import { periodLabel, money } from '../../shared/format'
import type { Payment } from '../club/domain/model'
import { invoiceDetails } from './invoice-details'
import { invoiceStyles } from './invoice-styles'

export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  )
}

/** Trusted template: every persisted string is escaped before insertion into HTML. */
export function invoiceMarkup(payment: Payment): string {
  const safe = escapeHtml
  const details = invoiceDetails(payment)
  const field = (value?: string) => safe(value?.trim() || 'No informado')
  const amount = (cents?: number) => (cents === undefined ? 'No consta' : safe(money(cents)))
  const period = `${safe(periodLabel(payment.period))}${payment.plan ? ` · ${safe(payment.plan.name)}` : ''}`
  return `
<header class="invoice-header">
  <div><h1>${safe(CLUB_NAME)}.</h1><p class="eyebrow">Facturación · Demo local</p></div>
  <span class="badge${payment.status === 'voided' ? ' voided' : ''}">${details.badge}</span>
</header>
<section class="invoice-title" aria-label="Identificación del documento">
  <p class="eyebrow">Factura de demostración</p>
  <h2>${safe(payment.invoiceNumber)}</h2>
  <dl class="metadata">
    <div><dt>Fecha de emisión / pago</dt><dd>${safe(details.issuedOn)}</dd></div>
    <div><dt>Periodo del servicio</dt><dd>${safe(periodLabel(payment.period))}</dd></div>
    <div><dt>Método de registro</dt><dd>${details.method}</dd></div>
  </dl>
</section>
<div class="parties">
  <section aria-label="Datos del emisor">
    <h3>Emisor</h3><p class="party-name">${field(payment.issuer?.legalName)}</p>
    <p>NIF: ${field(payment.issuer?.nif)}</p>
    <p class="address">${field(payment.issuer?.address)}</p>
  </section>
  <section aria-label="Datos del destinatario">
    <h3>Destinatario</h3><p class="party-name">${field(payment.customer.name)}</p>
    <p>DNI / NIE: ${field(payment.customer.dni)}</p>
    <p class="address">${field(payment.customer.address)}</p>
    <p class="secondary">${field(payment.customer.email)}</p>
  </section>
</div>
<div class="line-items" role="region" aria-label="Detalle de la cuota" tabindex="0">
  <table>
    <caption>Detalle del servicio</caption>
    <thead><tr><th scope="col">Concepto</th><th scope="col" class="numeric">Cant.</th><th scope="col" class="numeric">Precio sin IVA</th><th scope="col" class="numeric">IVA</th><th scope="col" class="numeric">Importe</th></tr></thead>
    <tbody><tr>
      <td><strong>Suscripción mensual · ${safe(CLUB_NAME)}</strong><p class="secondary">${period}</p><p class="secondary">Reservas ilimitadas incluidas</p></td>
      <td class="numeric">1</td><td class="numeric">${amount(details.netCents)}</td><td class="numeric">${safe(details.vatLabel)}</td><td class="numeric">${amount(payment.amountCents)}</td>
    </tr></tbody>
  </table>
</div>
<dl class="totals" aria-label="Totales del documento">
  <div><dt>Base imponible</dt><dd>${amount(details.netCents)}</dd></div>
  <div><dt>IVA (${safe(details.vatLabel)})</dt><dd>${amount(details.taxCents)}</dd></div>
  <div class="grand-total"><dt>Total de demostración</dt><dd>${amount(payment.amountCents)}</dd></div>
</dl>
<p class="document-status">Estado: ${details.status}</p>
${payment.voidedAt ? `<p class="secondary">Registro de pago anulado el ${safe(new Date(payment.voidedAt).toLocaleDateString('es-ES'))}.</p>` : ''}
${details.missing.length ? `<aside class="warning" aria-label="Datos fiscales incompletos"><strong>Datos fiscales incompletos.</strong> No constaban al emitir el documento: ${safe(details.missing.join(', '))}. Completa los datos para próximos pagos; el historial no se modifica.</aside>` : ''}
<footer class="invoice-footer">
  <p><strong>DEMO · SIN VALIDEZ FISCAL</strong></p>
  <p>No se ha realizado ningún cobro real. Los datos de facturación reflejan el momento del pago de la cuota.</p>
  <p>Documento ficticio. El desglose de IVA es orientativo; un tipo del 0 % no acredita una exención tributaria. No es una factura de venta real ni un documento rectificativo.</p>
</footer>`
}

export function invoiceHtml(payment: Payment): string {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>${escapeHtml(payment.invoiceNumber)}</title>
<style>body{margin:32px 16px;background:#f6f7f3}@page{size:A4;margin:18mm}@media print{body{margin:0;background:#fff}}${invoiceStyles}</style>
</head><body><main class="club-invoice">${invoiceMarkup(payment)}</main></body></html>`
}

export function downloadInvoice(payment: Payment) {
  const url = URL.createObjectURL(
    new Blob([invoiceHtml(payment)], { type: 'text/html;charset=utf-8' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = `${payment.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '-')}.html`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
