import { ShieldCheck } from 'lucide-react'

import { CLUB_NAME } from '../../shared/brand'
import { initials } from '../../shared/format'
import { Avatar } from '../../shared/ui/avatar'

export function ProfileAvatar({
  name = CLUB_NAME,
  admin = false,
  small = false,
}: {
  name?: string
  admin?: boolean
  small?: boolean
}) {
  return (
    <Avatar small={small}>{admin ? <ShieldCheck size={small ? 16 : 20} /> : initials(name)}</Avatar>
  )
}
