import { Button } from '../../shared/ui'

export function RecoveryCode({ code, onDone }: { code: string; onDone: () => void }) {
  return (
    <div className="grid gap-4">
      <h2 className="text-base">Guarda tu código de recuperación</h2>
      <p className="text-muted text-sm">
        Se muestra una sola vez. Es de un solo uso y caduca en un año. Guárdalo fuera de este
        navegador; permite restablecer tu contraseña sin email.
      </p>
      <output
        aria-label="Código de recuperación"
        className="bg-canvas break-all rounded-lg p-3 font-mono text-sm"
      >
        {code}
      </output>
      <Button onClick={onDone}>He guardado el código</Button>
    </div>
  )
}
