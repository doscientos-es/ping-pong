import type { SelectHTMLAttributes } from 'react'

import { useClub } from '../../app/club-context'
import { money } from '../../shared/format'

export function ClubPlanSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { plans } = useClub()
  return (
    <select {...props}>
      {plans.map((plan) => (
        <option key={plan.id} value={plan.id}>
          {plan.name} · {money(plan.priceCents)} / mes
        </option>
      ))}
    </select>
  )
}
