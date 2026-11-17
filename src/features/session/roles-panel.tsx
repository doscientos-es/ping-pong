import { useState } from 'react'

import { useClub } from '../../app/club-context'
import { Button, InlineError, Panel, SectionHeading, Modal, useCommand } from '../../shared/ui'
import { ClubPlanSelect } from '../members/club-plan-select'
import { PasswordField } from './profile-switcher'

export function RolesPanel() {
  const { view, gateway, selectedId, profiles } = useClub()
  const [resetId, setResetId] = useState('')
  const command = useCommand()
  return (
    <Panel>
      <SectionHeading title="Accesos y roles" />
      <div className="grid gap-2 p-3">
        {view!.members.map((member) => (
          <div
            key={member.id}
            className="border-line flex flex-wrap items-center gap-3 border-t py-2 text-sm"
          >
            <span className="min-w-0 flex-1 break-words">
              {member.name}
              <small className="text-muted block">
                {profiles.find((item) => item.id === member.id)?.mustChangePassword
                  ? 'Contraseña temporal'
                  : member.active
                    ? 'Cuenta activa'
                    : 'De baja'}
              </small>
            </span>
            <select
              aria-label={`Rol de ${member.name}`}
              value={member.role}
              disabled={command.busy}
              className="max-w-40"
              onChange={(event) => {
                const role = event.target.value === 'admin' ? 'admin' : 'member'
                void command.run(async () => {
                  await gateway.setMemberRole(selectedId, member.id, role)
                  return true
                }, 'Rol actualizado.')
              }}
            >
              <option value="member">Socio</option>
              <option value="admin">Administrador</option>
            </select>
            <ClubPlanSelect
              aria-label={`Cuota de ${member.name}`}
              value={member.planId}
              disabled={command.busy}
              className="max-w-full sm:max-w-60"
              onChange={(event) => {
                const planId = event.target.value
                void command.run(async () => {
                  await gateway.setMemberPlan(selectedId, member.id, planId)
                  return true
                }, 'Cuota asignada. Los periodos ya pagados no cambian.')
              }}
            />
            <Button
              variant="secondary"
              disabled={!member.active}
              aria-label={`Restablecer acceso de ${member.name}`}
              onClick={() => setResetId(member.id)}
            >
              Restablecer acceso
            </Button>
          </div>
        ))}
        <InlineError>{command.error}</InlineError>
      </div>
      <Modal open={!!resetId} onClose={() => setResetId('')} title="Restablecer acceso">
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault()
            const password = String(new FormData(event.currentTarget).get('password') ?? '')
            const done = await command.run(async () => {
              await gateway.resetUserPassword(selectedId, resetId, password)
              return true
            }, 'Contraseña temporal actualizada. Comparte el acceso fuera de la aplicación.')
            if (done) setResetId('')
          }}
        >
          <p className="text-sm">
            {view!.members.find((item) => item.id === resetId)?.name}. Se invalidarán las sesiones y
            el código de recuperación anteriores.
          </p>
          <PasswordField label="Nueva contraseña temporal" />
          <InlineError>{command.error}</InlineError>
          <Button type="submit" disabled={command.busy}>
            Confirmar restablecimiento
          </Button>
        </form>
      </Modal>
    </Panel>
  )
}
