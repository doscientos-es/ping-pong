import { freezeSnapshot } from '../../../shared/immutable'
import type { ClubState, ClubView, Profile } from '../domain/model'
import { periodKey, requireActor } from '../domain/rules'
import type { ClubRepository } from './ports'

/** Cache only the current immutable snapshot/period, never permissions across revisions. */
export function createClubQueries(repository: ClubRepository, clock: () => Date) {
  let cache:
    | {
        state: ClubState
        period: string
        profiles: Profile[]
        paidMembers: Set<string>
        views: Map<string, ClubView>
      }
    | undefined

  async function snapshot() {
    const state = await repository.read()
    const currentPeriod = periodKey(clock())
    if (!cache || state !== cache.state || currentPeriod !== cache.period) {
      const paidMembers = new Set(
        state.payments
          .filter((payment) => payment.period === currentPeriod && payment.status === 'paid')
          .map((payment) => payment.memberId),
      )
      const profiles = freezeSnapshot(
        state.members.map(({ id, name, role, active }) => ({
          id,
          name,
          role,
          active,
          passwordRequired: state.credentials.some((item) => item.memberId === id),
          mustChangePassword: state.credentials.some(
            (item) => item.memberId === id && item.temporary,
          ),
          subscriptionActive: role === 'admin' || paidMembers.has(id),
        })),
      )
      cache = { state, period: currentPeriod, profiles, paidMembers, views: new Map() }
    }
    return cache
  }

  return {
    async subscriptionPlans() {
      return (await snapshot()).state.settings.plans
    },
    async profiles() {
      return (await snapshot()).profiles
    },
    async view(actorId: string): Promise<ClubView> {
      const { state, views, paidMembers } = await snapshot()
      const cached = views.get(actorId)
      if (cached) return cached
      const actor = requireActor(state, actorId)
      const admin = actor.role === 'admin'
      const subscriptionActive = admin || paidMembers.has(actorId)
      const view = freezeSnapshot({
        actor,
        subscriptionActive,
        members: admin ? state.members : [actor],
        // Occupancy is public to active profiles; other players' identities are not.
        reservations: subscriptionActive
          ? state.reservations.map((item) =>
              admin || item.memberId === actorId ? item : { ...item, memberId: 'occupied' },
            )
          : [],
        payments: state.payments.filter((item) => admin || item.memberId === actorId),
        settings: state.settings,
        ...(admin ? { accounting: state.accounting } : {}),
      })
      views.set(actorId, view)
      return view
    },
  }
}
