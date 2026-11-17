import type { FiscalIssuer } from './model'

export function normalizeDni(value: string): string {
  const dni = value.trim().toUpperCase().replace(/[\s-]/g, '')
  if (!dni) return ''
  if (!/^(?:[0-9]{8}|[XYZ][0-9]{7})[A-Z]$/.test(dni))
    throw new Error('Introduce un DNI o NIE válido.')
  const number = dni.slice(0, -1).replace(/^[XYZ]/, (letter) => String('XYZ'.indexOf(letter)))
  if ('TRWAGMYFPDXBNJZSQVHLCKE'[Number(number) % 23] !== dni.at(-1))
    throw new Error('La letra del DNI o NIE no es válida.')
  return dni
}

export function normalizeAddress(value: string): string {
  const address = value.trim()
  if (address.length > 300) throw new Error('La dirección no puede superar 300 caracteres.')
  return address
}

export function normalizeIssuer(value?: FiscalIssuer): FiscalIssuer | undefined {
  if (!value) return undefined
  const issuer = {
    legalName: value.legalName.trim(),
    nif: value.nif.trim().toUpperCase().replace(/[\s-]/g, ''),
    address: normalizeAddress(value.address),
  }
  if (!issuer.legalName && !issuer.nif && !issuer.address) return undefined
  if (!issuer.legalName || !issuer.nif || !issuer.address)
    throw new Error('Completa el NIF, la razón social y la dirección del emisor.')
  if (issuer.legalName.length > 160)
    throw new Error('La razón social no puede superar 160 caracteres.')
  if (!/^(?:[0-9]{8}[A-Z]|[A-Z][0-9]{7}[A-Z0-9])$/.test(issuer.nif))
    throw new Error('Introduce un NIF de emisor con formato válido.')
  return issuer
}
