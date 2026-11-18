import { RotateCcw } from 'lucide-react'
import { useRef, useState } from 'react'

import { useClub } from '../../app/club-context'
import { Button, InlineError, Modal, Panel, useCommand } from '../../shared/ui'

export function ResetDemoPanel({ disabled }: { disabled: boolean }) {
  const { gateway, selectedId, signOut } = useClub()
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const command = useCommand()
  if (!gateway.resetDemo) return null

  const reset = gateway.resetDemo
  return (
    <Panel className="mt-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div>
        <h2 className="text-sm font-semibold">Datos de demostración</h2>
        <p className="text-muted mt-1 text-xs">Vuelve a empezar con ejemplos actualizados.</p>
      </div>
      <Button ref={trigger} variant="secondary" disabled={disabled} onPress={() => setOpen(true)}>
        <RotateCcw aria-hidden="true" />
        Reiniciar demo
      </Button>
      {open && (
        <Modal
          open
          onClose={() => !command.busy && setOpen(false)}
          returnFocusRef={trigger}
          title="¿Reiniciar la demo?"
          description="Se sustituirán los socios, cuentas, reservas, pagos, ajustes y movimientos de este navegador por datos de ejemplo. No se puede deshacer."
        >
          <InlineError>{command.error}</InlineError>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button autoFocus disabled={command.busy} onPress={() => setOpen(false)}>
              Conservar datos
            </Button>
            <Button
              variant="danger"
              disabled={command.busy}
              onPress={() =>
                void command.run(async () => {
                  await reset(selectedId)
                  signOut()
                }, 'Demo reiniciada. Ya puedes elegir un perfil de ejemplo.')
              }
            >
              {command.busy ? 'Reiniciando…' : 'Reiniciar y sustituir datos'}
            </Button>
          </div>
        </Modal>
      )}
    </Panel>
  )
}
