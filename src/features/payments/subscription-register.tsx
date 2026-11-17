import { Plus } from 'lucide-react'

import { periodLabel } from '../../shared/format'
import { Badge, Button } from '../../shared/ui'
import type { Member, Payment } from '../club/domain/model'

export function SubscriptionRegister({
  members,
  payments,
  month,
  onPay,
  onVoid,
}: {
  members: Member[]
  payments: Payment[]
  month: string
  onPay: (memberId: string) => void
  onVoid: (payment: Payment) => void
}) {
  return (
    <div className="border-line bg-canvas desktop:px-6 border-b px-4">
      {members.map((member) => {
        const payment = payments.find(
          (item) => item.memberId === member.id && item.period === month && item.status === 'paid',
        )
        return (
          <div
            role="group"
            aria-label={`Cuota de ${member.name}`}
            className="border-line desktop:gap-3 flex flex-wrap items-center gap-2 border-b py-3 last:border-0"
            key={member.id}
          >
            <span className="max-desktop:basis-1/2 min-w-0 flex-1">
              <strong className="block text-sm">{member.name}</strong>
              <small className="text-muted mt-1 block text-xs">
                {periodLabel(month)}
                {!member.active ? ' · cuenta de baja' : ''}
              </small>
            </span>
            <Badge tone={payment ? 'green' : 'orange'}>
              {payment ? 'Al corriente' : 'Pendiente'}
            </Badge>
            {payment ? (
              <Button
                variant="ghost"
                className="desktop:min-w-35 desktop:text-xs ml-auto text-xs"
                onClick={() => onVoid(payment)}
              >
                Marcar no pagada
              </Button>
            ) : (
              <Button
                variant="secondary"
                className="desktop:min-w-35 desktop:text-xs ml-auto text-xs"
                disabled={!member.active}
                onClick={() => onPay(member.id)}
              >
                <Plus size={15} />
                Registrar pago
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
