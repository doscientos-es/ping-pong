import { createAccountingService } from '../../accounting/application/accounting-service'
import { createAccountService } from '../../session/application/account-service'
import { localPasswords } from '../../session/infrastructure/passwords'
import { normalizeIssuer } from '../domain/billing'
import { createMember } from '../domain/member'
import type { BookingInput, ClubSettings, ClubState, Payment, Reservation } from '../domain/model'
import { isRecordedPaymentMethod } from '../domain/payment-methods'
import { requirePlan } from '../domain/plans'
import {
  requireSubscription,
  requireActor,
  startTime,
  validateMember,
  validateSettings,
  validateSlot,
} from '../domain/rules'
import { sameSettings } from '../domain/settings'
import { createClubQueries } from './club-queries'
import type { ClubGateway, ClubRepository } from './ports'

export function createClubService(
  repository: ClubRepository,
  clock = () => new Date(),
  demoSeed?: (now: Date) => ClubState,
): ClubGateway {
  const newReservation = (input: BookingInput, memberId: string): Reservation => ({
    id: crypto.randomUUID(),
    memberId,
    court: input.court,
    date: input.date,
    hour: input.hour,
    status: 'confirmed',
    createdAt: clock().toISOString(),
  })

  return {
    ...createAccountingService(repository, clock),
    ...createAccountService(repository, clock, localPasswords),
    ...createClubQueries(repository, clock),
    subscribe: (listener) => repository.subscribe(listener),
    ...(demoSeed && {
      resetDemo: (actorId: string) =>
        repository.transact((state) => {
          requireActor(state, actorId, true)
          Object.assign(state, demoSeed(clock()))
        }),
    }),
    register(input) {
      return repository.transact((state) => {
        const member = createMember(input, state, clock())
        state.members.push(member)
        return member
      })
    },
    book(actorId: string, input: BookingInput) {
      return repository.transact((state) => {
        const actor = requireActor(state, actorId)
        if (actor.role !== 'member') throw new Error('Cambia a un perfil de socio para reservar.')
        requireSubscription(state, actorId, clock())
        validateSlot(state, input.date, input.hour, input.court, clock())
        const reservation = newReservation(input, actorId)
        state.reservations.push(reservation)
        return reservation
      })
    },
    saveReservation(actorId, input, reservationId) {
      return repository.transact((state) => {
        requireActor(state, actorId, true)
        const member = requireActor(state, input.memberId)
        if (member.role !== 'member') throw new Error('Selecciona un socio para la reserva.')
        requireSubscription(state, member.id, clock())
        const existing = reservationId
          ? state.reservations.find((item) => item.id === reservationId)
          : undefined
        if (reservationId && (!existing || existing.status !== 'confirmed'))
          throw new Error('Esta reserva ya no se puede modificar.')
        if (existing && startTime(existing.date, existing.hour) <= clock().getTime())
          throw new Error('No se pueden modificar partidas que ya han comenzado.')
        validateSlot(state, input.date, input.hour, input.court, clock(), reservationId)
        if (existing) {
          Object.assign(existing, {
            memberId: member.id,
            date: input.date,
            hour: input.hour,
            court: input.court,
          })
          return existing
        }
        const reservation = newReservation(input, member.id)
        state.reservations.push(reservation)
        return reservation
      })
    },
    cancel(actorId, reservationId) {
      return repository.transact((state) => {
        const actor = requireActor(state, actorId)
        const reservation = state.reservations.find((item) => item.id === reservationId)
        if (!reservation || (actor.role !== 'admin' && reservation.memberId !== actorId))
          throw new Error('No puedes cancelar esta reserva.')
        if (reservation.status !== 'confirmed') throw new Error('La reserva ya está cancelada.')
        if (startTime(reservation.date, reservation.hour) <= clock().getTime())
          throw new Error('No se pueden cancelar partidas que ya han comenzado.')
        reservation.status = 'cancelled'
      })
    },
    paySubscription(actorId, input) {
      return repository.transact((state) => {
        const actor = requireActor(state, actorId)
        if (actor.role !== 'admin' && actorId !== input.memberId)
          throw new Error('Solo puedes pagar tu propia suscripción.')
        const member = state.members.find((item) => item.id === input.memberId)
        if (!member?.active || member.role !== 'member')
          throw new Error('Reactiva primero el acceso de este socio.')
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.period))
          throw new Error('El periodo no es válido.')
        if (
          state.payments.some(
            (item) =>
              item.memberId === member.id && item.period === input.period && item.status === 'paid',
          )
        )
          throw new Error('La cuota de este periodo ya está pagada.')
        const plan = requirePlan(state.settings, member.planId)
        if (
          input.quotedCents !== plan.priceCents ||
          (input.planId !== undefined && input.planId !== plan.id)
        )
          throw new Error('La cuota ha cambiado. Revisa el importe antes de confirmar.')
        let method: Payment['method'] = 'demo'
        if (actor.role === 'admin') {
          if (!isRecordedPaymentMethod(input.method))
            throw new Error('Selecciona un método de pago.')
          method = input.method
        } else if (input.paymentOutcome !== 'success') {
          throw new Error(
            'Pago simulado rechazado. Tu cuota sigue pendiente y no se ha cobrado nada.',
          )
        }
        const payment: Payment = {
          id: crypto.randomUUID(),
          memberId: member.id,
          period: input.period,
          amountCents: plan.priceCents,
          plan: { id: plan.id, name: plan.name },
          vatBps: state.accounting.subscriptionVatBps,
          status: 'paid',
          paidAt: clock().toISOString(),
          method,
          invoiceNumber: `DEMO-${clock().getFullYear()}-${String(state.payments.length + 1).padStart(5, '0')}`,
          customer: {
            name: member.name,
            email: member.email,
            dni: member.dni,
            address: member.address,
          },
          issuer: normalizeIssuer(state.settings.issuer),
        }
        state.payments.push(payment)
        return payment
      })
    },
    voidPayment(actorId, paymentId) {
      return repository.transact((state) => {
        requireActor(state, actorId, true)
        const payment = state.payments.find((item) => item.id === paymentId)
        if (!payment || payment.status !== 'paid') throw new Error('Este pago no se puede anular.')
        payment.status = 'voided'
        payment.voidedAt = clock().toISOString()
      })
    },
    saveMember(actorId, input, memberId) {
      return repository.transact((state) => {
        requireActor(state, actorId, true)
        const values = validateMember(input, state, memberId)
        if (memberId) {
          const member = state.members.find((item) => item.id === memberId)
          if (!member || member.role === 'admin')
            throw new Error('No se puede editar esta cuenta desde gestión de socios.')
          Object.assign(member, values)
          if (input.planId !== undefined)
            member.planId = requirePlan(state.settings, input.planId).id
          return member
        }
        const member = createMember(input, state, clock())
        state.members.push(member)
        return member
      })
    },
    setMemberPlan(actorId, memberId, planId) {
      return repository.transact((state) => {
        requireActor(state, actorId, true)
        const member = state.members.find((item) => item.id === memberId)
        if (!member) throw new Error('No se ha encontrado la cuenta.')
        member.planId = requirePlan(state.settings, planId).id
      })
    },
    setMemberActive(actorId, memberId, active) {
      return repository.transact((state) => {
        requireActor(state, actorId, true)
        const member = state.members.find((item) => item.id === memberId)
        if (!member || member.role === 'admin')
          throw new Error('No se puede cambiar el acceso de esta cuenta.')
        member.active = active
      })
    },
    saveSettings(actorId: string, settings: ClubSettings, expected?: ClubSettings) {
      return repository.transact((state) => {
        requireActor(state, actorId, true)
        if (expected && !sameSettings(state.settings, expected))
          throw new Error(
            'La configuración ha cambiado en otra pestaña. Descarta el borrador y vuelve a editar.',
          )
        validateSettings(settings)
        for (const member of state.members) {
          if (!settings.plans.some((plan) => plan.id === member.planId))
            throw new Error(
              'No puedes eliminar una cuota asignada a usuarios. Cambia primero su cuota.',
            )
        }
        state.settings = {
          ...structuredClone(settings),
          ...(settings.issuer !== undefined && { issuer: normalizeIssuer(settings.issuer) }),
        }
      })
    },
  }
}
