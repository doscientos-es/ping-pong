import { Banknote, ChartNoAxesCombined, Receipt, Wallet, Download, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useClubClock } from '../../app/club-clock'
import { useClub } from '../../app/club-context'
import { money } from '../../shared/format'
import {
  Button,
  InlineError,
  Modal,
  PageHeading,
  Panel,
  SectionHeading,
  Stat,
  StatsGrid,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useCommand,
} from '../../shared/ui'
import { requirePlan } from '../club/domain/plans'
import { hasSubscription, periodKey } from '../club/domain/rules'
import { AccountingSettings } from './accounting-settings'
import { financialRows, monthRange, summarize } from './domain/finance'
import type { LedgerEntry } from './domain/model'
import { downloadCsv, ledgerCsv, summaryCsv } from './infrastructure/financial-export'
import { LedgerEditor } from './ledger-editor'
import { RevenueChart } from './revenue-chart'

export function AccountingPage() {
  const { view, gateway, selectedId } = useClub()
  const now = useClubClock()
  const [month, setMonth] = useState(() => periodKey(now))
  const [filter, setFilter] = useState('all')
  const [tab, setTab] = useState('summary')
  const [editing, setEditing] = useState<LedgerEntry | 'new' | null>(null)
  const [voiding, setVoiding] = useState<LedgerEntry | null>(null)
  const command = useCommand()
  const data = view!.accounting!
  const rows = useMemo(() => financialRows(data, view!.payments), [data, view!.payments])
  const { from, to } = monthRange(month)
  const totals = summarize(rows, from, to, data.openingBalanceCents)
  const visible = rows.filter(
    (row) =>
      row.date >= from &&
      row.date <= to &&
      (filter === 'all' || row.kind === filter || row.status === filter || row.source === filter),
  )
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
        <label>
          Periodo
          <input
            type="month"
            value={month}
            min="1900-01"
            max="9999-12"
            onChange={(event) => {
              if (
                /^\d{4}-(0[1-9]|1[0-2])$/.test(event.target.value) &&
                event.target.value >= '1900-01'
              )
                setMonth(event.target.value)
            }}
          />
        </label>
        <Button
          variant="secondary"
          onClick={() => downloadCsv(ledgerCsv(rows, from, to), `movimientos-${month}.csv`)}
        >
          <Download size={16} />
          Exportar movimientos
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            downloadCsv(
              summaryCsv(rows, from, to, data.openingBalanceCents),
              `resumen-${month}.csv`,
            )
          }
        >
          Exportar resumen
        </Button>
      </div>
      <StatsGrid>
        <Stat label="Ingresos netos" value={money(totals.income)} icon={Banknote} />
        <Stat label="Gastos contables" value={money(totals.expenses)} icon={Receipt} />
        <Stat label="Resultado neto" value={money(totals.profit)} icon={ChartNoAxesCombined} />
        <Stat label="Saldo acumulado" value={money(totals.balance)} icon={Wallet} />
      </StatsGrid>
      <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(String(key))}>
        <TabsList aria-label="Secciones de contabilidad">
          <TabsTrigger id="summary">Resumen</TabsTrigger>
          <TabsTrigger id="movements">Movimientos</TabsTrigger>
          <TabsTrigger id="parameters">Parámetros</TabsTrigger>
        </TabsList>
        <TabsContent id="summary">
          <div className="mb-4 grid gap-4 lg:grid-cols-2">
            <Panel>
              <RevenueChart rows={rows} month={month} />
            </Panel>
            <Panel className="p-4">
              <h2 className="mb-3 text-sm">Cuotas recurrentes · mes actual</h2>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <dt>Cuotas disponibles</dt>
                <dd>{view!.settings.plans.length}</dd>
                <dt>Socios al corriente</dt>
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
              <p className="text-muted mt-3 text-xs">
                Previsión, no ingreso registrado. No hay cargos automáticos; registra cada cuota
                desde pagos.
              </p>
              <Link to="/pagos" className="mt-2 flex min-h-11 items-center text-sm underline">
                Gestionar cuotas
              </Link>
            </Panel>
          </div>
          <Panel className="mb-4 p-4">
            <h2 className="mb-3 text-sm">IVA estimado y tesorería</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <dt>IVA repercutido</dt>
              <dd>{money(totals.outputVat)}</dd>
              <dt>IVA deducible</dt>
              <dd>{money(totals.inputVat)}</dd>
              <dt>IVA neto estimado</dt>
              <dd>{money(totals.estimatedVat)}</dd>
              <dt>Cobros del periodo</dt>
              <dd>{money(totals.cashIncome)}</dd>
              <dt>Pagos del periodo</dt>
              <dd>{money(totals.cashExpenses)}</dd>
              <dt>Pendiente de cobro</dt>
              <dd>{money(totals.pendingIncome)}</dd>
              <dt>Pendiente de pago</dt>
              <dd>{money(totals.pendingExpenses)}</dd>
            </dl>
            <p className="text-muted mt-4 text-xs">
              DEMO · SIN VALIDEZ FISCAL. Resultado por fecha de documento, sin IVA recuperable; el
              IVA no deducible forma parte del gasto. Saldo inicial más cobros menos pagos hasta fin
              del periodo. Estado actual de los documentos, sin reconstrucción histórica de
              anulaciones. Verifica tipos y deducciones con tu asesoría.
            </p>
          </Panel>
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
                  <option value="pending">Pendientes</option>
                  <option value="subscription">Suscripciones</option>
                  <option value="voided">Anulados</option>
                </select>
              }
            />
            <div className="grid gap-2 p-3">
              {!visible.length && (
                <p className="text-muted p-4 text-sm">No hay movimientos en este periodo.</p>
              )}
              {visible.map((row) => (
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
