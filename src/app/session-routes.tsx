import { Navigate, Route, Routes } from 'react-router-dom'

import { AccountSelection } from '../features/session/profile-switcher'
import { CLUB_NAME } from '../shared/brand'
import { useClub } from './club-context'
import { ClubShell } from './club-shell'
import { InstallButton } from './install-button'
import { usePageEffects } from './use-page-effects'

export function SessionRoutes() {
  const { selectedId, loading } = useClub()

  if (loading)
    return (
      <main className="grid min-h-dvh place-items-center" role="status">
        Cargando…
      </main>
    )

  return (
    <Routes>
      <Route path="/login" element={selectedId ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="*" element={selectedId ? <ClubShell /> : <Navigate to="/login" replace />} />
    </Routes>
  )
}

function LoginPage() {
  const { error } = useClub()
  usePageEffects('Iniciar sesión', '')

  return (
    <main className="desktop:max-w-5xl mx-auto grid min-h-dvh max-w-lg content-center px-4 py-8">
      <div className="desktop:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] desktop:gap-8 grid items-start gap-5">
        <div className="border-line bg-surface desktop:p-6 grid min-w-0 gap-4 rounded-2xl border p-4">
          <h1 className="text-lg">{CLUB_NAME}</h1>
          {error ? <p role="alert">{error}</p> : <AccountSelection />}
        </div>
        <aside
          aria-label="La app del club"
          className="from-green to-green-mid desktop:p-8 grid min-w-0 gap-5 rounded-2xl bg-linear-to-br p-5 text-white shadow-lg"
        >
          <div className="flex items-center gap-3">
            <img src="/icons/icon-192.png" alt="" width="56" height="56" className="rounded-xl" />
            <div>
              <p className="text-lime text-xs font-semibold">Aplicación web</p>
              <p className="text-sm font-semibold">{CLUB_NAME}</p>
            </div>
          </div>
          <h2 className="text-xl text-white">Instala nuestra app oficial</h2>
          <InstallButton login />
          <p className="text-xs text-white/85">
            Se instala desde el navegador, sin pasar por una tienda.
          </p>
        </aside>
      </div>
    </main>
  )
}
