import { useClub } from '../../app/club-context'
import { periodLabel } from '../../shared/format'
import { Button, InlineError, Modal, useCommand } from '../../shared/ui'
import type { Payment } from '../club/domain/model'

export function VoidPaymentDialog({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const { gateway, selectedId } = useClub()
  const command = useCommand()
  return (
    <Modal
      open
      onClose={onClose}
      title="¿Marcar esta cuota como no pagada?"
      description="El registro se conserva como anulado, junto con su comprobante."
    >
      <div className="grid gap-5">
        <p>
          {payment.customer.name} · {periodLabel(payment.period)}. Si corresponde al mes actual, se
          bloqueará el acceso a reservas hasta registrar un nuevo pago.
        </p>
        <InlineError>{command.error}</InlineError>
        <Button
          variant="danger"
          disabled={command.busy}
          onClick={async () => {
            const done = await command.run(async () => {
              await gateway.voidPayment(selectedId, payment.id)
              return true
            }, 'Cuota marcada como no pagada. Historial conservado.')
            if (done) onClose()
          }}
        >
          Confirmar cuota no pagada
        </Button>
      </div>
    </Modal>
  )
}
