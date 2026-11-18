import { Check, CreditCard, Infinity as InfinityIcon, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

import { useClub } from '../../app/club-context'
import { CLUB_NAME } from '../../shared/brand'
import { money, periodLabel } from '../../shared/format'
import { Badge, Button, DetailList, InlineError, Modal, Notice, useCommand } from '../../shared/ui'
import {
  isRecordedPaymentMethod,
  RECORDED_PAYMENT_METHODS,
  type RecordedPaymentMethod,
} from '../club/domain/payment-methods'
import { requirePlan } from '../club/domain/plans'
import { paymentMethodLabels } from './payment-method-labels'

export function SubscriptionDialog({
  memberId,
  period,
  onClose,
}: {
  memberId: string
  period: string
  onClose: () => void
}) {
  const { view, selectedId, gateway } = useClub()
  const member = view!.members.find((item) => item.id === memberId)!
  const [plan] = useState(() => requirePlan(view!.settings, member.planId))
  const quote = plan.priceCents
  const [method, setMethod] = useState<RecordedPaymentMethod>()
  const [outcome, setOutcome] = useState<'success' | 'failure'>('success')
  const command = useCommand()
  const admin = view!.actor.role === 'admin'
  return (
    <Modal
      open
      onClose={onClose}
      title={admin ? 'Registrar pago' : 'Activar suscripción'}
      description={admin ? 'Anota un pago ya recibido. No se realizará ningún cobro.' : undefined}
    >
      <div className="grid gap-5">
        {!admin && (
          <div className="bg-accent-soft text-green-mid desktop:p-5 flex items-center gap-4 rounded-xl p-4">
            <InfinityIcon size={35} />
            <div>
              <Badge>{CLUB_NAME} · mensual</Badge>
              <h3 className="mt-1 text-sm">Reservas ilimitadas</h3>
            </div>
          </div>
        )}
        <DetailList
          items={[
            { label: 'Socio', value: member?.name },
            { label: 'Cuota', value: plan.name },
            { label: 'Periodo', value: periodLabel(period) },
          ]}
        />
        <div className="border-line flex items-center justify-between border-t pt-4 text-sm">
          <strong>Cuota del mes</strong>
          <strong className="font-heading text-2xl">{money(quote)}</strong>
        </div>
        {admin ? (
          <label>
            Método de pago
            <select
              required
              disabled={command.busy}
              value={method ?? ''}
              onChange={(event) => {
                const value = event.currentTarget.value
                setMethod(isRecordedPaymentMethod(value) ? value : undefined)
              }}
            >
              <option value="" disabled>
                Selecciona cómo se pagó
              </option>
              {RECORDED_PAYMENT_METHODS.map((value) => (
                <option key={value} value={value}>
                  {paymentMethodLabels[value]}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <>
            <Notice>
              <ShieldCheck size={21} />
              <span>
                <strong>Sin dinero real</strong>No se necesitan datos bancarios. Solo se registra un
                pago ficticio para este periodo.
              </span>
            </Notice>
            <details className="text-muted text-xs">
              <summary className="cursor-pointer py-1">Probar un pago rechazado</summary>
              <label className="mt-3">
                Resultado del pago simulado
                <select
                  value={outcome}
                  onChange={(event) => setOutcome(event.target.value as typeof outcome)}
                >
                  <option value="success">Aceptado · activar cuota</option>
                  <option value="failure">Rechazado · mantener pendiente</option>
                </select>
              </label>
            </details>
          </>
        )}
        <InlineError>{command.error}</InlineError>
        <Button
          disabled={command.busy || (admin && !method)}
          onClick={async () => {
            const paymentInput = admin ? method && { method } : { paymentOutcome: outcome }
            if (!paymentInput) return
            const payment = await command.run(
              () =>
                gateway.paySubscription(selectedId, {
                  memberId,
                  period,
                  quotedCents: quote,
                  planId: plan.id,
                  ...paymentInput,
                }),
              admin
                ? 'Pago registrado.'
                : 'Cuota registrada. Suscripción activa para el periodo seleccionado.',
            )
            if (payment) onClose()
          }}
        >
          {admin ? <Check size={18} /> : <CreditCard size={18} />}
          {command.busy
            ? 'Registrando…'
            : admin
              ? 'Registrar pago'
              : `Simular pago de ${money(quote)}`}
        </Button>
        {!admin && (
          <p className="text-muted text-xs leading-relaxed">
            La cuota cubre el mes natural indicado. Las reservas no tienen coste adicional. No hay
            renovación ni cobro automático en esta demo.
          </p>
        )}
      </div>
    </Modal>
  )
}
