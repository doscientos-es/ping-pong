import { Receipt, SlidersHorizontal, Wallet, UserCheck } from 'lucide-react'
import { useId, useMemo, useState } from 'react'

import { useClubClock } from '../../app/club-clock'
import { useClub } from '../../app/club-context'
import { emptyDateRange, withinDateRange } from '../../shared/date-range'
import { money, periodLabel } from '../../shared/format'
import {
  Badge,
  Button,
  DateRangeFields,
  Empty,
  ListToolbar,
  Notice,
  PageHeading,
  Pagination,
  Panel,
  SearchField,
  SectionHeading,
  Stat,
  StatsGrid,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../shared/ui'
import { usePagination } from '../../shared/use-pagination'
import type { Payment } from '../club/domain/model'
import { dateKey, periodKey } from '../club/domain/rules'
import { InvoiceDialog } from './invoice-dialog'
import { PaymentList } from './payment-list'
import { SubscriptionDialog } from './subscription-dialog'
import { SubscriptionRegister, type SubscriptionFilters } from './subscription-register'
import { VoidPaymentDialog } from './void-payment-dialog'

export function PaymentsPage() {
  const { view } = useClub()
  const now = useClubClock()
  const admin = view!.actor.role === 'admin'
  const currentPeriod = periodKey(now)
  const subscriptionActive = view!.subscriptionActive
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [month, setMonth] = useState(subscriptionActive ? currentPeriod : '')
  const [tab, setTab] = useState('subscriptions')
  const [selected, setSelected] = useState<Payment | null>(null)
  const [paying, setPaying] = useState<{ memberId: string; period: string } | null>(null)
  const [voiding, setVoiding] = useState<Payment | null>(null)
  const [range, setRange] = useState(emptyDateRange)
  const [subscriptionFilters, setSubscriptionFilters] = useState<SubscriptionFilters>({
    status: 'all',
    plan: 'all',
    access: 'all',
  })
  const [openFilters, setOpenFilters] = useState({ subscriptions: false, receipts: false })
  const resultsId = useId()
  const subscriptionFiltersId = useId()
  const receiptFiltersId = useId()
  const all = view!.payments
  const query = search.trim().toLowerCase()
  const payments = useMemo(
    () =>
      all
        .filter(
          (item) =>
            (status === 'all' || item.status === status) &&
            (!month || item.period === month) &&
            `${item.customer.name} ${item.invoiceNumber}`.toLowerCase().includes(query) &&
            (!(range.from || range.to) || withinDateRange(dateKey(new Date(item.paidAt)), range)),
        )
        .sort(
          (a, b) =>
            new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime() || b.id.localeCompare(a.id),
        ),
    [all, status, month, query, range],
  )
  const pagination = usePagination(
    payments,
    JSON.stringify([view!.actor.id, status, month, query, range]),
  )
  const paid = payments
    .filter((item) => item.status === 'paid')
    .reduce((sum, item) => sum + item.amountCents, 0)
  const members = view!.members.filter(
    (item) => item.role === 'member' && `${item.name} ${item.email}`.toLowerCase().includes(query),
  )
  const paidMemberIds = useMemo(
    () =>
      new Set(
        all
          .filter((payment) => payment.period === month && payment.status === 'paid')
          .map((payment) => payment.memberId),
      ),
    [all, month],
  )
  const paidMembers = members.filter((member) => paidMemberIds.has(member.id)).length
  const filterSection = admin && tab === 'subscriptions' ? 'subscriptions' : 'receipts'
  const activeFilterCount =
    filterSection === 'subscriptions'
      ? Object.values(subscriptionFilters).filter((value) => value !== 'all').length
      : Number(status !== 'all') + Number(Boolean(range.from || range.to))
  const toolbar = (
    <ListToolbar>
      <SearchField
        aria-label="Buscar pagos"
        placeholder={admin ? 'Buscar socio o comprobante…' : 'Buscar comprobante…'}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <input
          aria-label="Periodo de la cuota"
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
        />
        {(filterSection === 'receipts' || month) && (
          <Button
            variant="secondary"
            aria-expanded={openFilters[filterSection]}
            aria-controls={
              filterSection === 'subscriptions' ? subscriptionFiltersId : receiptFiltersId
            }
            onPress={() =>
              setOpenFilters((current) => ({
                ...current,
                [filterSection]: !current[filterSection],
              }))
            }
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="bg-accent-soft text-green grid size-5 place-items-center rounded-full text-xs">
                {activeFilterCount}
                <span className="sr-only"> filtros activos</span>
              </span>
            )}
          </Button>
        )}
        {month && (
          <Button
            variant="link"
            className="text-green-mid text-xs font-semibold"
            onClick={() => {
              setMonth('')
              setTab('receipts')
            }}
          >
            Ver historial completo
          </Button>
        )}
      </div>
    </ListToolbar>
  )
  const history = (
    <>
      <div id={receiptFiltersId} hidden={!openFilters.receipts}>
        <div className="border-line bg-canvas/50 desktop:px-4 border-b px-3 py-3">
          <div className="desktop:flex-row flex w-full min-w-0 flex-col items-end gap-3 pb-1">
            <DateRangeFields label="Fecha de pago" value={range} onChange={setRange} />
            <label className="text-muted desktop:w-44 grid w-full gap-1 text-xs">
              Estado del pago
              <select
                aria-label="Estado del pago"
                className="min-h-11 w-full"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="all">Todos los estados</option>
                <option value="paid">Pagados</option>
                <option value="voided">Anulados</option>
              </select>
            </label>
            <Button
              variant="ghost"
              onClick={() => {
                setRange(emptyDateRange)
                setSearch('')
                setStatus('all')
                setMonth('')
              }}
            >
              Limpiar filtros de pagos
            </Button>
          </div>
        </div>
      </div>
      <section id={resultsId} aria-label="Resultados de pagos">
        {payments.length ? (
          <PaymentList payments={pagination.items} admin={admin} onSelect={setSelected} />
        ) : (
          <Empty icon={Receipt} title="No hay comprobantes con estos filtros">
            Cambia el periodo, la fecha de pago o el estado para consultar otros movimientos.
          </Empty>
        )}
      </section>
      <Pagination pagination={pagination} label="movimientos" controls={resultsId} />
    </>
  )
  return (
    <>
      <PageHeading title={admin ? 'Cuotas del club' : 'Mis pagos'} />
      {!subscriptionActive && (
        <Notice warning className="mb-3 flex-wrap">
          <span className="flex-1">
            <strong>Cuota pendiente · {periodLabel(currentPeriod)}</strong>
            <span className="block">Actívala para hacer nuevas reservas.</span>
          </span>
          <Button onPress={() => setPaying({ memberId: view!.actor.id, period: currentPeriod })}>
            Activar suscripción · pago simulado
          </Button>
        </Notice>
      )}
      <StatsGrid>
        <Stat
          label={admin ? 'Cuotas registradas' : 'Pagado (simulado)'}
          value={money(paid)}
          icon={Wallet}
        />
        <Stat
          label={admin ? 'Socios al día en el periodo' : 'Tu suscripción'}
          value={
            admin
              ? `${paidMembers} / ${members.length}`
              : subscriptionActive
                ? 'Activa'
                : 'Pendiente'
          }
          icon={UserCheck}
        />
        <Stat label="Comprobantes" value={payments.length} icon={Receipt} />
      </StatsGrid>
      <Panel>
        {admin ? (
          <Tabs
            className="gap-0"
            selectedKey={tab}
            onSelectionChange={(key) => setTab(String(key))}
          >
            <div className="desktop:px-4 flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3">
              <h2 className="text-sm font-semibold">Control de suscripciones</h2>
              <TabsList aria-label="Secciones de pagos">
                <TabsTrigger id="subscriptions">Cuotas</TabsTrigger>
                <TabsTrigger id="receipts">Comprobantes</TabsTrigger>
              </TabsList>
              <span className="ml-auto">
                <Badge tone="orange">Pagos de demostración</Badge>
              </span>
            </div>
            {toolbar}
            <TabsContent id="subscriptions">
              {month ? (
                <SubscriptionRegister
                  members={members}
                  payments={all}
                  month={month}
                  query={query}
                  plans={view!.settings.plans}
                  filters={subscriptionFilters}
                  onFiltersChange={setSubscriptionFilters}
                  filtersOpen={openFilters.subscriptions}
                  filtersId={subscriptionFiltersId}
                  onClearSearch={() => setSearch('')}
                  onPay={(memberId) => setPaying({ memberId, period: month })}
                  onVoid={setVoiding}
                />
              ) : (
                <p className="text-muted p-4 text-sm">
                  Selecciona un periodo para gestionar cuotas.
                </p>
              )}
            </TabsContent>
            <TabsContent id="receipts">{history}</TabsContent>
          </Tabs>
        ) : (
          <>
            <SectionHeading
              title="Tus cuotas mensuales"
              action={<Badge tone="orange">Pagos de demostración</Badge>}
            />
            {toolbar}
            {history}
          </>
        )}
      </Panel>
      {selected && <InvoiceDialog payment={selected} onClose={() => setSelected(null)} />}
      {paying && <SubscriptionDialog {...paying} onClose={() => setPaying(null)} />}
      {voiding && <VoidPaymentDialog payment={voiding} onClose={() => setVoiding(null)} />}
    </>
  )
}
