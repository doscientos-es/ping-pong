import type { PasswordHash, PasswordHasher } from '../domain/accounts'

const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
async function derive(value: string, salt: string) {
  if (!crypto.subtle) throw new Error('Las contraseñas locales requieren HTTPS o localhost.')
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(value),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bytes = Uint8Array.from(salt.match(/.{2}/g) ?? [], (part) => Number.parseInt(part, 16))
  return hex(
    new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: bytes, iterations: 210000, hash: 'SHA-256' },
        material,
        256,
      ),
    ),
  )
}
export const localPasswords: PasswordHasher = {
  async hash(value): Promise<PasswordHash> {
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)))
    return { salt, digest: await derive(value, salt) }
  },
  async verify(value, hash) {
    const digest = await derive(value, hash.salt)
    let difference = digest.length ^ hash.digest.length
    for (let index = 0; index < digest.length; index++)
      difference |= digest.charCodeAt(index) ^ hash.digest.charCodeAt(index)
    return difference === 0
  },
}
