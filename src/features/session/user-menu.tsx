import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'

import { useClub } from '../../app/club-context'
import type { Profile } from '../club/domain/model'
import { Button, InlineError, Modal, useCommand } from '../../shared/ui'
import { ProfileAvatar } from './profile-avatar'

export function UserMenu({
  actor,
  onSwitchProfile,
}: {
  actor?: Profile
  onSwitchProfile: () => void
}) {
  const [open, setOpen] = useState(false)
  const { signOut } = useClub()
  const command = useCommand()
  return (
    <>
      <Button
        variant="ghost"
        tooltip="Mi cuenta"
        aria-label="Menú de usuario"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <ProfileAvatar name={actor?.name} admin={actor?.role === 'admin'} small />
        <span className="desktop:inline hidden">{actor?.name.split(' ')[0] ?? 'Cuenta'}</span>
        <ChevronDown size={15} />
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Mi cuenta">
        <div className="grid gap-2">
          <Link
            to="/cuenta"
            className="hover:bg-canvas flex min-h-11 items-center rounded-lg px-3 text-sm"
            onClick={() => setOpen(false)}
          >
            Ajustes de cuenta
          </Link>
          <Button
            variant="ghost"
            onClick={() => {
              setOpen(false)
              onSwitchProfile()
            }}
          >
            Cambiar perfil
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              const done = await command.run(async () => {
                signOut()
                return true
              })
              if (done) setOpen(false)
            }}
          >
            Cerrar sesión
          </Button>
          <InlineError>{command.error}</InlineError>
        </div>
      </Modal>
    </>
  )
}
