import { Navigate, Route, Routes } from 'react-router-dom'

import { AccountSelection } from '../features/session/profile-switcher'
import { CLUB_NAME } from '../shared/brand'
import { useClub } from './club-context'
import { ClubShell } from './club-shell'
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
    <main className="mx-auto grid min-h-dvh max-w-lg content-center gap-4 px-4 py-8">
      <h1 className="text-lg">{CLUB_NAME}</h1>
      {error ? <p role="alert">{error}</p> : <AccountSelection />}
    </main>
  )
}
