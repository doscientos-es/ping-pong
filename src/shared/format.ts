import { startTime } from '../features/club/domain/rules'

export const money = (cents: number) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(cents / 100)
export const hourLabel = (hour: number) => `${String(hour).padStart(2, '0')}:00`
export const dateLabel = (
  date: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' },
) => new Intl.DateTimeFormat('es-ES', options).format(new Date(`${date}T12:00:00`))
export const periodLabel = (period: string) =>
  dateLabel(`${period}-01`, { month: 'long', year: 'numeric' })
export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
export const compareReservations = (
  a: { date: string; hour: number },
  b: { date: string; hour: number },
) => startTime(a.date, a.hour) - startTime(b.date, b.hour)
export const messageOf = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'No se ha podido completar la acción. Inténtalo de nuevo.'
