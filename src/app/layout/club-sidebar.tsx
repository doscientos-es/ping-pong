import { Link } from 'react-router-dom'

import type { Profile } from '../../features/club/domain/model'
import { UserMenu } from '../../features/session/user-menu'
import { CLUB_NAME } from '../../shared/brand'
import type { NavigationItem } from '../app-routes'
import { InstallButton } from '../install-button'
import { ClubNavigation } from './club-navigation'

export function ClubSidebar({
  actor,
  navigation,
  onSwitchProfile,
  onHelp,
  mobileInstallTarget,
}: {
  actor?: Profile
  navigation: NavigationItem[]
  onSwitchProfile: () => void
  onHelp: () => void
  mobileInstallTarget: HTMLElement | null
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
        <InstallButton sidebar mobileTarget={mobileInstallTarget} />
        <UserMenu actor={actor} onSwitchProfile={onSwitchProfile} onHelp={onHelp} sidebar />
      </div>
    </aside>
  )
}
