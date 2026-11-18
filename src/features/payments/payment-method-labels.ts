import type { PaymentMethod } from '../club/domain/payment-methods'

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  bizum: 'Bizum',
  manual: 'No consta (registro manual)',
  demo: 'Pago simulado',
}
