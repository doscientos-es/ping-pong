import { ArrowLeft, ArrowRight, Check } from 'lucide-react'

import { cn } from '../../../shared/cn'
import { dateLabel } from '../../../shared/format'
import { Button } from '../../../shared/ui'
import { useInModal } from '../../../shared/ui/modal'

export function BookingActions({
  step,
  date,
  busy,
  editing,
  hasHours,
  validSlot,
  validMember,
  onStepChange,
  onConfirm,
}: {
  step: number
  date: string
  busy: boolean
  editing: boolean
  hasHours: boolean
  validSlot: boolean
  validMember: boolean
  onStepChange: (step: number) => void
  onConfirm: () => void
}) {
  const inModal = useInModal()
  return (
    <footer
      aria-label="Acciones de reserva"
      className={cn(
        'border-line max-desktop:[&>button]:min-h-12 desktop:static desktop:gap-2.5 desktop:py-3 sticky z-20 flex items-center gap-2 border-t bg-white py-2',
        inModal ? 'bottom-0' : 'bottom-[var(--mobile-nav-height)]',
      )}
    >
      {step > 0 && (
        <Button
          className="shrink-0 px-3"
          variant="secondary"
          disabled={busy}
          onClick={() => onStepChange(step - 1)}
        >
          <ArrowLeft size={17} />
          Atrás
        </Button>
      )}
      <span className={cn('text-muted flex-1 text-xs', step !== 1 && 'max-desktop:hidden')}>
        {step === 1
          ? 'Toca una hora para continuar'
          : step === 0
            ? dateLabel(date, { day: 'numeric', month: 'short' })
            : 'Sin coste extra'}
      </span>
      {step === 0 && (
        <Button
          className="desktop:flex-none flex-1"
          disabled={busy || !hasHours}
          onClick={() => onStepChange(1)}
        >
          Elegir hora <ArrowRight size={17} />
        </Button>
      )}
      {step === 2 && (
        <Button
          className="desktop:flex-none flex-1"
          disabled={busy || !validSlot}
          onClick={() => onStepChange(3)}
        >
          Revisar reserva <ArrowRight size={17} />
        </Button>
      )}
      {step === 3 && (
        <Button
          className="desktop:flex-none flex-1"
          disabled={busy || !validSlot || !validMember}
          onClick={onConfirm}
        >
          <Check size={18} />
          {busy ? 'Guardando…' : editing ? 'Guardar reserva' : 'Confirmar reserva'}
        </Button>
      )}
    </footer>
  )
}
