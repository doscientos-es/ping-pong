import { useClub } from '../../app/club-context'
import { Button, InlineError, Modal, useCommand } from '../../shared/ui'
import { MemberFields, readMemberForm } from '../members/member-fields'
import { PasswordField } from './profile-switcher'

export function InvitationDialog({ onClose }: { onClose: () => void }) {
  const { gateway, selectedId } = useClub()
  const command = useCommand()
  return (
    <Modal open onClose={onClose} title="Invitar usuario">
      <form
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault()
          const form = event.currentTarget
          const data = new FormData(form)
          const result = await command.run(
            () =>
              gateway.inviteUser(selectedId, {
                ...readMemberForm(form),
                role: data.get('role') === 'admin' ? 'admin' : 'member',
                temporaryPassword: String(data.get('password') ?? ''),
              }),
            'Invitación creada en este navegador.',
          )
          if (result) onClose()
        }}
      >
        <MemberFields />
        <label>
          Rol
          <select name="role">
            <option value="member">Socio</option>
            <option value="admin">Administrador</option>
          </select>
        </label>
        <PasswordField label="Contraseña temporal" />
        <p className="text-muted text-xs">
          Comparte la contraseña fuera de la aplicación. No se envía ningún email; la cuenta solo
          existe en este navegador.
        </p>
        <InlineError>{command.error}</InlineError>
        <Button type="submit" disabled={command.busy}>
          Crear invitación local
        </Button>
      </form>
    </Modal>
  )
}
