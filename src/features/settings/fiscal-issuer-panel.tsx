import { useId } from 'react'

import { Panel } from '../../shared/ui'
import type { FiscalIssuer } from '../club/domain/model'

export function FiscalIssuerPanel({
  issuer,
  onChange,
}: {
  issuer?: FiscalIssuer
  onChange: (issuer: FiscalIssuer) => void
}) {
  const descriptionId = useId()
  const value = issuer ?? { nif: '', legalName: '', address: '' }
  const update = (key: keyof FiscalIssuer, text: string) => onChange({ ...value, [key]: text })
  return (
    <Panel className="desktop:p-6 grid gap-4 p-5">
      <h2 className="text-sm">Datos fiscales del emisor</h2>
      <p id={descriptionId} className="text-muted text-xs leading-relaxed">
        Usa datos ficticios. Completa los tres campos o déjalos vacíos. Solo afecta a pagos nuevos.
      </p>
      <label>
        Razón social
        <input
          autoComplete="organization"
          maxLength={160}
          value={value.legalName}
          aria-describedby={descriptionId}
          onChange={(event) => update('legalName', event.target.value)}
        />
      </label>
      <label>
        NIF del emisor
        <input
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={20}
          value={value.nif}
          aria-describedby={descriptionId}
          onChange={(event) => update('nif', event.target.value)}
        />
      </label>
      <label>
        Dirección fiscal
        <input
          autoComplete="street-address"
          maxLength={300}
          placeholder="Calle, número, CP, localidad, provincia y país"
          value={value.address}
          aria-describedby={descriptionId}
          onChange={(event) => update('address', event.target.value)}
        />
      </label>
    </Panel>
  )
}
