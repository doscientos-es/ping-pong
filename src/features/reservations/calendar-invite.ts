import { CLUB_NAME } from '../../shared/brand'
import type { Reservation } from '../club/domain/model'
import { startTime } from '../club/domain/rules'

export interface CalendarEvent {
  reservationId: string
  court: number
  startsAt: Date
  endsAt: Date
  createdAt: Date
}

const utc = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
const escapeText = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')

// RFC 5545 limits each physical line to 75 octets, including continuation spaces.
function fold(line: string) {
  const encoder = new TextEncoder()
  const lines: string[] = []
  let part = ''
  let bytes = 0
  for (const character of line) {
    const size = encoder.encode(character).length
    if (bytes + size > 75) {
      lines.push(part)
      part = ' '
      bytes = 1
    }
    part += character
    bytes += size
  }
  lines.push(part)
  return lines.join('\r\n')
}

export function calendarEventFor(reservation: Reservation): CalendarEvent {
  const startsAt = new Date(startTime(reservation.date, reservation.hour))
  return {
    reservationId: reservation.id,
    court: reservation.court,
    startsAt,
    endsAt: new Date(startsAt.getTime() + 60 * 60 * 1000),
    createdAt: new Date(reservation.createdAt),
  }
}

export function createCalendarInvite(
  event: CalendarEvent,
  invite?: { organizer: string; attendee: string },
) {
  const method = invite ? 'REQUEST' : 'PUBLISH'
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Doscientos Club//Reservas//ES',
    'CALSCALE:GREGORIAN',
    `METHOD:${method}`,
    'BEGIN:VEVENT',
    `UID:${encodeURIComponent(event.reservationId)}@doscientos.club`,
    `DTSTAMP:${utc(event.createdAt)}`,
    `DTSTART:${utc(event.startsAt)}`,
    `DTEND:${utc(event.endsAt)}`,
    `SUMMARY:${escapeText(`${CLUB_NAME} · Pista ${event.court}`)}`,
    `DESCRIPTION:${escapeText('Reserva de pista incluida en la cuota del club.')}`,
    'STATUS:CONFIRMED',
    ...(invite
      ? [`ORGANIZER:mailto:${invite.organizer}`, `ATTENDEE;RSVP=TRUE:mailto:${invite.attendee}`]
      : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return `${lines.map(fold).join('\r\n')}\r\n`
}
