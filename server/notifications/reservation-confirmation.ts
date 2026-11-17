import { Buffer } from 'node:buffer'

import {
  createCalendarInvite,
  type CalendarEvent,
} from '../../src/features/reservations/calendar-invite'

export interface ReservationConfirmation {
  event: CalendarEvent
  recipient: { name: string; email: string }
  timeZone: string
}

export interface ResendSettings {
  apiKey?: string
  fromEmail?: string
}

const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

/** Server-only adapter. The caller must load and authorize the reservation from trusted storage. */
export async function sendReservationConfirmation(
  confirmation: ReservationConfirmation,
  settings: ResendSettings,
): Promise<{ status: 'disabled' } | { status: 'accepted'; id: string }> {
  if (typeof window !== 'undefined') throw new Error('El envío solo está disponible en servidor.')
  const { apiKey, fromEmail } = settings
  if (!apiKey || !fromEmail) return { status: 'disabled' }
  const { event, recipient, timeZone } = confirmation
  if (!emailPattern.test(fromEmail) || !emailPattern.test(recipient.email))
    throw new Error('Dirección de correo no válida.')
  if (
    !/^[A-Za-z0-9_-]{1,100}$/.test(event.reservationId) ||
    !Number.isInteger(event.court) ||
    event.court < 1
  )
    throw new Error('Reserva no válida.')
  if (
    ![event.startsAt, event.endsAt, event.createdAt].every((date) =>
      Number.isFinite(date.getTime()),
    ) ||
    event.endsAt <= event.startsAt
  )
    throw new Error('Fecha de reserva no válida.')
  const date = new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone,
  }).format(event.startsAt)
  const end = new Intl.DateTimeFormat('es-ES', { timeStyle: 'short', timeZone }).format(
    event.endsAt,
  )
  const calendar = createCalendarInvite(event, { organizer: fromEmail, attendee: recipient.email })
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `reservation-confirmed/${event.reservationId}`,
    },
    body: JSON.stringify({
      from: `Doscientos Club <${fromEmail}>`,
      to: [recipient.email],
      subject: 'Reserva confirmada · Doscientos Club',
      text: `Hola ${recipient.name},\n\nTu reserva está confirmada.\nPista ${event.court}\n${date} – ${end}\n\nAdjuntamos una invitación para tu calendario.\n\nDoscientos Club`,
      attachments: [
        {
          filename: 'reserva.ics',
          content: Buffer.from(calendar, 'utf8').toString('base64'),
          content_type: 'text/calendar; charset=utf-8; method=REQUEST',
        },
      ],
    }),
  })
  if (!response.ok) throw new Error(`No se pudo enviar la confirmación (HTTP ${response.status}).`)
  const result: unknown = await response.json()
  if (!result || typeof result !== 'object' || !('id' in result) || typeof result.id !== 'string')
    throw new Error('Respuesta de Resend no válida.')
  return { status: 'accepted', id: result.id }
}
