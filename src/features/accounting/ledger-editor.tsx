import { useClub } from '../../app/club-context'
import { useClubClock } from '../../app/club-clock'
import { Button, InlineError, Modal, useCommand } from '../../shared/ui'
import { dateKey } from '../club/domain/rules'
import { parseMoney } from './domain/finance'
import type { LedgerEntry } from './domain/model'

export function LedgerEditor({ entry, onClose }: { entry?: LedgerEntry; onClose: () => void }) {
  const { gateway, selectedId } = useClub()
  const now = useClubClock()
  const command = useCommand()
  return (
    <Modal open onClose={onClose} title={entry ? 'Editar movimiento' : 'Nuevo movimiento'}>
      <form
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          const text = (name: string) => String(data.get(name) ?? '')
          const done = await command.run(async () => {
            await gateway.saveLedgerEntry(
              selectedId,
              {
                kind: text('kind') === 'income' ? 'income' : 'expense',
                documentType: text('document') as 'invoice' | 'receipt' | 'other',
                date: text('date'),
                description: text('description'),
                category: text('category'),
                counterparty: text('counterparty'),
                reference: text('reference'),
                grossCents: parseMoney(text('amount')),
                vatBps: parseMoney(text('vat')),
                deductible: data.get('deductible') === 'on',
                status: text('status') === 'paid' ? 'paid' : 'pending',
                paidDate: text('paidDate') || undefined,
              },
              entry?.id,
              entry?.revision,
            )
            return true
          }, 'Movimiento guardado.')
          if (done) onClose()
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <label>
            Tipo
            <select name="kind" defaultValue={entry?.kind ?? 'expense'}>
              <option value="expense">Gasto</option>
              <option value="income">Ingreso externo</option>
            </select>
          </label>
          <label>
            Documento
            <select name="document" defaultValue={entry?.documentType ?? 'invoice'}>
              <option value="invoice">Factura</option>
              <option value="receipt">Recibo</option>
              <option value="other">Otro</option>
            </select>
          </label>
        </div>
        <label>
          Concepto
          <input name="description" defaultValue={entry?.description} maxLength={200} required />
        </label>
        <label>
          Categoría
          <input name="category" defaultValue={entry?.category} maxLength={80} required />
        </label>
        <label>
          Cliente / proveedor
          <input name="counterparty" defaultValue={entry?.counterparty} maxLength={150} />
        </label>
        <label>
          Referencia de factura
          <input name="reference" defaultValue={entry?.reference} maxLength={100} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            Fecha de documento
            <input type="date" name="date" defaultValue={entry?.date ?? dateKey(now)} required />
          </label>
          <label>
            Total con IVA (€)
            <input
              inputMode="decimal"
              name="amount"
              defaultValue={entry ? (entry.grossCents / 100).toFixed(2) : ''}
              required
            />
          </label>
          <label>
            IVA (%)
            <input
              inputMode="decimal"
              name="vat"
              defaultValue={(entry?.vatBps ?? 0) / 100}
              required
            />
          </label>
          <label>
            Estado
            <select name="status" defaultValue={entry?.status ?? 'paid'}>
              <option value="paid">Cobrado / pagado</option>
              <option value="pending">Pendiente</option>
            </select>
          </label>
        </div>
        <label>
          Fecha de cobro / pago
          <input type="date" name="paidDate" defaultValue={entry?.paidDate ?? dateKey(now)} />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="deductible" defaultChecked={entry?.deductible ?? false} />
          IVA deducible (solo gastos)
        </label>
        <InlineError>{command.error}</InlineError>
        <Button type="submit" disabled={command.busy}>
          Guardar movimiento
        </Button>
      </form>
    </Modal>
  )
}
