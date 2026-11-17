import { ShieldCheck } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useClub } from '../../app/club-context'
import { initials } from '../../shared/format'
import { Avatar, Button, InlineError, Modal, useCommand } from '../../shared/ui'
import { MemberFields, readMemberForm } from '../members/member-fields'
import { RecoveryCode } from './recovery-code'

export function ProfileSwitcher({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Cambiar perfil">
      {open && <AccountSelection onDone={onClose} />}
    </Modal>
  )
}

export function AccountSelection({ onDone = () => {} }: { onDone?: () => void }) {
  const { profiles, selectProfile, gateway, acceptSession } = useClub()
  const [mode, setMode] = useState<'accounts' | 'signup' | 'recovery'>('accounts')
  const [chosen, setChosen] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [complete, setComplete] = useState(false)
  const command = useCommand()
  const navigate = useNavigate()
  const pendingSession = useRef<Parameters<typeof acceptSession>[0] | null>(null)
  const finish = () => {
    if (pendingSession.current) acceptSession(pendingSession.current)
    navigate('/', { replace: true })
    onDone()
  }
  const login = async (id: string, password?: string) => {
    const result = await command.run(async () => {
      await selectProfile(id, password)
      return true
    })
    if (result) {
      navigate(profiles.find((item) => item.id === id)?.mustChangePassword ? '/cuenta' : '/', {
        replace: true,
      })
      onDone()
    }
  }
  if (recoveryCode) return <RecoveryCode code={recoveryCode} onDone={finish} />
  return (
    <div className="grid gap-4">
      {mode === 'accounts' ? (
        <>
          <div className="grid max-h-[48dvh] gap-2 overflow-y-auto">
            {[...profiles]
              .sort((a, b) => Number(b.role === 'admin') - Number(a.role === 'admin'))
              .map((profile, index) => (
                <Button
                  key={profile.id}
                  variant="secondary"
                  disabled={command.busy}
                  className="h-auto justify-start gap-3 py-2 text-left whitespace-normal"
                  onClick={() => {
                    if (profile.passwordRequired) setChosen(profile.id)
                    else void login(profile.id)
                  }}
                >
                  <Avatar index={index}>
                    {profile.role === 'admin' ? <ShieldCheck size={20} /> : initials(profile.name)}
                  </Avatar>
                  <span className="min-w-0">
                    <strong className="block text-sm">{profile.name}</strong>
                    <span className="text-muted text-xs">
                      {!profile.active
                        ? 'Cuenta desactivada'
                        : profile.passwordRequired
                          ? 'Contraseña local'
                          : 'Perfil demo · sin contraseña'}
                    </span>
                  </span>
                </Button>
              ))}
          </div>
          {chosen && (
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault()
                const data = new FormData(event.currentTarget)
                void login(chosen, String(data.get('password') ?? ''))
              }}
            >
              <p className="text-sm">
                Acceder como {profiles.find((item) => item.id === chosen)?.name}
              </p>
              <PasswordField label="Contraseña" autoComplete="current-password" />
              <Button type="submit" disabled={command.busy}>
                Iniciar sesión
              </Button>
            </form>
          )}
          <Button variant="secondary" onClick={() => setMode('signup')}>
            Crear cuenta local
          </Button>
          <Button variant="ghost" onClick={() => setMode('recovery')}>
            Recuperar contraseña
          </Button>
        </>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault()
            const form = event.currentTarget
            const data = new FormData(form)
            const password = String(data.get('password') ?? '')
            if (mode === 'signup') {
              const result = await command.run(() => gateway.signup(readMemberForm(form), password))
              if (result) {
                setRecoveryCode(result.recoveryCode)
                setPendingSession(result.session)
              }
            } else {
              const result = await command.run(async () => {
                await gateway.recoverPassword(
                  String(data.get('email') ?? ''),
                  String(data.get('code') ?? ''),
                  password,
                )
                return true
              })
              if (result) {
                form.reset()
                setComplete(true)
              }
            }
          }}
        >
          <h2 className="text-base">
            {mode === 'signup' ? 'Crear cuenta local' : 'Recuperar contraseña'}
          </h2>
          {mode === 'signup' ? (
            <MemberFields />
          ) : (
            <>
              <label>
                Email
                <input name="email" type="email" autoComplete="email" required />
              </label>
              <label>
                Código de recuperación
                <input name="code" autoComplete="off" maxLength={128} required />
              </label>
              <p className="text-muted text-xs">
                Usa el código guardado al configurar tu contraseña. No se envían correos. Sin
                código, solicita ayuda a administración.
              </p>
            </>
          )}
          <PasswordField label={mode === 'signup' ? 'Contraseña' : 'Nueva contraseña'} />
          <Button type="submit" disabled={command.busy}>
            {mode === 'signup' ? 'Crear cuenta' : 'Restablecer contraseña'}
          </Button>
          {complete && (
            <p role="status">
              Contraseña restablecida. Inicia sesión; configura un nuevo código desde tu cuenta.
            </p>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              setMode('accounts')
              setComplete(false)
            }}
          >
            Volver a los perfiles
          </Button>
        </form>
      )}
      <InlineError>{command.error}</InlineError>
      <p className="text-muted text-xs">
        Solo en este navegador. Las contraseñas locales no protegen frente a quien tenga acceso al
        dispositivo. No uses datos ni contraseñas reales.
      </p>
    </div>
  )

  function setPendingSession(session: Parameters<typeof acceptSession>[0]) {
    // Keep the recovery code visible before the shell changes to the authenticated view.
    pendingSession.current = session
  }
}

export function PasswordField({
  label,
  name = 'password',
  autoComplete = 'new-password',
}: {
  label: string
  name?: string
  autoComplete?: string
}) {
  return (
    <label>
      {label}
      <input
        type="password"
        name={name}
        required
        minLength={8}
        maxLength={128}
        autoComplete={autoComplete}
      />
    </label>
  )
}
