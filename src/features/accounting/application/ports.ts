import type { LedgerEntry, LedgerInput } from '../domain/model'

export interface AccountingGateway {
  saveLedgerEntry(
    actorId: string,
    input: LedgerInput,
    id?: string,
    revision?: string,
  ): Promise<LedgerEntry>
  voidLedgerEntry(actorId: string, id: string, revision: string): Promise<void>
  saveAccountingSettings(
    actorId: string,
    openingBalanceCents: number,
    subscriptionVatBps: number,
  ): Promise<void>
}
