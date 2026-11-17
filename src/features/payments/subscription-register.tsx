import { Plus } from 'lucide-react'
import { useId, useMemo } from 'react'
import { Link } from 'react-router-dom'

import { Badge, Button, Pagination } from '../../shared/ui'
import { usePagination } from '../../shared/use-pagination'
import type { ClubPlan, Member, Payment } from '../club/domain/model'

export type SubscriptionFilters = { status: string; plan: string; access: string }

export function SubscriptionRegister({
  members,
  payments,
  month,
  query,
  plans,
  filters,
  onFiltersChange,
  filtersOpen,
  filtersId,
  onClearSearch,
  onPay,
  onVoid,
}: {
  members: Member[]
  payments: Payment[]
  month: string
  query: string
  plans: ClubPlan[]
  filters: SubscriptionFilters
  onFiltersChange: (filters: SubscriptionFilters) => void
  filtersOpen: boolean
  filtersId: string
  onClearSearch: () => void
  onPay: (memberId: string) => void
  onVoid: (payment: Payment) => void
}) {
  const { status, plan, access } = filters
  const resultsId = useId()
  const paid = useMemo(() => {
    const result = new Map<string, Payment>()
    for (const payment of payments) {
      if (payment.period === month && payment.status === 'paid' && !result.has(payment.memberId))
        result.set(payment.memberId, payment)
    }
    return result
  }, [payments, month])
  const planNames = useMemo(() => new Map(plans.map((item) => [item.id, item.name])), [plans])
  const filtered = members.filter(
    (member) =>
      (status === 'all' || (status === 'paid') === paid.has(member.id)) &&
      (plan === 'all' || member.planId === plan) &&
      (access === 'all' || (access === 'active') === member.active),
  )
  const pagination = usePagination(filtered, JSON.stringify([month, query, status, plan, access]))
  const hasFilters = Boolean(query) || status !== 'all' || plan !== 'all' || access !== 'all'

  return (
    <div>
      <div id={filtersId} hidden={!filtersOpen}>
        <div className="border-line bg-canvas/50 desktop:px-4 flex flex-wrap items-end gap-3 border-b px-3 py-3">
          <label className="text-muted grid min-w-36 flex-1 gap-1 text-xs">
            Estado de la cuota
            <select
              value={status}
              onChange={(event) => onFiltersChange({ ...filters, status: event.target.value })}
            >
              <option value="all">Todos los estados</option>
              <option value="paid">Al corriente</option>
              <option value="pending">Pendientes</option>
            </select>
          </label>
          <label className="text-muted grid min-w-36 flex-1 gap-1 text-xs">
            Cuota asignada
            <select
              value={plan}
              onChange={(event) => onFiltersChange({ ...filters, plan: event.target.value })}
            >
              <option value="all">Todas las cuotas</option>
              {plans.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-muted grid min-w-36 flex-1 gap-1 text-xs">
            Acceso del socio
            <select
              value={access}
              onChange={(event) => onFiltersChange({ ...filters, access: event.target.value })}
            >
              <option value="all">Todos los accesos</option>
              <option value="active">Activos</option>
              <option value="inactive">De baja</option>
            </select>
          </label>
          <Button
            variant="ghost"
            disabled={!hasFilters}
            onClick={() => {
              onFiltersChange({ status: 'all', plan: 'all', access: 'all' })
              onClearSearch()
            }}
          >
            Limpiar filtros de cuotas
          </Button>
        </div>
      </div>
      <div id={resultsId} className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <caption className="sr-only">Cuotas por socio</caption>
          <thead className="bg-canvas text-muted text-xs">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">
                Socio
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Cuota asignada
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Estado
              </th>
              <th scope="col" className="px-4 py-2 text-right font-medium">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {pagination.items.map((member) => {
              const payment = paid.get(member.id)
              return (
                <tr key={member.id} className="border-line border-t">
                  <th scope="row" className="px-4 py-2 font-medium">
                    <Link
                      className="text-green hover:underline"
                      to={`/socios/${encodeURIComponent(member.id)}`}
                    >
                      {member.name}
                    </Link>
                    <span className="text-muted block text-xs">
                      {member.number}
                      {!member.active && ' · Cuenta de baja'}
                    </span>
                  </th>
                  <td className="px-4 py-2">
                    {planNames.get(member.planId) ?? 'Cuota no disponible'}
                  </td>
                  <td className="px-4 py-2">
                    <Badge tone={payment ? 'green' : 'orange'}>
                      {payment ? 'Al corriente' : 'Pendiente'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {payment ? (
                      <Button variant="ghost" onClick={() => onVoid(payment)}>
                        Marcar no pagada
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        disabled={!member.active}
                        onClick={() => onPay(member.id)}
                      >
                        <Plus size={15} />
                        Registrar pago
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!pagination.total && (
          <p className="text-muted px-4 py-6 text-center text-sm">
            No hay socios con estos filtros.
          </p>
        )}
      </div>
      {pagination.total > 12 ? (
        <Pagination pagination={pagination} label="socios" controls={resultsId} />
      ) : (
        <p role="status" className="text-muted border-line border-t px-4 py-3 text-xs">
          {pagination.total} socios
        </p>
      )}
    </div>
  )
}
