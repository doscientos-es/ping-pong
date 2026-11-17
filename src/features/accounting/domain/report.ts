import { vatCents } from './finance'
import type { FinancialRow } from './model'

export { reportRange, type ReportPeriod } from '../../../shared/report-period'

export function expenseCategories(rows: FinancialRow[], from: string, to: string) {
  const categories = new Map<string, number>()
  for (const row of rows) {
    if (row.kind !== 'expense' || row.status === 'voided' || row.date < from || row.date > to)
      continue
    const amount = row.grossCents - (row.deductible ? vatCents(row.grossCents, row.vatBps) : 0)
    categories.set(row.category, (categories.get(row.category) ?? 0) + amount)
  }
  return [...categories]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'es'))
}
