import { Banknote, ChartNoAxesCombined, Receipt, Wallet, Download, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useClubClock } from '../../app/club-clock'
import { useClub } from '../../app/club-context'
import { dateLabel, money } from '../../shared/format'
import {
  Button,
  ButtonLink,
  InlineError,
  Modal,
  PageHeading,
  Pagination,
  Panel,
  PeriodFields,
  SearchField,
  SectionHeading,
  Stat,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useCommand,
} from '../../shared/ui'
import { RankingChart } from '../../shared/ui/ranking-chart'
import { usePagination } from '../../shared/use-pagination'
import { requirePlan } from '../club/domain/plans'
import { hasSubscription, periodKey } from '../club/domain/rules'
import { AccountingSettings } from './accounting-settings'
import { financialRows, summarize } from './domain/finance'
import type { LedgerEntry } from './domain/model'
import { expenseCategories, reportRange, type ReportPeriod } from './domain/report'
import { downloadCsv, ledgerCsv, summaryCsv } from './infrastructure/financial-export'
import { LedgerEditor } from './ledger-editor'
import { RevenueChart } from './revenue-chart'

export function AccountingPage() {
  const { view, gateway, selectedId } = useClub()
  const now = useClubClock()
  const [month, setMonth] = useState(() => periodKey(now))
  const [period, setPeriod] = useState<ReportPeriod>('quarter')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('summary')
  const [editing, setEditing] = useState<LedgerEntry | 'new' | null>(null)
  const [voiding, setVoiding] = useState<LedgerEntry | null>(null)
  const command = useCommand()
  const data = view!.accounting!
  const rows = useMemo(() => financialRows(data, view!.payments), [data, view!.payments])
  const { from, to } = reportRange(month, period)
  const totals = summarize(rows, from, to, data.openingBalanceCents)
  const visible = rows.filter(
    (row) =>
      row.date >= from &&
      row.date <= to &&
      (filter === 'all' || row.kind === filter || row.status === filter || row.source === filter) &&
      `${row.description} ${row.category} ${row.counterparty} ${row.reference}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  )
  const pagination = usePagination(visible, JSON.stringify([from, to, filter, search]))
  const expensesByCategory = expenseCategories(rows, from, to)
  const chartCategories =
    expensesByCategory.length > 6
      ? [
          ...expensesByCategory.slice(0, 5),
          {
            label: 'Otras categorías',
            value: expensesByCategory.slice(5).reduce((sum, item) => sum + item.value, 0),
          },
        ]
      : expensesByCategory
  const members = view!.members.filter((member) => member.role === 'member' && member.active)
  const current = members.filter((member) => hasSubscription(view!, member.id, now)).length
  return (
    <>
      <PageHeading
        title="Contabilidad"
        action={
          <Button
            onClick={() => {
              setTab('movements')
              setEditing('new')
            }}
          >
            <Plus size={17} />
            Nuevo movimiento
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-muted grid gap-1 text-xs">
          Vista
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as ReportPeriod)}
          >
            <option value="month">Mes</option>
            <option value="quarter">Trimestre</option>
            <option value="year">Año</option>
          </select>
        </label>
        <PeriodFields
          label="Periodo contable"
          period={period}
          value={month}
          currentYear={now.getFullYear()}
          onChange={setMonth}
        />
        <p className="text-muted pb-2 text-xs">
          {dateLabel(from, { day: 'numeric', month: 'short', year: 'numeric' })} —{' '}
          {dateLabel(to, { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
        <Button
          variant="secondary"
          onClick={() => downloadCsv(ledgerCsv(rows, from, to), `movimientos-${from}-${to}.csv`)}
        >
          <Download size={16} />
          Exportar movimientos
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            downloadCsv(
              summaryCsv(rows, from, to, data.openingBalanceCents),
              `resumen-${from}-${to}.csv`,
            )
          }
        >
          Exportar resumen
        </Button>
      </div>
      <div
        role="group"
        aria-label="Totales del periodo"
        className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4"
      >
        <Stat label="Ingresos netos" value={money(totals.income)} icon={Banknote} />
        <Stat label="Gastos contables" value={money(totals.expenses)} icon={Receipt} />
        <Stat label="Resultado neto" value={money(totals.profit)} icon={ChartNoAxesCombined} />
        <Stat label="Saldo acumulado" value={money(totals.balance)} icon={Wallet} />
      </div>
      <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(String(key))}>
        <TabsList aria-label="Secciones de contabilidad">
          <TabsTrigger id="summary">Resumen</TabsTrigger>
          <TabsTrigger id="movements">Movimientos</TabsTrigger>
          <TabsTrigger id="parameters">Parámetros</TabsTrigger>
        </TabsList>
        <TabsContent id="summary">
          <h2 className="mb-3 text-base font-semibold">Resumen financiero del club</h2>
          <div className="mb-4 grid gap-4 lg:grid-cols-2">
            <Panel>
              <RevenueChart rows={rows} from={from} to={to} />
            </Panel>
            <RankingChart
              title="Gastos por categoría"
              items={chartCategories}
              format={money}
              empty="No hay gastos en este periodo."
            />
          </div>
          <div className="mb-4 grid gap-4 lg:grid-cols-2">
            <Panel className="p-4">
              <h2 className="mb-3 text-sm">Cuotas</h2>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <dt>Cuotas disponibles</dt>
                <dd>{view!.settings.plans.length}</dd>
                <dt>Socios al corriente este mes</dt>
                <dd>
                  {current} / {members.length}
                </dd>
                <dt>Previsión mensual bruta</dt>
                <dd>
                  {money(
                    members.reduce(
                      (total, member) =>
                        total + requirePlan(view!.settings, member.planId).priceCents,
                      0,
                    ),
                  )}
                </dd>
                <dt>Cuotas cobradas del periodo</dt>
                <dd>{money(totals.subscriptions)}</dd>
              </dl>
              <Link to="/pagos" className="mt-2 flex min-h-11 items-center text-sm underline">
                Gestionar cuotas
              </Link>
            </Panel>
            <Panel className="p-4">
              <h2 className="mb-3 text-sm">IVA estimado y tesorería</h2>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'IVA repercutido', value: totals.outputVat },
                  { label: 'IVA deducible', value: totals.inputVat },
                  { label: 'IVA neto estimado', value: totals.estimatedVat },
                  { label: 'Cobros del periodo', value: totals.cashIncome },
                  { label: 'Pagos del periodo', value: totals.cashExpenses },
                  { label: 'Pendiente de cobro', value: totals.pendingIncome },
                  { label: 'Pendiente de pago', value: totals.pendingExpenses },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-muted text-xs">{label}</dt>
                    <dd className="mt-1 font-semibold tabular-nums">{money(value)}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-muted mt-4 text-xs">Demo · Sin validez fiscal</p>
            </Panel>
          </div>
          <ButtonLink to="/actividad" variant="secondary">
            Ver actividad de reservas
          </ButtonLink>
        </TabsContent>
        <TabsContent id="movements">
          <Panel>
            <SectionHeading
              title="Movimientos"
              action={
                <select
                  aria-label="Filtrar movimientos"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="income">Ingresos</option>
                  <option value="expense">Gastos</option>
                  <option value="paid">Cobrados / pagados</option>
                  <option value="pending">Pendientes</option>
                  <option value="subscription">Suscripciones</option>
                  <option value="manual">Manuales</option>
                  <option value="voided">Anulados</option>
                </select>
              }
            />
            <div className="border-line border-b px-3 pb-3">
              <SearchField
                aria-label="Buscar movimientos"
                placeholder="Buscar concepto, categoría o tercero…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div id="accounting-movements" className="grid gap-2 p-3">
              {!visible.length && (
                <p className="text-muted p-4 text-sm">No hay movimientos en este periodo.</p>
              )}
              {pagination.items.map((row) => (
                <article
                  key={`${row.source}:${row.id}`}
                  aria-label={row.description}
                  className="border-line flex flex-wrap items-center gap-3 border-t py-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <strong className="break-words">{row.description}</strong>
                    <p className="text-muted text-xs">
                      {row.date} · {row.category} · {row.counterparty}
                    </p>
                    <p className="text-muted text-xs">
                      {row.source === 'subscription'
                        ? 'Cuota automática en contabilidad'
                        : row.reference || 'Sin referencia'}{' '}
                      ·{' '}
                      {row.status === 'voided'
                        ? 'Anulado'
                        : row.status === 'pending'
                          ? 'Pendiente'
                          : 'Cobrado / pagado'}
                    </p>
                  </div>
                  <strong>
                    {row.kind === 'expense' ? '−' : '+'}
                    {money(row.grossCents)}
                  </strong>
                  {row.source === 'manual' && row.status !== 'voided' && (
                    <>
                      <Button
                        variant="secondary"
                        aria-label={`Editar ${row.description}`}
                        onClick={() => setEditing(data.entries.find((item) => item.id === row.id)!)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        aria-label={`Anular ${row.description}`}
                        onClick={() => setVoiding(data.entries.find((item) => item.id === row.id)!)}
                      >
                        Anular
                      </Button>
                    </>
                  )}
                </article>
              ))}
            </div>
            <Pagination
              pagination={pagination}
              label="movimientos"
              controls="accounting-movements"
            />
            <p className="text-muted px-4 pb-3 text-xs">
              El CSV no aplica los filtros de la lista.
            </p>
          </Panel>
        </TabsContent>
        <TabsContent id="parameters">
          <AccountingSettings data={data} />
        </TabsContent>
      </Tabs>
      {editing && (
        <LedgerEditor
          entry={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <Modal open={!!voiding} onClose={() => setVoiding(null)} title="Anular movimiento">
        <p className="mb-4 text-sm">
          {voiding?.description}. Se conservará el registro y dejará de contar en los totales.
        </p>
        <InlineError>{command.error}</InlineError>
        <Button
          disabled={command.busy}
          onClick={async () => {
            if (!voiding) return
            const done = await command.run(async () => {
              await gateway.voidLedgerEntry(selectedId, voiding.id, voiding.revision)
              return true
            }, 'Movimiento anulado.')
            if (done) setVoiding(null)
          }}
        >
          Confirmar anulación
        </Button>
      </Modal>
    </>
  )
}
