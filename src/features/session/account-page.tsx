import { useState } from 'react'

import { useClub } from '../../app/club-context'
import { Button, InlineError, PageHeading, Panel, useCommand } from '../../shared/ui'
import { PasswordField } from './profile-switcher'
import { RecoveryCode } from './recovery-code'

export function AccountPage() {
  const { view, profiles, gateway, acceptSession, selectedId } = useClub()
  const profile = profiles.find((item) => item.id === selectedId)
  const [code, setCode] = useState('')
  const command = useCommand()
  return (
    <>
      <PageHeading title="Mi cuenta" />
      <Panel className="p-4">
        <dl className="mb-5 grid gap-2 text-sm">
          <dt>Nombre</dt>
          <dd>{view!.actor.name}</dd>
          <dt>Email</dt>
          <dd>{view!.actor.email}</dd>
        </dl>
        {profile?.mustChangePassword && (
          <p role="status" className="mb-4 text-sm">
            Tu contraseña es temporal. Cámbiala y guarda un código de recuperación.
          </p>
        )}
        {code ? (
          <RecoveryCode code={code} onDone={() => setCode('')} />
        ) : (
          <form
            className="grid max-w-lg gap-4"
            onSubmit={async (event) => {
              event.preventDefault()
              const form = event.currentTarget
              const data = new FormData(form)
              const result = await command.run(() =>
                gateway.changePassword(
                  selectedId,
                  String(data.get('current') ?? ''),
                  String(data.get('password') ?? ''),
                ),
              )
              if (result) {
                acceptSession(result.session)
                setCode(result.recoveryCode)
                form.reset()
              }
            }}
          >
            {profile?.passwordRequired && (
              <PasswordField
                label="Contraseña actual"
                name="current"
                autoComplete="current-password"
              />
            )}
            <PasswordField label="Nueva contraseña" />
            <InlineError>{command.error}</InlineError>
            <Button type="submit" disabled={command.busy}>
              {profile?.passwordRequired ? 'Cambiar contraseña' : 'Configurar contraseña'}
            </Button>
          </form>
        )}
      </Panel>
    </>
  )
}
