import { Link } from 'react-router-dom'

import type { Profile } from '../../features/club/domain/model'
import { UserMenu } from '../../features/session/user-menu'
import { CLUB_SHORT_NAME } from '../../shared/brand'

export function ClubHeader({
  actor,
  onSwitchProfile,
  onHelp,
  installTargetRef,
}: {
  actor?: Profile
  onSwitchProfile: () => void
  onHelp: () => void
  installTargetRef: (node: HTMLDivElement | null) => void
}) {
  return (
    <header className="border-line bg-surface desktop:hidden sticky top-0 z-30 flex h-[var(--app-header-height)] items-center justify-between gap-3 border-b px-3 pt-[env(safe-area-inset-top)]">
      <Link
        to="/"
        className="font-heading flex min-h-11 items-center gap-2 text-base font-semibold tracking-tight"
      >
        <img src="/favicon.svg" alt="" className="size-6" />
        {CLUB_SHORT_NAME}.
      </Link>
      <div className="flex items-center gap-2">
        <div ref={installTargetRef} />
        <UserMenu actor={actor} onSwitchProfile={onSwitchProfile} onHelp={onHelp} />
      </div>
    </header>
  )
}
