import { useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

import { Button } from '../../shared/ui'

export function PwaUpdateNotice() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: () =>
      setError(
        'No se pudo preparar el modo sin conexión. Recarga con conexión para volver a intentarlo.',
      ),
  })

  async function update() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await updateServiceWorker(true)
    } catch {
      setError('No se ha podido actualizar. Inténtalo de nuevo con conexión.')
    } finally {
      setBusy(false)
    }
  }

  if (!needRefresh && !error) return null
  return (
    <div
      className="border-line bg-surface desktop:right-5 desktop:bottom-5 desktop:left-auto desktop:max-w-lg fixed right-4 bottom-[90px] left-4 z-90 flex flex-wrap items-center gap-2.5 rounded-xl border p-4 text-[13px] shadow-xl"
      role={error ? 'alert' : 'status'}
    >
      <span className="w-full">
        {error || 'Hay una nueva versión. Tus datos locales se conservan.'}
      </span>
      {needRefresh && (
        <Button disabled={busy} onClick={() => void update()}>
          {busy ? 'Actualizando…' : 'Actualizar'}
        </Button>
      )}
      <Button
        variant="ghost"
        disabled={busy}
        onClick={() => {
          setError('')
          setNeedRefresh(false)
        }}
      >
        Después
      </Button>
    </div>
  )
}
