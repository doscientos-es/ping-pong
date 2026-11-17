import { useState } from 'react'
import { useLocation } from 'react-router-dom'

import { DemoHelpDialog } from '../features/session/demo-help-dialog'
import { AccountSelection, ProfileSwitcher } from '../features/session/profile-switcher'
import { CLUB_NAME } from '../shared/brand'
import { useOnlineStatus } from '../shared/use-online-status'
import { navigationFor } from './app-routes'
import { ClubContent } from './club-content'
import { useClub } from './club-context'
import { ClubHeader } from './layout/club-header'
import { ClubNavigation } from './layout/club-navigation'
import { ClubSidebar } from './layout/club-sidebar'
import { usePageEffects } from './use-page-effects'

export function ClubShell() {
  const { profiles, selectedId, loading, error } = useClub()
  const [dialog, setDialog] = useState<'profiles' | 'help' | null>(null)
  const online = useOnlineStatus()
  const { pathname } = useLocation()
  const actor = profiles.find((profile) => profile.id === selectedId)
  const navigation = navigationFor(actor?.role ?? 'member')
  const title =
    pathname === '/cuenta'
      ? 'Mi cuenta'
      : (navigation.find((item) => item.to === pathname)?.label ?? CLUB_NAME)
  const openProfiles = () => setDialog('profiles')
  const closeDialog = () => setDialog(null)
  usePageEffects(title, selectedId)

  if (!selectedId && !loading)
    return (
      <main className="mx-auto grid min-h-dvh max-w-lg content-center gap-4 px-4 py-8">
        <h1 className="text-lg">{CLUB_NAME}</h1>
        {error ? <p role="alert">{error}</p> : <AccountSelection />}
      </main>
    )

  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="fixed -top-20 left-4 z-[200] bg-white p-3 focus:top-3"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        Saltar al contenido
      </a>
      <ClubSidebar
        actor={actor}
        navigation={navigation}
        onSwitchProfile={openProfiles}
        onHelp={() => setDialog('help')}
      />
      <div className="desktop:ml-[var(--club-sidebar-width)]">
        <ClubHeader title={title} actor={actor} onSwitchProfile={openProfiles} />
        {!online && (
          <p
            role="status"
            className="bg-[#f9f0d9] px-6 py-3 text-center text-[13px] text-[#9b7e4a]"
          >
            Estás sin conexión. Puedes seguir usando la demo: todo se guarda en este dispositivo.
          </p>
        )}
        <main
          id="main-content"
          tabIndex={-1}
          className="desktop:px-5 desktop:py-5 wide:px-6 mx-auto max-w-[1480px] px-3 pt-3 pb-[calc(var(--mobile-nav-height)+16px)] outline-none"
        >
          <ClubContent onSwitchProfile={openProfiles} />
        </main>
      </div>
      <ClubNavigation items={navigation} mobile />
      <ProfileSwitcher open={dialog === 'profiles'} onClose={closeDialog} />
      <DemoHelpDialog open={dialog === 'help'} onClose={closeDialog} />
    </div>
  )
}
