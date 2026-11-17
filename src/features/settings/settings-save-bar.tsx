import { Check } from 'lucide-react'

import { Button } from '../../shared/ui'

export function SettingsSaveBar({
  changed,
  conflicted,
  busy,
  onDiscard,
  onSave,
}: {
  changed: boolean
  conflicted: boolean
  busy: boolean
  onDiscard: () => void
  onSave: () => void
}) {
  return (
    <div className="border-line max-desktop:[&>.button]:flex-1 desktop:bottom-4 desktop:gap-3 desktop:px-5 desktop:py-4 sticky bottom-[calc(76px+env(safe-area-inset-bottom))] z-20 mt-5 flex flex-wrap items-center gap-2 rounded-[14px] border bg-white/95 p-3 shadow-sm backdrop-blur-md">
      <span
        className="text-muted max-desktop:basis-full max-desktop:text-center flex-1 text-[13px]"
        role="status"
      >
        {conflicted
          ? 'Revisa los cambios de otra pestaña'
          : changed
            ? 'Tienes cambios sin guardar'
            : 'Configuración actualizada'}
      </span>
      <Button variant="secondary" disabled={(!changed && !conflicted) || busy} onClick={onDiscard}>
        Descartar
      </Button>
      <Button disabled={!changed || busy || conflicted} onClick={onSave}>
        <Check size={18} />
        {busy ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </div>
  )
}
