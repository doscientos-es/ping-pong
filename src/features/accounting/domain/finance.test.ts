import { describe, expect, it } from 'vitest'
import { monthRange, parseMoney, summarize, validateLedger, vatCents } from './finance'
import type { FinancialRow, LedgerInput } from './model'

export const ledgerInput: LedgerInput = {
  kind: 'expense',
  documentType: 'invoice',
  date: '2026-11-10',
  paidDate: '2026-11-12',
  description: 'Material',
  category: 'Equipamiento',
  counterparty: 'Proveedor ficticio',
  reference: 'LOCAL-001',
  grossCents: 12100,
  vatBps: 2100,
  deductible: true,
  status: 'paid',
}
const row = (input: Partial<FinancialRow>): FinancialRow => ({
  ...ledgerInput,
  source: 'manual',
  id: crypto.randomUUID(),
  ...input,
})

describe('contabilidad local en céntimos', () => {
  it('separa devengo, IVA deducible, tesorería y saldo global; excluye anulados', () => {
    const rows = [
      row({ kind: 'income', grossCents: 24200 }),
      row({}),
      row({ kind: 'income', status: 'pending', grossCents: 12100, paidDate: undefined }),
      row({ status: 'pending', grossCents: 1210, deductible: false, paidDate: undefined }),
      row({
        kind: 'income',
        date: '2026-10-31',
        paidDate: '2026-10-31',
        grossCents: 5000,
        vatBps: 0,
      }),
      row({ status: 'voided', grossCents: 900000 }),
      row({ date: '2026-11-30', paidDate: '2026-12-01', grossCents: 1210 }),
    ]
    expect(summarize(rows, '2026-11-01', '2026-11-30', 1000)).toEqual({
      income: 30000,
      expenses: 12210,
      profit: 17790,
      outputVat: 6300,
      inputVat: 2310,
      estimatedVat: 3990,
      balance: 18100,
      cashIncome: 24200,
      cashExpenses: 12100,
      pendingIncome: 12100,
      pendingExpenses: 1210,
      subscriptions: 0,
    })
  })
  it('calcula IVA incluido y evita errores de decimales', () => {
    expect(vatCents(12100, 2100)).toBe(2100)
    expect(vatCents(3900, 0)).toBe(0)
    expect(parseMoney('45,50')).toBe(4550)
    expect(parseMoney('-0.29', true)).toBe(-29)
    expect(() => parseMoney('1.001')).toThrow()
    expect(() => parseMoney('-1')).toThrow()
    expect(() => parseMoney('1e5')).toThrow()
  })
  it('rechaza fechas imposibles, importes negativos, IVA inválido y pagos sin fecha', () => {
    for (const patch of [
      { date: '2026-02-30' },
      { grossCents: -1 },
      { vatBps: 10001 },
      { paidDate: undefined },
    ])
      expect(() => validateLedger({ ...ledgerInput, ...patch })).toThrow()
    expect(validateLedger({ ...ledgerInput, status: 'pending' }).paidDate).toBeUndefined()
    expect(monthRange('2028-02')).toEqual({ from: '2028-02-01', to: '2028-02-29' })
  })
})
