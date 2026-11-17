import type { Member, MemberInput } from '../../club/domain/model'
import type { InvitationInput, LocalSession } from '../domain/accounts'

export interface AccountAccess {
  session: LocalSession
  recoveryCode: string
}
export interface AccountGateway {
  login(memberId: string, password?: string): Promise<LocalSession>
  sessionValid(session: LocalSession): Promise<boolean>
  signup(input: MemberInput, password: string): Promise<AccountAccess & { member: Member }>
  inviteUser(actorId: string, input: InvitationInput): Promise<Member>
  changePassword(actorId: string, currentPassword: string, password: string): Promise<AccountAccess>
  recoverPassword(email: string, code: string, password: string): Promise<void>
  resetUserPassword(actorId: string, memberId: string, temporaryPassword: string): Promise<void>
  setMemberRole(actorId: string, memberId: string, role: Member['role']): Promise<void>
}
