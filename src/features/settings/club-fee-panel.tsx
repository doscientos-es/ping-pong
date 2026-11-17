import { Plus } from 'lucide-react'

import { useClub } from '../../app/club-context'
import { Button, Panel } from '../../shared/ui'
import type { ClubPlan } from '../club/domain/model'

export function ClubFeePanel({
  plans,
  priceTexts,
  onChange,
  onPriceChange,
}: {
  plans: ClubPlan[]
  priceTexts: Record<string, string>
  onChange: (plans: ClubPlan[]) => void
  onPriceChange: (id: string, value: string) => void
}) {
  const { view } = useClub()
  const assigned = new Set(view!.members.map((member) => member.planId))
  return (
    <Panel className="desktop:p-6 grid gap-4 p-5">
      <h2 className="text-sm">Cuotas del club</h2>
      <p className="text-muted text-xs leading-relaxed">
        Cada usuario elige una cuota al darse de alta. Por ahora todas incluyen reservas ilimitadas.
        Los cambios de precio solo se aplican a pagos nuevos; los periodos ya pagados no cambian.
      </p>
      {plans.map((plan, index) => (
        <fieldset key={plan.id} className="border-line grid min-w-0 gap-3 rounded-xl border p-4">
          <legend className="px-1 text-sm font-semibold">Cuota {index + 1}</legend>
          <label>
            Nombre de la cuota
            <input
              required
              minLength={2}
              maxLength={80}
              value={plan.name}
              onChange={(event) =>
                onChange(
                  plans.map((item) =>
                    item.id === plan.id ? { ...item, name: event.target.value } : item,
                  ),
                )
              }
            />
          </label>
          <label>
            Cuota mensual (€)
            <input
              type="number"
              required
              min="1"
              max="1000"
              step="0.01"
              value={priceTexts[plan.id] ?? String(plan.priceCents / 100)}
              onChange={(event) => onPriceChange(plan.id, event.target.value)}
            />
          </label>
          <Button
            variant="secondary"
            disabled={plans.length === 1 || assigned.has(plan.id)}
            aria-label={`Eliminar cuota ${plan.name}`}
            onClick={() => onChange(plans.filter((item) => item.id !== plan.id))}
          >
            Eliminar cuota
          </Button>
          {assigned.has(plan.id) && (
            <p className="text-muted text-xs">
              Asignada a usuarios. Cambia primero su cuota para eliminarla.
            </p>
          )}
        </fieldset>
      ))}
      <Button
        variant="secondary"
        onClick={() =>
          onChange([
            ...plans,
            {
              id: crypto.randomUUID(),
              name: `Cuota ${plans.length + 1}`,
              priceCents: 3900,
            },
          ])
        }
      >
        <Plus size={17} /> Añadir cuota
      </Button>
    </Panel>
  )
}
