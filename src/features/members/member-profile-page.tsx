import { ArrowLeft, CalendarDays, Check, CreditCard } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { useClub } from '../../app/club-context'
import { initials, money } from '../../shared/format'
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  InlineError,
  PageHeading,
  Panel,
  Stat,
  StatsGrid,
  useCommand,
} from '../../shared/ui'
import type { Member } from '../club/domain/model'
import { MemberFields, readMemberForm } from './member-fields'
import { MemberHistory } from './member-history'

export function MemberProfilePage() {
  const { id } = useParams()
  const { view } = useClub()
  const member = view!.members.find((item) => item.id === id && item.role === 'member')
  if (!member) {
    return (
      <>
        <PageHeading title="Socio no encontrado" />
        <p className="text-muted mb-4 text-sm">
          Este socio no existe o ya no está en gestión de socios.
        </p>
        <ButtonLink to="/socios" variant="secondary">
          Volver a socios
        </ButtonLink>
      </>
    )
  }
  return <MemberProfile key={member.id} member={member} />
}

function MemberProfile({ member }: { member: Member }) {
  const { view, gateway, selectedId } = useClub()
  const [confirm, setConfirm] = useState(false)
  const save = useCommand()
  const access = useCommand()
  const reservations = view!.reservations.filter((item) => item.memberId === member.id)
  const payments = view!.payments.filter((item) => item.memberId === member.id)
  const paid = payments
    .filter((item) => item.status === 'paid')
    .reduce((total, item) => total + item.amountCents, 0)

  async function changeAccess(active: boolean) {
    const done = await access.run(
      async () => {
        await gateway.setMemberActive(selectedId, member.id, active)
        return true
      },
      active ? 'Acceso del socio reactivado.' : 'Socio dado de baja. Su historial se conserva.',
    )
    if (done) setConfirm(false)
  }

  return (
    <>
      <PageHeading
        title="Ficha del socio"
        action={
          <ButtonLink to="/socios" variant="secondary">
            <ArrowLeft size={17} />
            Volver a socios
          </ButtonLink>
        }
      />
      <div className="mb-3 flex items-center gap-3">
        <Avatar large>{initials(member.name)}</Avatar>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{member.name}</h2>
          <p className="text-muted text-xs">
            {member.number} · Alta: {new Date(member.joinedAt).toLocaleDateString('es-ES')}
          </p>
          <Badge tone={member.active ? 'green' : 'gray'}>
            {member.active ? 'Acceso activo' : 'Cuenta de baja'}
          </Badge>
        </div>
      </div>
      <StatsGrid>
        <Stat label="Reservas históricas" value={reservations.length} icon={CalendarDays} />
        <Stat
          label="Total cobrado"
          value={money(paid)}
          icon={CreditCard}
          note="Excluye pagos anulados"
        />
      </StatsGrid>
      <div className="desktop:grid-cols-2 grid items-start gap-3">
        <Panel className="p-4">
          <h2 className="mb-4 text-sm font-semibold">Datos del socio</h2>
          <form
            className="grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault()
              const input = readMemberForm(event.currentTarget)
              await save.run(
                () => gateway.saveMember(selectedId, input, member.id),
                'Datos del socio actualizados.',
              )
            }}
          >
            <MemberFields member={member} />
            <InlineError>{save.error}</InlineError>
            <div>
              <Button type="submit" disabled={save.busy}>
                <Check size={17} />
                {save.busy ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </Panel>
        <Panel className="p-4">
          <h2 className="text-sm font-semibold">Acceso al club</h2>
          <p className="text-muted my-3 text-sm">
            {member.active
              ? 'La baja desactiva el acceso, pero conserva todos los pagos y reservas. Las reservas futuras no se cancelan automáticamente.'
              : 'El socio podrá volver a consultar sus datos y reservar pistas.'}
          </p>
          <InlineError className="mb-3">{access.error}</InlineError>
          {confirm ? (
            <div className="grid gap-3">
              <strong>¿Confirmas la baja de {member.name}?</strong>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setConfirm(false)}>
                  Volver
                </Button>
                <Button
                  variant="danger"
                  disabled={access.busy}
                  onClick={() => void changeAccess(false)}
                >
                  Confirmar baja
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant={member.active ? 'ghost' : 'secondary'}
              disabled={access.busy}
              onClick={() => (member.active ? setConfirm(true) : void changeAccess(true))}
            >
              {member.active ? 'Dar de baja al socio' : 'Reactivar acceso'}
            </Button>
          )}
        </Panel>
      </div>
      <MemberHistory memberId={member.id} reservations={reservations} payments={payments} />
    </>
  )
}
