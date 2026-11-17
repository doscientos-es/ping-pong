import { Check } from 'lucide-react'
import { useState } from 'react'

import { useClub } from '../../app/club-context'
import { initials, money } from '../../shared/format'
import { Avatar, Badge, Button, InlineError, Modal, useCommand } from '../../shared/ui'
import type { Member } from '../club/domain/model'
import { MemberFields, readMemberForm } from './member-fields'

export function MemberEditor({ member, onClose }: { member?: Member; onClose: () => void }) {
  const { view, gateway, selectedId } = useClub()
  const [confirm, setConfirm] = useState(false)
  const command = useCommand()
  const current = member && (view!.members.find((item) => item.id === member.id) ?? member)
  const paid = view!.payments
    .filter((item) => item.memberId === member?.id && item.status === 'paid')
    .reduce((total, item) => total + item.amountCents, 0)
  const reservations = view!.reservations.filter((item) => item.memberId === member?.id).length

  async function changeAccess(active: boolean) {
    const done = await command.run(
      async () => {
        await gateway.setMemberActive(selectedId, current!.id, active)
        return true
      },
      active ? 'Acceso del socio reactivado.' : 'Socio dado de baja. Su historial se conserva.',
    )
    if (done) onClose()
  }

  return (
    <Modal open onClose={onClose} title={member ? 'Ficha del socio' : 'Nuevo socio'}>
      {current && (
        <div className="bg-canvas mb-6 flex items-center gap-3 rounded-xl p-3.5">
          <Avatar large>{initials(current.name)}</Avatar>
          <div>
            <h3 className="mb-2">{current.name}</h3>
            <p className="text-muted mb-2 text-xs">
              {current.number} · Alta: {new Date(current.joinedAt).toLocaleDateString('es-ES')}
            </p>
            <Badge tone={current.active ? 'green' : 'gray'}>
              {current.active ? 'Acceso activo' : 'Cuenta de baja'}
            </Badge>
          </div>
        </div>
      )}
      <form
        className="grid gap-5"
        onSubmit={async (event) => {
          event.preventDefault()
          const input = readMemberForm(event.currentTarget)
          const result = await command.run(
            () => gateway.saveMember(selectedId, input, member?.id),
            member
              ? 'Datos del socio actualizados.'
              : 'Socio creado. Ya aparece en el selector de perfiles.',
          )
          if (result) onClose()
        }}
      >
        <MemberFields member={current} />
        {current && (
          <div className="border-line grid grid-cols-2 gap-4 rounded-lg border p-4">
            <div>
              <strong className="text-lg">{reservations}</strong>
              <span className="text-muted mt-1 block text-xs">Reservas históricas</span>
            </div>
            <div>
              <strong className="text-lg">{money(paid)}</strong>
              <span className="text-muted mt-1 block text-xs">Pagado · simulado</span>
            </div>
          </div>
        )}
        <InlineError>{command.error}</InlineError>
        <Button type="submit" disabled={command.busy}>
          <Check size={17} />
          {command.busy ? 'Guardando…' : member ? 'Guardar cambios' : 'Crear socio'}
        </Button>
      </form>
      {current && (
        <section className="border-line mt-6 border-t pt-6">
          <h3 className="text-sm">{current.active ? 'Acceso al club' : 'Reactivar cuenta'}</h3>
          <p className="text-muted my-3 text-sm">
            {current.active
              ? 'La baja desactiva el acceso, pero conserva todos los pagos y reservas. Las reservas futuras no se cancelan automáticamente.'
              : 'El socio podrá volver a consultar sus datos y reservar pistas.'}
          </p>
          {confirm ? (
            <div className="grid gap-5">
              <strong>¿Confirmas la baja de {current.name}?</strong>
              <div className="flex flex-wrap gap-2 [&>button]:flex-1">
                <Button variant="secondary" onClick={() => setConfirm(false)}>
                  Volver
                </Button>
                <Button
                  variant="danger"
                  disabled={command.busy}
                  onClick={() => void changeAccess(false)}
                >
                  Confirmar baja
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant={current.active ? 'ghost' : 'secondary'}
              disabled={command.busy}
              onClick={() => (current.active ? setConfirm(true) : void changeAccess(true))}
            >
              {current.active ? 'Dar de baja al socio' : 'Reactivar acceso'}
            </Button>
          )}
        </section>
      )}
    </Modal>
  )
}
