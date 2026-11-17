import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

import { useClub } from '../../app/club-context'
import { Button, Modal } from '../../shared/ui'
import { WEEKDAYS, type OpeningDay } from '../club/domain/model'

const orderedDays = [1, 2, 3, 4, 5, 6, 0]

export function CopyScheduleDialog({
  weekly,
  onApply,
}: {
  weekly: OpeningDay[]
  onApply: (source: number, targets: number[]) => void
}) {
  const { notify } = useClub()
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState(1)
  const [targets, setTargets] = useState([2, 3, 4, 5])
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Copy size={16} />
        Copiar horarios
      </Button>
      {open && (
        <Modal open onClose={() => setOpen(false)} title="Copiar horarios">
          <div className="grid gap-5">
            <label>
              Copiar desde
              <select value={source} onChange={(event) => setSource(Number(event.target.value))}>
                {orderedDays.map((day) => (
                  <option key={day} value={day}>
                    {WEEKDAYS[day]}
                    {!weekly.find((item) => item.day === day)?.intervals.length ? ' · cerrado' : ''}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="border-line grid grid-cols-2 gap-4 rounded-xl border p-4">
              <legend>Aplicar a</legend>
              {orderedDays
                .filter((day) => day !== source)
                .map((day) => (
                  <label key={day} className="flex min-h-8 items-center gap-2.5">
                    <input
                      type="checkbox"
                      className="accent-green size-5 min-h-0"
                      checked={targets.includes(day)}
                      onChange={(event) =>
                        setTargets((previous) =>
                          event.target.checked
                            ? [...previous, day]
                            : previous.filter((value) => value !== day),
                        )
                      }
                    />
                    {WEEKDAYS[day]}
                  </label>
                ))}
            </fieldset>
            <p className="text-muted">
              Se reemplazarán las franjas de los días seleccionados. No se guardan hasta pulsar
              «Guardar cambios».
            </p>
            <Button
              disabled={!targets.some((day) => day !== source)}
              onClick={() => {
                onApply(
                  source,
                  targets.filter((day) => day !== source),
                )
                notify('Horarios copiados al borrador. Revisa y guarda los cambios.')
                setOpen(false)
              }}
            >
              <Check size={17} />
              Aplicar al borrador
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}
