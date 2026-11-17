import { useClub } from '../../app/club-context'
import { Button, InlineError, Panel, SectionHeading, useCommand } from '../../shared/ui'
import { parseMoney } from './domain/finance'
import type { AccountingData } from './domain/model'

export function AccountingSettings({ data }: { data: AccountingData }) {
  const { gateway, selectedId } = useClub()
  const command = useCommand()
  return (
    <Panel>
      <SectionHeading title="Parámetros contables" />
      <form
        key={`${data.openingBalanceCents}:${data.subscriptionVatBps}`}
        className="grid gap-3 p-4 sm:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          await command.run(async () => {
            await gateway.saveAccountingSettings(
              selectedId,
              parseMoney(String(form.get('balance')), true),
              parseMoney(String(form.get('vat'))),
            )
            return true
          }, 'Parámetros guardados.')
        }}
      >
        <label>
          Saldo inicial global (€)
          <input
            name="balance"
            inputMode="decimal"
            required
            defaultValue={(data.openingBalanceCents / 100).toFixed(2)}
          />
        </label>
        <label>
          IVA de nuevas cuotas (%)
          <input
            name="vat"
            inputMode="decimal"
            required
            defaultValue={data.subscriptionVatBps / 100}
          />
        </label>
        <p className="text-muted text-xs sm:col-span-2">
          Saldo anterior al primer movimiento. El IVA de cuotas se guarda al registrar cada pago;
          cambiarlo no modifica el historial. Los pagos antiguos se consideran sin IVA desglosado (0
          %).
        </p>
        <InlineError>{command.error}</InlineError>
        <Button type="submit" disabled={command.busy}>
          Guardar parámetros
        </Button>
      </form>
    </Panel>
  )
}
