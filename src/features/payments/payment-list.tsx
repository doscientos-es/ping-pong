import { ArrowUpRight, CreditCard, XCircle } from 'lucide-react'

import { cn } from '../../shared/cn'
import { dateLabel, money, periodLabel } from '../../shared/format'
import { Badge, Button } from '../../shared/ui'
import type { Payment } from '../club/domain/model'
import { dateKey } from '../club/domain/rules'

export function PaymentList({
  payments,
  admin,
  onSelect,
}: {
  payments: Payment[]
  admin: boolean
  onSelect: (payment: Payment) => void
}) {
  return (
    <div>
      {payments.map((payment) => (
        <Button
          variant="ghost"
          className="border-line hover:bg-canvas desktop:gap-4 desktop:px-6 desktop:py-5 flex h-auto w-full items-center gap-2.5 border-b px-4 py-4 text-left"
          key={payment.id}
          onClick={() => onSelect(payment)}
        >
          <span
            className={cn(
              'desktop:size-10 grid size-9 shrink-0 place-items-center rounded-lg',
              payment.status === 'voided'
                ? 'bg-canvas text-muted'
                : 'bg-accent-soft text-green-mid',
            )}
          >
            {payment.status === 'voided' ? <XCircle size={22} /> : <CreditCard size={22} />}
          </span>
          <span className="grid min-w-0 flex-1 gap-1.5">
            <strong className="text-sm">
              {admin ? payment.customer.name : `Suscripción · ${periodLabel(payment.period)}`}
            </strong>
            <span className="text-muted desktop:text-[13px] text-xs">
              {periodLabel(payment.period)} ·{' '}
              {payment.method === 'manual' ? 'Registro manual' : 'Pago simulado'}
            </span>
            <small className="text-muted text-xs break-words">{payment.invoiceNumber}</small>
            <small className="text-muted text-xs">
              Fecha de pago:{' '}
              {dateLabel(dateKey(new Date(payment.paidAt)), {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </small>
          </span>
          <span className="grid justify-items-end gap-1.5">
            <strong className="text-sm">{money(payment.amountCents)}</strong>
            <Badge tone={payment.status === 'paid' ? 'green' : 'gray'}>
              {payment.status === 'paid' ? 'Pagado' : 'Anulado'}
            </Badge>
          </span>
          <ArrowUpRight size={18} className="text-muted desktop:block ml-2 hidden" />
        </Button>
      ))}
    </div>
  )
}
