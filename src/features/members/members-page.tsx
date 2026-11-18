import { Plus, ShieldCheck, UserCheck, UserRound, Users } from 'lucide-react'
import { useState } from 'react'

import { useClubClock } from '../../app/club-clock'
import { useClub } from '../../app/club-context'
import {
  Button,
  Empty,
  ListFooter,
  ListToolbar,
  PageHeading,
  Panel,
  SearchField,
  SectionHeading,
  Stat,
  StatsGrid,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../shared/ui'
import { hasSubscription } from '../club/domain/rules'
import { InvitationDialog } from '../session/invitation-dialog'
import { RolesPanel } from '../session/roles-panel'
import { MemberEditor } from './member-editor'
import { MemberList } from './member-list'

export function MembersPage() {
  const { view } = useClub()
  const now = useClubClock()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [creating, setCreating] = useState(false)
  const [inviting, setInviting] = useState(false)
  const all = view!.members.filter((member) => member.role === 'member')
  const members = all.filter(
    (member) =>
      (status === 'all' ||
        (status === 'pending'
          ? member.active && !hasSubscription(view!, member.id, now)
          : (status === 'active') === member.active)) &&
      `${member.name} ${member.email} ${member.number}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  )
  return (
    <>
      <PageHeading
        title="Socios"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setInviting(true)}>
              Invitar usuario
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus size={18} />
              Nuevo socio
            </Button>
          </div>
        }
      />
      <StatsGrid>
        <Stat label="Socios del club" value={all.length} icon={Users} />
        <Stat
          label="Acceso activo"
          value={all.filter((member) => member.active).length}
          icon={UserCheck}
        />
        <Stat
          label="Cuentas de baja"
          value={all.filter((member) => !member.active).length}
          icon={ShieldCheck}
        />
      </StatsGrid>
      <Tabs defaultSelectedKey="members">
        <TabsList aria-label="Secciones de socios">
          <TabsTrigger id="members">Socios</TabsTrigger>
          <TabsTrigger id="access">Accesos y roles</TabsTrigger>
        </TabsList>
        <TabsContent id="members">
          <Panel>
            <SectionHeading title="Listado de socios" />
            <ListToolbar>
              <SearchField
                aria-label="Buscar socios"
                placeholder="Buscar por nombre, email o número…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select
                aria-label="Filtrar socios por estado"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="all">Todos los socios</option>
                <option value="active">Activos</option>
                <option value="pending">Cuota pendiente</option>
                <option value="inactive">De baja</option>
              </select>
            </ListToolbar>
            {members.length ? (
              <MemberList members={members} reservations={view!.reservations} />
            ) : (
              <Empty icon={UserRound} title="No hay socios con estos filtros">
                Prueba con otro nombre o cambia el filtro de estado.
              </Empty>
            )}
            <ListFooter>
              <span>{members.length} socios</span>
            </ListFooter>
          </Panel>
        </TabsContent>
        <TabsContent id="access">
          <RolesPanel />
        </TabsContent>
      </Tabs>
      {creating && <MemberEditor onClose={() => setCreating(false)} />}
      {inviting && <InvitationDialog onClose={() => setInviting(false)} />}
    </>
  )
}
