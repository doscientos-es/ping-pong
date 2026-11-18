import { Check, Download, Smartphone } from 'lucide-react'
import { useId, useRef, useState, type ComponentProps } from 'react'
import { createPortal } from 'react-dom'

import { useAppInstallation } from '../features/pwa/installation-provider'
import { Button, InlineError, Modal } from '../shared/ui'

export function InstallButton({
  login = false,
  sidebar = false,
  mobileTarget,
}: { login?: boolean; sidebar?: boolean; mobileTarget?: HTMLElement | null } = {}) {
  const { installed, busy, error, notice, canInstall, install } = useAppInstallation()
  const [help, setHelp] = useState(false)
  const availabilityId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const availability = busy
    ? 'Confirma o cancela la instalación en la ventana del navegador.'
    : canInstall
      ? 'Tu navegador permite instalar la app directamente en este dispositivo.'
      : notice || 'Instala la app desde el menú de tu navegador siguiendo estos pasos.'

  const openHelp: NonNullable<ComponentProps<typeof Button>['onClick']> = (event) => {
    if (event.currentTarget instanceof HTMLButtonElement) triggerRef.current = event.currentTarget
    setHelp(true)
    if (login && canInstall) void install()
  }

  function trigger(compact: boolean) {
    return (
      <Button
        variant="ghost"
        tooltip="Instalar app"
        aria-label="Instalar app"
        aria-haspopup="dialog"
        className={
          compact
            ? 'text-green-mid w-11 gap-2 px-2 text-xs'
            : 'text-green-mid w-full justify-start gap-3 px-3 text-xs'
        }
        disabled={busy}
        onClick={openHelp}
      >
        <Download size={17} />
        {!compact && <span>Instalar app</span>}
      </Button>
    )
  }

  return (
    <>
      {login ? (
        installed ? (
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Check size={18} aria-hidden="true" /> App instalada
          </p>
        ) : (
          <Button
            className="bg-lime text-green w-full hover:bg-[#e5f4bd] focus-visible:ring-white"
            aria-haspopup="dialog"
            disabled={busy}
            onClick={openHelp}
          >
            <Download size={18} aria-hidden="true" /> Instalar app
          </Button>
        )
      ) : (
        !installed && trigger(!sidebar)
      )}
      {!installed && sidebar && mobileTarget && createPortal(trigger(true), mobileTarget)}
      <Modal
        open={help && !installed}
        onClose={() => setHelp(false)}
        returnFocusRef={triggerRef}
        title="Instalar app"
      >
        <InlineError className="mb-4">{error}</InlineError>
        <div className="grid gap-5">
          <div
            role="group"
            aria-label="Instalación en este dispositivo"
            aria-busy={busy}
            className="border-line bg-accent-soft grid gap-3 rounded-xl border p-4"
          >
            <div className="flex items-center gap-2">
              <Smartphone size={22} aria-hidden="true" />
              <h3 className="text-sm">En este dispositivo</h3>
            </div>
            {(canInstall || busy) && (
              <Button
                disabled={busy}
                aria-describedby={availabilityId}
                onClick={() => void install()}
              >
                <Download size={17} aria-hidden="true" />
                Instalar en este dispositivo
              </Button>
            )}
            <p id={availabilityId} role="status" className="text-green text-xs" aria-atomic="true">
              {availability}
            </p>
          </div>
          <section aria-label="Instalación manual" className="grid gap-4">
            <div>
              <h3 className="mb-1 text-sm">iPhone / iPad:</h3>
              <ol className="grid list-decimal gap-1 pl-5 text-xs">
                <li>Abre esta web en Safari.</li>
                <li>Pulsa Compartir y elige «Añadir a pantalla de inicio».</li>
                <li>Activa «Abrir como app web» si aparece y confirma con «Añadir».</li>
              </ol>
            </div>
            <div>
              <h3 className="mb-1 text-sm">Android / ordenador:</h3>
              <ol className="grid list-decimal gap-1 pl-5 text-xs">
                <li>Abre esta web en Chrome o Edge.</li>
                <li>
                  Abre el menú del navegador y elige «Instalar aplicación» o «Añadir a pantalla de
                  inicio».
                </li>
                <li>Si no aparece esa opción, puedes seguir usando la web.</li>
              </ol>
            </div>
            <p className="text-muted text-xs">Safari en Mac: Archivo → Añadir al Dock.</p>
          </section>
          <p className="text-muted text-xs leading-relaxed">
            La instalación requiere HTTPS o localhost. Si abriste el enlace dentro de otra app,
            ábrelo en tu navegador. Los datos siguen guardados en este dispositivo.
          </p>
          {import.meta.env.DEV && (
            <p className="text-muted text-xs">
              Para probar la app instalable en local, usa la vista previa de producción.
            </p>
          )}
        </div>
      </Modal>
    </>
  )
}
