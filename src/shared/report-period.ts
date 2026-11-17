import { dateKey } from '../features/club/domain/rules'

export type ReportPeriod = 'month' | 'quarter' | 'year'

export function monthRange(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Selecciona un mes válido.')
  const [year, index] = month.split('-').map(Number)
  return { from: `${month}-01`, to: dateKey(new Date(year, index, 0, 12)) }
}

export function reportRange(month: string, period: ReportPeriod) {
  const [year, selectedMonth] = month.split('-').map(Number)
  const first =
    period === 'year'
      ? 1
      : period === 'quarter'
        ? Math.floor((selectedMonth - 1) / 3) * 3 + 1
        : selectedMonth
  const last = period === 'year' ? 12 : period === 'quarter' ? first + 2 : first
  const key = (value: number) => `${year}-${String(value).padStart(2, '0')}`
  return { from: monthRange(key(first)).from, to: monthRange(key(last)).to }
}
