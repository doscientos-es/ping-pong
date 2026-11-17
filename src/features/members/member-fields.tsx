import { useId } from 'react'

import { useClub } from '../../app/club-context'
import type { MemberInput } from '../club/domain/model'
import { ClubPlanSelect } from './club-plan-select'

export function MemberFields({ member }: { member?: MemberInput }) {
  const { plans } = useClub()
  const planDescriptionId = useId()
  const billingDescriptionId = useId()
  return (
    <>
      <label>
        Nombre y apellidos
        <input
          name="name"
          placeholder="Nombre y apellidos"
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
          defaultValue={member?.name}
        />
      </label>
      <label>
        Cuota del club
        <ClubPlanSelect
          name="planId"
          required
          aria-describedby={planDescriptionId}
          defaultValue={member?.planId ?? plans[0]?.id}
        />
      </label>
      <p id={planDescriptionId} className="text-muted text-xs">
        Todas las cuotas incluyen reservas ilimitadas.
      </p>
      <label>
        Email
        <input
          name="email"
          type="email"
          placeholder="nombre@ejemplo.com"
          required
          maxLength={150}
          autoComplete="email"
          defaultValue={member?.email}
        />
      </label>
      <label>
        <span>
          Teléfono <span className="text-muted">(opcional)</span>
        </span>
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          maxLength={25}
          defaultValue={member?.phone}
        />
      </label>
      <fieldset className="border-line grid min-w-0 gap-4 rounded-xl border p-4">
        <legend className="px-1 text-sm font-semibold">Datos de facturación</legend>
        <p id={billingDescriptionId} className="text-muted text-xs leading-relaxed">
          Opcionales para el alta. Completa ambos para incluirlos en los próximos comprobantes. Usa
          solo datos ficticios en esta demo local.
        </p>
        <label>
          DNI / NIE
          <input
            name="dni"
            maxLength={20}
            autoCapitalize="characters"
            autoComplete="off"
            aria-describedby={billingDescriptionId}
            defaultValue={member?.dni}
          />
        </label>
        <label>
          Dirección postal
          <input
            name="address"
            maxLength={300}
            autoComplete="street-address"
            placeholder="Calle, número, CP, localidad, provincia y país"
            aria-describedby={billingDescriptionId}
            defaultValue={member?.address}
          />
        </label>
      </fieldset>
    </>
  )
}

export function readMemberForm(form: HTMLFormElement): MemberInput {
  const data = new FormData(form)
  return {
    name: String(data.get('name') ?? ''),
    email: String(data.get('email') ?? ''),
    phone: String(data.get('phone') ?? ''),
    dni: String(data.get('dni') ?? ''),
    address: String(data.get('address') ?? ''),
    planId: String(data.get('planId') ?? ''),
  }
}
