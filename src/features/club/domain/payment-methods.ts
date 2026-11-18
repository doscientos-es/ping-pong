export const RECORDED_PAYMENT_METHODS = ['cash', 'transfer', 'card', 'bizum'] as const
export const PAYMENT_METHODS = ['demo', 'manual', ...RECORDED_PAYMENT_METHODS] as const

export type RecordedPaymentMethod = (typeof RECORDED_PAYMENT_METHODS)[number]
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export function isRecordedPaymentMethod(value: unknown): value is RecordedPaymentMethod {
  return RECORDED_PAYMENT_METHODS.some((method) => method === value)
}
