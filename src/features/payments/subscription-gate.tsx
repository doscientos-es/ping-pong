import { Check, Infinity as InfinityIcon, LockKeyhole } from 'lucide-react'
import { useState } from 'react'

import { useClubClock } from '../../app/club-clock'
import { useClub } from '../../app/club-context'
import { CourtArt } from '../../shared/court-art'
import { money, periodLabel } from '../../shared/format'
import { Badge, Button } from '../../shared/ui'
import { requirePlan } from '../club/domain/plans'
import { periodKey } from '../club/domain/rules'
import { SubscriptionDialog } from './subscription-dialog'

export function SubscriptionGate() {
  const { view, selectedId } = useClub()
  const now = useClubClock()
  const [paying, setPaying] = useState(false)
  const period = periodKey(now)
  const plan = requirePlan(view!.settings, view!.actor.planId)
  return (
    <>
      <section className="desktop:gap-6 desktop:px-4 desktop:pt-0 mx-auto grid max-w-[600px] justify-items-center gap-5 px-1 pt-3 pb-8 text-center">
        <div className="bg-accent-soft desktop:h-[190px] desktop:w-[280px] relative h-[150px] w-[240px] rounded-full">
          <CourtArt className="desktop:h-[220px] desktop:w-[310px] absolute -top-4 -right-5 h-[180px] w-[270px]" />
        </div>
        <Badge tone="orange">
          <LockKeyhole size={13} />
          Cuota pendiente · {periodLabel(period)}
        </Badge>
        <h1 className="desktop:text-xl text-lg">Activa tu suscripción para reservar</h1>
        <p className="text-sm">{plan.name}</p>
        <div className="flex items-baseline gap-2">
          <strong className="font-heading text-2xl tracking-tight">{money(plan.priceCents)}</strong>
          <span className="text-muted text-xs">/ mes natural</span>
        </div>
        <ul className="text-green-mid m-0 grid list-none gap-3 p-0 text-left text-xs">
          <li className="flex items-center gap-2.5">
            <InfinityIcon size={19} />
            Reservas ilimitadas incluidas
          </li>
          <li className="flex items-center gap-2.5">
            <Check size={18} />8 pistas cubiertas
          </li>
          <li className="flex items-center gap-2.5">
            <Check size={18} />
            Sin pagos por reserva
          </li>
        </ul>
        <Button onClick={() => setPaying(true)}>Activar suscripción · pago simulado</Button>
        <p className="text-muted max-w-[370px] text-xs leading-relaxed">
          Demo sin cobros reales. También puedes cambiar al administrador para registrar el pago
          manualmente.
        </p>
      </section>
      {paying && (
        <SubscriptionDialog
          memberId={selectedId}
          period={period}
          onClose={() => setPaying(false)}
        />
      )}
    </>
  )
}
