import { useEffect, useMemo, useState } from 'react'

import { useClubClock } from '../../app/club-clock'
import { useClub } from '../../app/club-context'
import { useCommand } from '../../shared/use-command'
import { createAvailability } from '../club/domain/availability'
import type { BookingInput, Reservation } from '../club/domain/model'
import { dateKey, hasSubscription, hoursFor } from '../club/domain/rules'

export interface BookingFlowProps {
  initialSlot?: BookingInput
  initialDate?: string
  reservation?: Reservation
  onClose?: () => void
  onPendingChange?: (pending: boolean) => void
}

export function useBookingFlow({
  initialSlot,
  initialDate,
  reservation,
  onPendingChange,
}: BookingFlowProps) {
  const { view, gateway, selectedId } = useClub()
  const now = useClubClock()
  const admin = view!.actor.role === 'admin'
  const initial = reservation ?? initialSlot
  const [date, setDate] = useState(
    initial?.date ?? (initialDate && initialDate >= dateKey(now) ? initialDate : dateKey(now)),
  )
  const [hour, setHour] = useState<number | null>(initial?.hour ?? null)
  const [court, setCourt] = useState<number | null>(initial?.court ?? null)
  const [memberId, setMemberId] = useState(reservation?.memberId ?? '')
  const [step, setStep] = useState(initial ? 3 : 0)
  const [confirmed, setConfirmed] = useState<Reservation | null>(null)
  const command = useCommand()
  const settings = view!.settings
  const reservations = view!.reservations
  const members = view!.members
  const courtsFor = useMemo(
    () => createAvailability({ settings, reservations }, now, reservation?.id),
    [settings, reservations, now, reservation?.id],
  )
  const hours = useMemo(
    () =>
      hoursFor(settings, date).map((hour) => ({
        hour,
        free: courtsFor(date, hour).length,
      })),
    [settings, date, courtsFor],
  )
  const freeCourts = hour === null ? [] : courtsFor(date, hour)
  const hasHours = hours.some((option) => option.free > 0)
  const validSlot = court !== null && freeCourts.includes(court)
  const payments = view!.payments
  const eligible = useMemo(
    () =>
      members.filter(
        (member) =>
          member.role === 'member' &&
          member.active &&
          hasSubscription({ payments }, member.id, now),
      ),
    [members, payments, now],
  )
  const validMember = !admin || eligible.some((member) => member.id === memberId)
  const player = admin ? view!.members.find((member) => member.id === memberId) : view!.actor

  useEffect(() => {
    onPendingChange?.(command.busy)
  }, [command.busy, onPendingChange])

  function changeDate(value: string) {
    if (value === date) return
    setDate(value)
    setHour(null)
    setCourt(null)
  }
  function changeHour(value: number) {
    if (value !== hour) setCourt(null)
    setHour(value)
    setStep(2)
  }
  function restart() {
    setConfirmed(null)
    setHour(null)
    setCourt(null)
    setStep(0)
  }
  async function confirm() {
    if (!validSlot || !validMember || hour === null || court === null) return
    const input = { date, hour, court }
    const result = await command.run(() =>
      admin
        ? gateway.saveReservation(selectedId, { ...input, memberId }, reservation?.id)
        : gateway.book(selectedId, input),
    )
    if (result) setConfirmed(result)
  }

  return {
    admin,
    date,
    hour,
    court,
    memberId,
    step,
    confirmed,
    hours,
    now,
    freeCourts,
    hasHours,
    validSlot,
    eligible,
    validMember,
    player,
    command,
    changeDate,
    changeHour,
    setCourt,
    setMemberId,
    setStep,
    restart,
    confirm,
  }
}
