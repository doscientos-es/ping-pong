import { vatCents } from '../accounting/domain/finance'
import type { Payment } from '../club/domain/model'
import { isRecordedPaymentMethod } from '../club/domain/payment-methods'
import { paymentMethodLabels } from './payment-method-labels'

/** Only persisted payment data: never rebuild an old document from current settings. */
export function invoiceDetails(payment: Payment) {
  const missing = [
    !payment.issuer?.legalName?.trim() && 'razón social del emisor',
    !payment.issuer?.nif?.trim() && 'NIF del emisor',
    !payment.issuer?.address?.trim() && 'dirección fiscal del emisor',
    !payment.customer.name.trim() && 'nombre del destinatario',
    !payment.customer.dni?.trim() && 'DNI/NIE del destinatario',
    !payment.customer.address?.trim() && 'dirección del destinatario',
    payment.vatBps === undefined && 'tipo de IVA del pago',
  ].filter((value): value is string => typeof value === 'string')
  const taxCents =
    payment.vatBps === undefined ? undefined : vatCents(payment.amountCents, payment.vatBps)
  const recorded = isRecordedPaymentMethod(payment.method)
  const status = payment.status === 'voided' ? 'Anulado' : 'Pagado'
  return {
    missing,
    taxCents,
    netCents: taxCents === undefined ? undefined : payment.amountCents - taxCents,
    vatLabel:
      payment.vatBps === undefined
        ? 'No consta'
        : `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(payment.vatBps / 100)} %`,
    issuedOn: new Date(payment.paidAt).toLocaleDateString('es-ES'),
    status: `${status.toUpperCase()}${recorded ? '' : ' (SIMULADO)'}`,
    badge: recorded ? status : `${status} · demo`,
    method: paymentMethodLabels[payment.method],
  }
}
