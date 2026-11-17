import { summarize, vatCents } from '../domain/finance'
import type { FinancialRow } from '../domain/model'

/** Quote every cell, preserve UTF-8/Excel compatibility and prevent spreadsheet formulas. */
export function csvCell(value: string | number) {
  let text = String(value)
  // oxlint-disable-next-line no-control-regex -- Formula prefixes may follow invisible control characters.
  if (typeof value === 'string' && /^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}
const csv = (rows: (string | number)[][]) =>
  '\uFEFF' + rows.map((row) => row.map(csvCell).join(';')).join('\r\n')
const amount = (cents: number) => (cents / 100).toFixed(2).replace('.', ',')

export function ledgerCsv(rows: FinancialRow[], from: string, to: string) {
  return csv([
    ['DEMO · SIN VALIDEZ FISCAL', from, to],
    [
      'Fecha',
      'Fecha cobro/pago',
      'Origen',
      'Tipo',
      'Documento',
      'Concepto',
      'Categoría',
      'Tercero',
      'Referencia',
      'Estado',
      'Total EUR',
      'IVA %',
      'IVA EUR',
      'Deducible',
    ],
    ...rows
      .filter((row) => row.date >= from && row.date <= to)
      .map((row) => [
        row.date,
        row.paidDate ?? '',
        row.source,
        row.kind,
        row.documentType,
        row.description,
        row.category,
        row.counterparty,
        row.reference,
        row.status,
        amount(row.grossCents),
        row.vatBps / 100,
        amount(vatCents(row.grossCents, row.vatBps)),
        row.deductible ? 'Sí' : 'No',
      ]),
  ])
}

export function summaryCsv(rows: FinancialRow[], from: string, to: string, openingBalance: number) {
  const totals = summarize(rows, from, to, openingBalance)
  const labels: Record<keyof typeof totals, string> = {
    income: 'Ingresos netos',
    expenses: 'Gastos contables',
    profit: 'Resultado neto',
    outputVat: 'IVA repercutido estimado',
    inputVat: 'IVA deducible estimado',
    estimatedVat: 'IVA neto estimado',
    balance: 'Saldo acumulado hasta fin del periodo',
    cashIncome: 'Cobros del periodo',
    cashExpenses: 'Pagos del periodo',
    pendingIncome: 'Pendiente de cobro',
    pendingExpenses: 'Pendiente de pago',
    subscriptions: 'Cuotas cobradas (IVA incluido)',
  }
  return csv([
    ['DEMO · SIN VALIDEZ FISCAL', from, to],
    ['Concepto', 'EUR'],
    ['Saldo inicial global', amount(openingBalance)],
    ...Object.entries(totals).map(([key, value]) => [
      labels[key as keyof typeof totals],
      amount(value),
    ]),
    [
      'Criterio',
      'Devengo por fecha de documento; tesorería por fecha de cobro/pago. Estado actual; anulados excluidos. No es una declaración tributaria.',
    ],
  ])
}

export function downloadCsv(content: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename.replace(/[^a-zA-Z0-9.-]/g, '-')
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
