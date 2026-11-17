import { ArrowUpRight } from 'lucide-react'
import { useMemo } from 'react'

import { initials } from '../../shared/format'
import { Avatar, Badge, Button } from '../../shared/ui'
import type { Member, Reservation } from '../club/domain/model'

const row =
  'grid grid-cols-[minmax(0,1fr)_70px_16px] items-center gap-2.5 px-3.5 py-4 desktop:grid-cols-[minmax(140px,1fr)_minmax(130px,1fr)_70px_20px] desktop:px-6 wide:grid-cols-[minmax(160px,1.2fr)_minmax(160px,1.2fr)_95px_70px_20px] wide:gap-4'

export function MemberList({
  members,
  reservations,
  onEdit,
}: {
  members: Member[]
  reservations: Reservation[]
  onEdit: (member: Member) => void
}) {
  const reservationCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const { memberId } of reservations) counts.set(memberId, (counts.get(memberId) ?? 0) + 1)
    return counts
  }, [reservations])
  return (
    <div>
      <div className={`${row} max-desktop:hidden text-muted text-xs`}>
        <span>Socio</span>
        <span>Contacto</span>
        <span>Estado</span>
        <span className="wide:block hidden">Reservas</span>
        <span />
      </div>
      {members.map((member, index) => (
        <Button
          variant="ghost"
          className={`${row} border-line hover:bg-canvas h-auto w-full border-b text-left`}
          key={member.id}
          onClick={() => onEdit(member)}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Avatar index={index}>{initials(member.name)}</Avatar>
            <span className="min-w-0">
              <strong className="block truncate text-sm">{member.name}</strong>
              <small className="text-muted mt-1 block text-xs">{member.number}</small>
            </span>
          </span>
          <span className="desktop:block hidden truncate text-[13px]">
            {member.email}
            <small className="text-muted mt-1 block text-xs">
              {member.phone || 'Sin teléfono'}
            </small>
          </span>
          <span>
            <Badge tone={member.active ? 'green' : 'gray'}>
              {member.active ? 'Activo' : 'De baja'}
            </Badge>
          </span>
          <span className="text-green-mid wide:block hidden pl-3 text-xs">
            {reservationCounts.get(member.id) ?? 0}
          </span>
          <ArrowUpRight size={18} className="text-muted" />
        </Button>
      ))}
    </div>
  )
}
