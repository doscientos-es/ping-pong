import { CreditCard, Receipt, Wallet, UserCheck } from 'lucide-react'
import { useId, useMemo, useState } from 'react'

import { useClubClock } from '../../app/club-clock'
import { useClub } from '../../app/club-context'
import { emptyDateRange, withinDateRange } from '../../shared/date-range'
import { money } from '../../shared/format'
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
import { SubscriptionRegister } from './subscription-register'
import { VoidPaymentDialog } from './void-payment-dialog'

export function PaymentsPage() {
  const { view } = useClub()
  const now = useClubClock()
  const admin = view!.actor.role === 'admin'
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [month, setMonth] = useState(periodKey(now))
  const [tab, setTab] = useState('subscriptions')
  const [selected, setSelected] = useState<Payment | null>(null)
  const [paying, setPaying] = useState<string | null>(null)
  const [voiding, setVoiding] = useState<Payment | null>(null)
  const [range, setRange] = useState(emptyDateRange)
  const resultsId = useId()
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
  const history = (
    <>
      <ListToolbar>
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
            variant="secondary"
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
      </ListToolbar>
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
      <StatsGrid>
        <Stat
          label={admin ? 'Cuotas registradas' : 'Pagado (simulado)'}
          value={money(paid)}
          icon={Wallet}
        />
        <Stat
          label={admin ? 'Socios al día en el periodo' : 'Tu suscripción'}
          value={admin ? `${paidMembers} / ${members.length}` : 'Activa'}
          icon={UserCheck}
        />
        <Stat label="Comprobantes" value={payments.length} icon={Receipt} />
      </StatsGrid>
      <Panel>
        <SectionHeading
          title={admin ? 'Control de suscripciones' : 'Tus cuotas mensuales'}
          action={<Badge tone="orange">Pagos de demostración</Badge>}
        />
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
            {month && (
              <Button
                variant="link"
                className="text-green-mid py-2 text-xs font-semibold hover:underline"
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
        {admin ? (
          <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(String(key))}>
            <TabsList aria-label="Secciones de pagos">
              <TabsTrigger id="subscriptions">Cuotas</TabsTrigger>
              <TabsTrigger id="receipts">Comprobantes</TabsTrigger>
            </TabsList>
            <TabsContent id="subscriptions">
              {month ? (
                <SubscriptionRegister
                  members={members}
                  payments={all}
                  month={month}
                  onPay={setPaying}
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
          history
        )}
      </Panel>
      <Notice className="mt-5">
        <CreditCard size={21} />
        <span>
          <strong>Pagos simulados.</strong> Las cuotas de esta demo son ficticias. Las reservas
          están incluidas en la suscripción y no generan cargos adicionales.
        </span>
      </Notice>
      {selected && <InvoiceDialog payment={selected} onClose={() => setSelected(null)} />}
      {paying && month && (
        <SubscriptionDialog memberId={paying} period={month} onClose={() => setPaying(null)} />
      )}
      {voiding && <VoidPaymentDialog payment={voiding} onClose={() => setVoiding(null)} />}
    </>
  )
}
