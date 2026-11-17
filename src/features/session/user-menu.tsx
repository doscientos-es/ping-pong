import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useClub } from '../../app/club-context'
import { Button, InlineError, Modal, useCommand } from '../../shared/ui'
import type { Profile } from '../club/domain/model'
import { ProfileAvatar } from './profile-avatar'

export function UserMenu({
  actor,
  onSwitchProfile,
  onHelp,
  sidebar = false,
}: {
  actor?: Profile
  onSwitchProfile: () => void
  onHelp: () => void
  sidebar?: boolean
}) {
  const [open, setOpen] = useState(false)
  const { signOut } = useClub()
  const command = useCommand()
  return (
    <>
      <Button
        variant="ghost"
        tooltip="Mi cuenta"
        aria-label={sidebar ? 'Menú de usuario de la barra lateral' : 'Menú de usuario'}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={
          sidebar
            ? 'border-line bg-canvas h-auto w-full min-w-0 justify-start gap-2.5 rounded-xl border p-2.5 text-left'
            : undefined
        }
        onClick={() => setOpen(true)}
      >
        <ProfileAvatar name={actor?.name} admin={actor?.role === 'admin'} small={!sidebar} />
        {sidebar && (
          <span className="min-w-0 flex-1">
            <strong className="text-green block truncate text-[13px] leading-5 font-semibold">
              {actor?.name.split(' · ')[0] ?? 'Elegir perfil'}
            </strong>
            <small className="text-muted block truncate text-[11px] leading-4">
              {actor?.role === 'admin' ? 'Administrador' : 'Socio del club'}
            </small>
          </span>
        )}
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
            variant="ghost"
            onClick={() => {
              setOpen(false)
              onHelp()
            }}
          >
            ¿Cómo funciona?
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
