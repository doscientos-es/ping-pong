import { Link } from 'react-router-dom'

import type { Profile } from '../../features/club/domain/model'
import { UserMenu } from '../../features/session/user-menu'
import { CLUB_SHORT_NAME } from '../../shared/brand'
import { InstallButton } from '../install-button'

export function ClubHeader({
  title,
  actor,
  onSwitchProfile,
}: {
  title: string
  actor?: Profile
  onSwitchProfile: () => void
}) {
  return (
    <header className="border-line bg-surface desktop:static desktop:px-5 desktop:pt-0 wide:px-6 sticky top-0 z-30 flex h-[var(--app-header-height)] items-center justify-between gap-3 border-b px-3 pt-[env(safe-area-inset-top)]">
      <div className="text-muted desktop:flex hidden items-center gap-3 text-[13px]">
        <span>Mi club</span>
        <span>/</span>
        <strong>{title}</strong>
      </div>
      <Link
        to="/"
        className="font-heading desktop:hidden flex min-h-11 items-center gap-2 text-base font-semibold tracking-tight"
      >
        <img src="/favicon.svg" alt="" className="size-6" />
        {CLUB_SHORT_NAME}.
      </Link>
      <div className="desktop:gap-3 flex items-center gap-2">
        <InstallButton />
        <span className="border-line desktop:block hidden h-6 border-l" />
        <UserMenu actor={actor} onSwitchProfile={onSwitchProfile} />
      </div>
    </header>
  )
}
