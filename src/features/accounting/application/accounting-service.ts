import type { ClubRepository } from '../../club/application/ports'
import { requireActor } from '../../club/domain/rules'
import { validateLedger } from '../domain/finance'
import type { LedgerInput } from '../domain/model'
import type { AccountingGateway } from './ports'

export function createAccountingService(
  repository: ClubRepository,
  clock: () => Date,
): AccountingGateway {
  return {
    saveLedgerEntry(actorId: string, input: LedgerInput, id?: string, revision?: string) {
      return repository.transact((state) => {
        requireActor(state, actorId, true)
        const values = validateLedger(input)
        const existing = state.accounting.entries.find((entry) => entry.id === id)
        if (id && (!existing || existing.status === 'voided' || existing.revision !== revision))
          throw new Error('El movimiento ha cambiado. Cierra y vuelve a abrirlo.')
        if (
          values.reference &&
          (state.payments.some(
            (payment) => payment.invoiceNumber.toLowerCase() === values.reference.toLowerCase(),
          ) ||
            state.accounting.entries.some(
              (entry) =>
                entry.id !== id &&
                entry.status !== 'voided' &&
                entry.kind === values.kind &&
                entry.counterparty.toLowerCase() === values.counterparty.toLowerCase() &&
                entry.reference.toLowerCase() === values.reference.toLowerCase(),
            ))
        )
          throw new Error('Esta referencia ya está registrada. No dupliques cuotas ni facturas.')
        const entry = {
          ...values,
          id: id ?? crypto.randomUUID(),
          createdAt: existing?.createdAt ?? clock().toISOString(),
          revision: crypto.randomUUID(),
        }
        if (existing) Object.assign(existing, entry)
        else state.accounting.entries.push(entry)
        return entry
      })
    },
    voidLedgerEntry(actorId: string, id: string, revision: string) {
      return repository.transact((state) => {
        requireActor(state, actorId, true)
        const entry = state.accounting.entries.find((item) => item.id === id)
        if (!entry || entry.status === 'voided' || entry.revision !== revision)
          throw new Error('El movimiento ha cambiado. Actualiza la vista.')
        entry.status = 'voided'
        entry.revision = crypto.randomUUID()
      })
    },
    saveAccountingSettings(
      actorId: string,
      openingBalanceCents: number,
      subscriptionVatBps: number,
    ) {
      return repository.transact((state) => {
        requireActor(state, actorId, true)
        if (
          !Number.isSafeInteger(openingBalanceCents) ||
          Math.abs(openingBalanceCents) > 9999999999 ||
          !Number.isInteger(subscriptionVatBps) ||
          subscriptionVatBps < 0 ||
          subscriptionVatBps > 10000
        )
          throw new Error('Saldo inicial o porcentaje de IVA no válido.')
        state.accounting.openingBalanceCents = openingBalanceCents
        state.accounting.subscriptionVatBps = subscriptionVatBps
      })
    },
  }
}
