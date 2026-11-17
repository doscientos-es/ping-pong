import { ArrowRightLeft, LockKeyhole } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { SubscriptionGate } from '../features/payments/subscription-gate'
import { Button } from '../shared/ui'
import { AppRoutes } from './app-routes'
import { useClub } from './club-context'

export function ClubContent({ onSwitchProfile }: { onSwitchProfile: () => void }) {
  const { view, profiles, selectedId, loading, error } = useClub()
  const actor = profiles.find((profile) => profile.id === selectedId)
  const { pathname } = useLocation()
  if (loading)
    return (
      <div className="grid place-items-center gap-6 px-5 py-20 text-center" role="status">
        <img src="/favicon.svg" alt="" className="size-14" />
        <p className="text-muted text-sm">Cargando…</p>
      </div>
    )
  if (!view)
    return (
      <section className="border-line desktop:py-20 grid place-items-center gap-6 rounded-2xl border bg-white px-5 py-12 text-center">
        <LockKeyhole size={42} strokeWidth={1.3} />
        <h1>{actor && !actor.active ? 'Cuenta de baja' : 'No se pudo cargar el perfil'}</h1>
        <p role="alert" className="text-muted max-w-sm text-sm">
          {error}
        </p>
        <Button onClick={onSwitchProfile}>
          <ArrowRightLeft size={18} />
          Cambiar de perfil
        </Button>
        <p className="text-muted max-w-sm text-xs leading-relaxed">
          Las cuentas de baja conservan su historial. El administrador puede reactivar su acceso.
        </p>
      </section>
    )
  if (!view.subscriptionActive && pathname !== '/cuenta')
    return <SubscriptionGate key={selectedId} />
  return <AppRoutes key={selectedId} role={view.actor.role} />
}
