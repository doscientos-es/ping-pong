import type { ClubPlan, ClubSettings } from './model'

export const LEGACY_PLAN_ID = 'standard'
export const LEGACY_PLAN_NAME = 'Cuota general'

export function requirePlan(settings: Pick<ClubSettings, 'plans'>, planId: string): ClubPlan {
  const plan = settings.plans.find((item) => item.id === planId)
  if (!plan) throw new Error('La cuota seleccionada ya no está disponible. Elige otra cuota.')
  return plan
}

export function validatePlans(plans: ClubPlan[]) {
  if (!plans.length) throw new Error('Debe existir al menos una cuota.')
  const ids = new Set<string>()
  const names = new Set<string>()
  for (const plan of plans) {
    const name = plan.name.trim().toLocaleLowerCase('es')
    if (!plan.id.trim() || ids.has(plan.id))
      throw new Error('Las cuotas deben tener identificadores únicos.')
    if (name.length < 2 || name.length > 80 || names.has(name))
      throw new Error('Cada cuota necesita un nombre único de entre 2 y 80 caracteres.')
    if (!Number.isInteger(plan.priceCents) || plan.priceCents < 100 || plan.priceCents > 100000)
      throw new Error('La cuota mensual debe estar entre 1 € y 1.000 €.')
    ids.add(plan.id)
    names.add(name)
  }
}
