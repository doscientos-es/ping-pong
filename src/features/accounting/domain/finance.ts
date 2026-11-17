import type { Payment } from '../../club/domain/model'
import { dateKey, isDate } from '../../club/domain/rules'
import type { AccountingData, FinancialRow, LedgerInput } from './model'

export function parseMoney(text: string, signed = false): number {
  const value = text.trim().replace(',', '.')
  if (!(signed ? /^-?\d{1,8}(\.\d{1,2})?$/ : /^\d{1,8}(\.\d{1,2})?$/).test(value))
    throw new Error('Introduce un importe válido con un máximo de dos decimales.')
  const negative = value.startsWith('-')
  const [whole, fraction = ''] = value.replace('-', '').split('.')
  return (Number(whole) * 100 + Number(fraction.padEnd(2, '0'))) * (negative ? -1 : 1)
}

export function validateLedger(input: LedgerInput): LedgerInput {
  if (
    !['income', 'expense'].includes(input.kind) ||
    !['invoice', 'receipt', 'other'].includes(input.documentType)
  )
    throw new Error('Tipo de movimiento no válido.')
  if (
    !isDate(input.date) ||
    !['paid', 'pending'].includes(input.status) ||
    (input.status === 'paid' && (!input.paidDate || !isDate(input.paidDate)))
  )
    throw new Error('Revisa las fechas y el estado del movimiento.')
  if (
    !Number.isSafeInteger(input.grossCents) ||
    input.grossCents <= 0 ||
    input.grossCents > 9999999999
  )
    throw new Error('El importe debe ser positivo y no superar 99.999.999,99 €.')
  if (!Number.isInteger(input.vatBps) || input.vatBps < 0 || input.vatBps > 10000)
    throw new Error('El IVA debe estar entre 0 y 100 %.')
  const values = {
    ...input,
    deductible: input.kind === 'expense' && input.deductible,
    paidDate: input.status === 'paid' ? input.paidDate : undefined,
    description: input.description.trim(),
    category: input.category.trim(),
    counterparty: input.counterparty.trim(),
    reference: input.reference.trim(),
  }
  if (
    !values.description ||
    values.description.length > 200 ||
    !values.category ||
    values.category.length > 80 ||
    values.counterparty.length > 150 ||
    values.reference.length > 100
  )
    throw new Error('Revisa el concepto, categoría y referencia del movimiento.')
  return values
}

export function financialRows(data: AccountingData, payments: Payment[]): FinancialRow[] {
  return [
    ...payments.map((payment): FinancialRow => ({
      id: payment.id,
      kind: 'income',
      source: 'subscription',
      documentType: 'receipt',
      date: dateKey(new Date(payment.paidAt)),
      paidDate: dateKey(new Date(payment.paidAt)),
      description: `Cuota ${payment.period}`,
      category: 'Suscripciones',
      counterparty: payment.customer.name,
      reference: payment.invoiceNumber,
      grossCents: payment.amountCents,
      vatBps: payment.vatBps ?? 0,
      deductible: false,
      status: payment.status === 'paid' ? 'paid' : 'voided',
    })),
    ...data.entries.map((entry): FinancialRow => ({ ...entry, source: 'manual' })),
  ].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
}

export const vatCents = (gross: number, bps: number) => Math.round((gross * bps) / (10000 + bps))

export function summarize(rows: FinancialRow[], from: string, to: string, openingBalanceCents = 0) {
  let income = 0,
    expenses = 0,
    outputVat = 0,
    inputVat = 0,
    cashIncome = 0,
    cashExpenses = 0
  let pendingIncome = 0,
    pendingExpenses = 0,
    balance = openingBalanceCents,
    subscriptions = 0
  for (const row of rows) {
    if (row.status === 'voided') continue
    const incoming = row.kind === 'income'
    if (row.status === 'paid' && row.paidDate && row.paidDate <= to) {
      balance += row.grossCents * (incoming ? 1 : -1)
      if (row.paidDate >= from) {
        if (incoming) cashIncome += row.grossCents
        else cashExpenses += row.grossCents
      }
    }
    if (row.date < from || row.date > to) continue
    const vat = vatCents(row.grossCents, row.vatBps)
    if (incoming) {
      income += row.grossCents - vat
      outputVat += vat
      if (row.source === 'subscription') subscriptions += row.grossCents
      if (row.status === 'pending') pendingIncome += row.grossCents
    } else {
      const deductibleVat = row.deductible ? vat : 0
      expenses += row.grossCents - deductibleVat
      inputVat += deductibleVat
      if (row.status === 'pending') pendingExpenses += row.grossCents
    }
  }
  return {
    income,
    expenses,
    profit: income - expenses,
    outputVat,
    inputVat,
    estimatedVat: outputVat - inputVat,
    balance,
    cashIncome,
    cashExpenses,
    pendingIncome,
    pendingExpenses,
    subscriptions,
  }
}

export function monthRange(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Selecciona un mes válido.')
  const [year, index] = month.split('-').map(Number)
  return { from: `${month}-01`, to: dateKey(new Date(year, index, 0, 12)) }
}
