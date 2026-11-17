import { Check } from 'lucide-react'

import { COURTS } from '../../club/domain/model'
import { BookingChoice } from './booking-choice'

export function BookingCourtStep({
  court,
  freeCourts,
  onChange,
}: {
  court: number | null
  freeCourts: number[]
  onChange: (court: number) => void
}) {
  return (
    <>
      <p className="text-muted text-xs">{freeCourts.length} de 8 pistas disponibles.</p>
      <div
        className="mt-3 mb-3 grid grid-cols-2 gap-2 min-[390px]:grid-cols-4"
        aria-label="Elige una pista"
      >
        {COURTS.map((value) => (
          <BookingChoice
            key={value}
            className="justify-items-center gap-1.5 px-1 py-3 text-center"
            disabled={!freeCourts.includes(value)}
            aria-pressed={court === value}
            aria-label={`Pista ${value}, ${freeCourts.includes(value) ? 'disponible' : 'no disponible'}`}
            onClick={() => onChange(value)}
          >
            <span
              aria-hidden="true"
              className="relative block h-6 w-10 rounded-xs border-2 border-white bg-[#63866e] outline outline-[#63866e] group-disabled:grayscale after:absolute after:inset-x-[-3px] after:top-1/2 after:h-0.5 after:bg-[#f5f7e9] after:content-['']"
            >
              <i className="mx-auto block h-full w-px bg-[#c6d6c5]" />
            </span>
            <strong className="text-[13px]">Pista {value}</strong>
            <small className="text-green-mid group-disabled:text-muted text-[11px]">
              {freeCourts.includes(value) ? 'Libre' : 'Ocupada'}
            </small>
            {court === value && <Check className="text-green absolute top-1 right-1" size={14} />}
          </BookingChoice>
        ))}
      </div>
      <p className="text-muted text-xs leading-relaxed">
        Tu reserva ocupa únicamente el turno seleccionado.
      </p>
    </>
  )
}
