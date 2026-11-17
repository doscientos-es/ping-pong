export interface DateRange {
  from: string
  to: string
}

export const emptyDateRange: DateRange = { from: '', to: '' }

export function invalidDateRange({ from, to }: DateRange) {
  return Boolean(from && to && from > to)
}

/** Inclusive comparison of local calendar dates (YYYY-MM-DD), not UTC timestamps. */
export function withinDateRange(date: string, { from, to }: DateRange) {
  return (!from || date >= from) && (!to || date <= to)
}
