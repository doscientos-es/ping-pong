import type { AccountingGateway } from '../../accounting/application/ports'
import type { AccountGateway } from '../../session/application/ports'
import type {
  BookingInput,
  ManagedBookingInput,
  ClubSettings,
  ClubState,
  ClubView,
  Member,
  MemberInput,
  Profile,
  Reservation,
  SubscriptionInput,
  Payment,
  ClubPlan,
} from '../domain/model'

/** Infrastructure transaction boundary. Remote implementations must execute atomically on the server. */
export interface ClubRepository {
  /** Immutable snapshot with a stable identity until persisted content changes. */
  read(): Promise<ClubState>
  /** Synchronous operation on an isolated mutable draft; a failed operation never commits. */
  transact<T>(operation: (state: ClubState) => T): Promise<T>
  subscribe(listener: () => void): () => void
}

/** The UI depends on use cases, never localStorage or a vendor SDK. */
export interface ClubGateway extends AccountingGateway, AccountGateway {
  /** Immutable read models, stable until their data or subscription period changes. */
  profiles(): Promise<Profile[]>
  subscriptionPlans(): Promise<ClubPlan[]>
  view(actorId: string): Promise<ClubView>
  register(input: MemberInput): Promise<Member>
  book(actorId: string, input: BookingInput): Promise<Reservation>
  saveReservation(
    actorId: string,
    input: ManagedBookingInput,
    reservationId?: string,
  ): Promise<Reservation>
  cancel(actorId: string, reservationId: string): Promise<void>
  paySubscription(actorId: string, input: SubscriptionInput): Promise<Payment>
  voidPayment(actorId: string, paymentId: string): Promise<void>
  saveMember(actorId: string, input: MemberInput, memberId?: string): Promise<Member>
  setMemberPlan(actorId: string, memberId: string, planId: string): Promise<void>
  setMemberActive(actorId: string, memberId: string, active: boolean): Promise<void>
  saveSettings(actorId: string, settings: ClubSettings, expected?: ClubSettings): Promise<void>
  resetDemo?(actorId: string): Promise<void>
  subscribe(listener: () => void): () => void
}
