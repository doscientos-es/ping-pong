import { ArrowRightLeft, CircleHelp } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { Profile } from '../../features/club/domain/model'
import { ProfileAvatar } from '../../features/session/profile-avatar'
import { CLUB_NAME } from '../../shared/brand'
import { Button } from '../../shared/ui'
import type { NavigationItem } from '../app-routes'
import { ClubNavigation } from './club-navigation'

export function ClubSidebar({
  actor,
  navigation,
  onSwitchProfile,
  onHelp,
}: {
  actor?: Profile
  navigation: NavigationItem[]
  onSwitchProfile: () => void
  onHelp: () => void
}) {
  return (
    <aside className="border-line bg-surface desktop:flex fixed inset-y-0 left-0 z-20 hidden w-[var(--club-sidebar-width)] flex-col overflow-y-auto border-r">
      <div className="border-line flex min-h-[var(--app-header-height)] shrink-0 items-center border-b px-5">
        <Link
          to="/"
          className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-offset-2"
        >
          <img src="/favicon.svg" alt="" className="size-8 shrink-0" />
          <span className="font-heading text-green truncate text-base font-semibold tracking-tight">
            {CLUB_NAME}
            <span className="text-green-mid">.</span>
          </span>
        </Link>
      </div>
      <div className="px-3 py-5">
        <p className="text-muted mb-3 px-3 text-[10px] font-semibold tracking-[0.14em] uppercase">
          {actor?.role === 'admin' ? 'Administración' : 'Mi club'}
        </p>
        <ClubNavigation items={navigation} />
      </div>
      <div className="border-line mt-auto grid gap-2 border-t p-3">
        <Button
          variant="ghost"
          className="text-muted desktop:min-h-11 w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-xs"
          onClick={onHelp}
        >
          <CircleHelp size={18} aria-hidden="true" className="shrink-0" />
          ¿Cómo funciona?
        </Button>
        <Button
          variant="ghost"
          tooltip="Cambiar perfil"
          className="border-line bg-canvas h-auto w-full min-w-0 justify-start gap-2.5 rounded-xl border p-2.5 text-left"
          onClick={onSwitchProfile}
        >
          <span aria-hidden="true" className="shrink-0">
            <ProfileAvatar name={actor?.name} admin={actor?.role === 'admin'} />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="text-green block truncate text-[13px] leading-5 font-semibold">
              {actor?.name.split(' · ')[0] ?? 'Elegir perfil'}
            </strong>{' '}
            <small className="text-muted block truncate text-[11px] leading-4">
              {actor?.role === 'admin' ? 'Administrador' : 'Socio del club'}
            </small>
          </span>
          <ArrowRightLeft size={16} aria-hidden="true" className="text-muted shrink-0" />
        </Button>
      </div>
    </aside>
  )
}
