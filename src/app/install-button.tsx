import { Download, Smartphone } from 'lucide-react'
import { useId, useRef } from 'react'
import { createPortal } from 'react-dom'

import { PwaUpdateNotice } from '../features/pwa/pwa-update-notice'
import { useInstallation } from '../features/pwa/use-installation'
import { Button, InlineError, Modal } from '../shared/ui'

export function InstallButton({
  sidebar = false,
  mobileTarget,
}: { sidebar?: boolean; mobileTarget?: HTMLElement | null } = {}) {
  const { installed, busy, help, setHelp, error, notice, canInstall, install } = useInstallation()
  const availabilityId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const availability = busy
    ? 'Confirma o cancela la instalación en la ventana del navegador.'
    : canInstall
      ? 'Tu navegador permite instalar la app directamente en este dispositivo.'
      : notice ||
        'La instalación directa no está disponible ahora. Usa las instrucciones de tu navegador.'

  function trigger(compact: boolean) {
    return (
      <Button
        variant="ghost"
        tooltip="Instalar app"
        aria-label="Instalar app"
        className={
          compact
            ? 'text-green-mid w-11 gap-2 px-2 text-xs'
            : 'text-green-mid w-full justify-start gap-3 px-3 text-xs'
        }
        disabled={busy}
        onClick={(event) => {
          if (event.currentTarget instanceof HTMLButtonElement)
            triggerRef.current = event.currentTarget
          setHelp(true)
        }}
      >
        <Download size={17} />
        {!compact && <span>Instalar app</span>}
      </Button>
    )
  }

  return (
    <>
      {!installed && trigger(!sidebar)}
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
            <Button
              disabled={!canInstall || busy}
              aria-describedby={availabilityId}
              onClick={() => void install()}
            >
              <Download size={17} aria-hidden="true" />
              Instalar en este dispositivo
            </Button>
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
                <li>Confirma con «Añadir» y abre la app desde su icono.</li>
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
          </section>
          <p className="text-muted text-xs leading-relaxed">
            Disponible en HTTPS o localhost. Tras la primera carga completa y la activación del modo
            sin conexión, podrás usar la demo offline. Los datos se guardan solo en este navegador.
            La instalación no los sincroniza ni crea una copia de seguridad. No necesitas descargar
            un APK.
          </p>
        </div>
      </Modal>
      {createPortal(<PwaUpdateNotice />, document.body)}
    </>
  )
}
