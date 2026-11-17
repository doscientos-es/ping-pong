import { useState } from 'react'

import { Modal } from '../../shared/ui'
import type { BookingInput, Reservation } from '../club/domain/model'
import { BookingFlowLoader } from './booking-flow-loader'

export type Slot = BookingInput

export function BookingDialog({
  slot,
  initialDate,
  reservation,
  onClose,
}: {
  slot?: Slot
  initialDate?: string
  reservation?: Reservation
  onClose: () => void
}) {
  const [pending, setPending] = useState(false)
  return (
    <Modal
      open
      wide
      mobileSheet
      onClose={() => {
        if (!pending) onClose()
      }}
      title={reservation ? 'Modificar reserva' : 'Nueva reserva'}
    >
      <BookingFlowLoader
        initialSlot={slot}
        initialDate={initialDate}
        reservation={reservation}
        onClose={onClose}
        onPendingChange={setPending}
      />
    </Modal>
  )
}
