import { describe, expect, it } from 'vitest'

import { clubFixture } from '../../../test/club-fixture'
import { createClubService } from '../../club/application/club-service'
import { createLocalRepository, DATABASE_KEY } from '../../club/infrastructure/local-repository'
import { decodeState } from '../../club/infrastructure/schema'
import { financialRows, summarize } from '../domain/finance'
import type { LedgerInput } from '../domain/model'

const input: LedgerInput = {
  kind: 'expense',
  documentType: 'invoice',
  date: '2026-11-10',
  paidDate: '2026-11-10',
  description: 'Alquiler',
  category: 'Local',
  counterparty: 'Proveedor demo',
  reference: 'LOCAL-001',
  grossCents: 12100,
  vatBps: 2100,
  deductible: true,
  status: 'paid',
}

describe('casos de uso contables', () => {
  it('migra v2 sin perder datos y sin guardar cambios hasta la primera escritura', async () => {
    const { seed } = clubFixture()
    const { credentials: _credentials, accounting: _accounting, ...legacy } = seed
    const raw = JSON.stringify(legacy)
    localStorage.setItem(DATABASE_KEY, raw)
    const repository = createLocalRepository(localStorage)
    expect((await repository.read()).accounting.entries).toEqual([])
    expect((await repository.read()).credentials).toEqual([])
    expect(localStorage.getItem(DATABASE_KEY)).toBe(raw)
    await createClubService(repository).saveLedgerEntry('admin', input)
    expect((await repository.read()).payments).toEqual(seed.payments)
    expect(decodeState(localStorage.getItem(DATABASE_KEY)!).accounting.entries).toHaveLength(1)
  })
  it('impide accesos no administrativos en consultas y comandos', async () => {
    const { gateway } = clubFixture()
    await expect(gateway.saveLedgerEntry('alba', input)).rejects.toThrow()
    await expect(gateway.saveAccountingSettings('alba', 0, 0)).rejects.toThrow()
    await expect(gateway.voidLedgerEntry('alba', 'any', 'any')).rejects.toThrow()
    expect((await gateway.view('alba')).accounting).toBeUndefined()
  })
  it('conserva anulados, evita duplicados y rechaza ediciones obsoletas', async () => {
    const { gateway, repository } = clubFixture()
    const entry = await gateway.saveLedgerEntry('admin', input)
    await expect(gateway.saveLedgerEntry('admin', input)).rejects.toThrow('ya está registrada')
    const updated = await gateway.saveLedgerEntry(
      'admin',
      { ...input, grossCents: 24200 },
      entry.id,
      entry.revision,
    )
    await expect(gateway.saveLedgerEntry('admin', input, entry.id, entry.revision)).rejects.toThrow(
      'ha cambiado',
    )
    await expect(gateway.voidLedgerEntry('admin', entry.id, entry.revision)).rejects.toThrow(
      'ha cambiado',
    )
    await gateway.voidLedgerEntry('admin', updated.id, updated.revision)
    expect((await repository.read()).accounting.entries).toMatchObject([
      { id: entry.id, status: 'voided' },
    ])
  })
  it('incluye cada cuota una vez y congela su IVA aunque cambien los ajustes', async () => {
    const { gateway, repository, recordedSubscription } = clubFixture(new Date(2026, 10, 17, 12))
    await gateway.saveAccountingSettings('admin', 1000, 2100)
    const paid = await gateway.paySubscription('admin', recordedSubscription)
    await gateway.saveAccountingSettings('admin', 1000, 1000)
    const state = await repository.read()
    const rows = financialRows(state.accounting, state.payments)
    expect(rows.filter((item) => item.id === paid.id)).toHaveLength(1)
    expect(rows.find((item) => item.id === paid.id)?.vatBps).toBe(2100)
    await expect(
      gateway.saveLedgerEntry('admin', { ...input, reference: paid.invoiceNumber }),
    ).rejects.toThrow()
    const before = summarize(rows, '2026-11-01', '2026-11-30')
    await gateway.voidPayment('admin', paid.id)
    const after = await repository.read()
    expect(
      summarize(financialRows(after.accounting, after.payments), '2026-11-01', '2026-11-30')
        .balance,
    ).toBe(before.balance - paid.amountCents)
  })
})
