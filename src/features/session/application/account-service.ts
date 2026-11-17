import type { ClubRepository } from '../../club/application/ports'
import { createMember } from '../../club/domain/member'
import type { Member, MemberInput, ClubState } from '../../club/domain/model'
import { requireActor } from '../../club/domain/rules'
import {
  validatePassword,
  type InvitationInput,
  type LocalSession,
  type PasswordHasher,
} from '../domain/accounts'
import type { AccountGateway } from './ports'

const credentialError = () => new Error('La contraseña o el código no son válidos.')
export function createAccountService(
  repository: ClubRepository,
  clock: () => Date,
  passwords: PasswordHasher,
): AccountGateway {
  const sessionFor = (state: ClubState, memberId: string): LocalSession => ({
    memberId,
    credentialVersion:
      state.credentials.find((item) => item.memberId === memberId)?.version ?? 'legacy',
  })
  const recovery = async () => {
    const code = crypto.randomUUID() + crypto.randomUUID()
    return {
      code,
      value: {
        password: await passwords.hash(code),
        expiresAt: clock().getTime() + 365 * 86400000,
      },
    }
  }
  return {
    async login(memberId: string, password = '') {
      if (password.length > 128) throw credentialError()
      const state = await repository.read()
      requireActor(state, memberId)
      const credential = state.credentials.find((item) => item.memberId === memberId)
      if (credential && !(await passwords.verify(password, credential.password)))
        throw credentialError()
      const latest = await repository.read()
      requireActor(latest, memberId)
      if (
        credential?.version !==
        latest.credentials.find((item) => item.memberId === memberId)?.version
      )
        throw credentialError()
      return sessionFor(latest, memberId)
    },
    async sessionValid(session: LocalSession) {
      const state = await repository.read()
      return (
        state.members.some((item) => item.id === session.memberId) &&
        sessionFor(state, session.memberId).credentialVersion === session.credentialVersion
      )
    },
    async signup(input: MemberInput, password: string) {
      validatePassword(password)
      const hash = await passwords.hash(password)
      const reset = await recovery()
      return repository.transact((state) => {
        const account = createMember(input, state, clock())
        state.members.push(account)
        state.credentials.push({
          memberId: account.id,
          password: hash,
          version: crypto.randomUUID(),
          temporary: false,
          recovery: reset.value,
        })
        return { member: account, session: sessionFor(state, account.id), recoveryCode: reset.code }
      })
    },
    async inviteUser(actorId: string, input: InvitationInput) {
      requireActor(await repository.read(), actorId, true)
      validatePassword(input.temporaryPassword)
      if (!['member', 'admin'].includes(input.role)) throw new Error('Rol no válido.')
      const hash = await passwords.hash(input.temporaryPassword)
      return repository.transact((state) => {
        requireActor(state, actorId, true)
        const account = createMember(input, state, clock(), input.role)
        state.members.push(account)
        state.credentials.push({
          memberId: account.id,
          password: hash,
          version: crypto.randomUUID(),
          temporary: true,
        })
        return account
      })
    },
    async changePassword(actorId: string, currentPassword: string, password: string) {
      const session = await this.login(actorId, currentPassword)
      validatePassword(password)
      const hash = await passwords.hash(password)
      const reset = await recovery()
      return repository.transact((state) => {
        requireActor(state, actorId)
        if (sessionFor(state, actorId).credentialVersion !== session.credentialVersion)
          throw credentialError()
        const previous = state.credentials.findIndex((item) => item.memberId === actorId)
        const credential = {
          memberId: actorId,
          password: hash,
          version: crypto.randomUUID(),
          temporary: false,
          recovery: reset.value,
        }
        if (previous < 0) state.credentials.push(credential)
        else state.credentials[previous] = credential
        return { session: sessionFor(state, actorId), recoveryCode: reset.code }
      })
    },
    async recoverPassword(email: string, code: string, password: string) {
      validatePassword(password)
      if (code.length > 128) throw credentialError()
      const snapshot = await repository.read()
      const account = snapshot.members.find(
        (item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.active,
      )
      const credential = snapshot.credentials.find((item) => item.memberId === account?.id)
      if (
        !credential?.recovery ||
        credential.recovery.expiresAt <= clock().getTime() ||
        !(await passwords.verify(code, credential.recovery.password))
      )
        throw credentialError()
      const hash = await passwords.hash(password)
      return repository.transact((state) => {
        const current = state.credentials.find((item) => item.memberId === account!.id)
        requireActor(state, account!.id)
        if (
          !current?.recovery ||
          current.version !== credential.version ||
          current.recovery.password.digest !== credential.recovery!.password.digest ||
          current.recovery.expiresAt <= clock().getTime()
        )
          throw credentialError()
        current.password = hash
        current.version = crypto.randomUUID()
        current.temporary = false
        delete current.recovery
      })
    },
    async resetUserPassword(actorId: string, memberId: string, temporaryPassword: string) {
      requireActor(await repository.read(), actorId, true)
      validatePassword(temporaryPassword)
      const hash = await passwords.hash(temporaryPassword)
      return repository.transact((state) => {
        requireActor(state, actorId, true)
        requireActor(state, memberId)
        const index = state.credentials.findIndex((item) => item.memberId === memberId)
        const credential = {
          memberId,
          password: hash,
          version: crypto.randomUUID(),
          temporary: true,
        }
        if (index < 0) state.credentials.push(credential)
        else state.credentials[index] = credential
      })
    },
    setMemberRole(actorId: string, memberId: string, role: Member['role']) {
      return repository.transact((state) => {
        requireActor(state, actorId, true)
        const account = state.members.find((item) => item.id === memberId)
        if (!account || !['member', 'admin'].includes(role))
          throw new Error('Cuenta o rol no válido.')
        if (
          account.role === 'admin' &&
          role === 'member' &&
          account.active &&
          !state.members.some(
            (item) => item.id !== memberId && item.role === 'admin' && item.active,
          )
        )
          throw new Error('Debe quedar al menos un administrador activo.')
        account.role = role
      })
    },
  }
}
