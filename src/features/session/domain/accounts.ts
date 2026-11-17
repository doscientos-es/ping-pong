import type { Member, MemberInput } from '../../club/domain/model'

export interface PasswordHash {
  salt: string
  digest: string
}
export interface LocalCredential {
  memberId: string
  password: PasswordHash
  version: string
  temporary: boolean
  recovery?: { password: PasswordHash; expiresAt: number }
}
export interface LocalSession {
  memberId: string
  credentialVersion: string
}
export interface InvitationInput extends MemberInput {
  role: Member['role']
  temporaryPassword: string
}
export interface PasswordHasher {
  hash(value: string): Promise<PasswordHash>
  verify(value: string, hash: PasswordHash): Promise<boolean>
}
export function validatePassword(value: string) {
  if (value.length < 8 || value.length > 128 || !value.trim())
    throw new Error('Usa una contraseña de entre 8 y 128 caracteres.')
}
