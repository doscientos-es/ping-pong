import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@doscientos/ui/dropdown-menu'
import { ChevronDown, CircleHelp, LogOut, Settings, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useClub } from '../../app/club-context'
import { messageOf } from '../../shared/format'
import { Button } from '../../shared/ui'
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
  const { signOut, notify } = useClub()
  const navigate = useNavigate()
  return (
    <DropdownMenu
      isOpen={open}
      onOpenChange={setOpen}
      placement={sidebar ? 'top start' : 'bottom end'}
      className="min-w-56"
      onAction={(key) => {
        setOpen(false)
        if (key === 'account') navigate('/cuenta')
        if (key === 'profiles') onSwitchProfile()
        if (key === 'help') onHelp()
        if (key === 'signout') {
          try {
            signOut()
          } catch (error) {
            notify(messageOf(error))
          }
        }
      }}
      trigger={
        <Button
          variant="ghost"
          aria-label={sidebar ? 'Menú de usuario de la barra lateral' : 'Menú de usuario'}
          className={
            sidebar
              ? 'h-auto w-full min-w-0 justify-start gap-2 rounded-lg px-2 py-1.5 text-left'
              : undefined
          }
        >
          <ProfileAvatar name={actor?.name} admin={actor?.role === 'admin'} small />
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
          <ChevronDown size={15} className="text-muted shrink-0" />
        </Button>
      }
    >
      <DropdownMenuItem id="account" textValue="Ajustes de cuenta" className="max-desktop:min-h-11">
        <Settings />
        Ajustes de cuenta
      </DropdownMenuItem>
      <DropdownMenuItem id="profiles" textValue="Cambiar perfil" className="max-desktop:min-h-11">
        <UsersRound />
        Cambiar perfil
      </DropdownMenuItem>
      <DropdownMenuItem id="help" textValue="¿Cómo funciona?" className="max-desktop:min-h-11">
        <CircleHelp />
        ¿Cómo funciona?
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem id="signout" textValue="Cerrar sesión" className="max-desktop:min-h-11">
        <LogOut />
        Cerrar sesión
      </DropdownMenuItem>
    </DropdownMenu>
  )
}
