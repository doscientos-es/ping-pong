import { PageHeading } from '../../../shared/ui'

export function ClubWelcome({ admin }: { admin: boolean }) {
  return <PageHeading title={admin ? 'Gestión de pistas' : 'Reservar pista'} />
}
