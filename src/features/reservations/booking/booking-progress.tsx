import { Check } from 'lucide-react'

import { cn } from '../../../shared/cn'
import { Button } from '../../../shared/ui/button'

export const bookingSteps = [
  { label: 'Día', title: 'Elige un día' },
  { label: 'Hora', title: 'Elige una hora' },
  { label: 'Pista', title: 'Elige una pista' },
  { label: 'Confirmar', title: 'Revisa tu reserva' },
]

export function BookingProgress({
  step,
  busy,
  onChange,
}: {
  step: number
  busy: boolean
  onChange: (step: number) => void
}) {
  return (
    <nav
      className="border-line desktop:gap-2 desktop:pb-3 grid grid-cols-4 gap-1 border-b pb-2"
      aria-label="Pasos de la reserva"
    >
      {bookingSteps.map(({ label }, index) => (
        <Button
          variant="ghost"
          key={label}
          disabled={index > step || busy}
          aria-current={step === index ? 'step' : undefined}
          onClick={() => onChange(index)}
          className={cn(
            'text-muted desktop:justify-start desktop:gap-2 desktop:text-[13px] flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-lg px-1 py-2 text-[11px]',
            step === index && 'bg-accent-soft text-green',
          )}
        >
          <span
            className={cn(
              'desktop:size-6 desktop:text-xs grid size-5 shrink-0 place-items-center rounded-full text-[10px]',
              step === index ? 'bg-green text-white' : 'bg-canvas',
            )}
          >
            {index < step ? <Check size={15} /> : index + 1}
          </span>
          <strong>{label}</strong>
        </Button>
      ))}
    </nav>
  )
}
