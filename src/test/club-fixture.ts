import { createClubService } from '../features/club/application/club-service'
import { addDays, dateKey, periodKey } from '../features/club/domain/rules'
import {
  createLocalRepository,
  DATABASE_KEY,
} from '../features/club/infrastructure/local-repository'
import { createSeed } from '../features/club/infrastructure/seed'

export function clubFixture(now = new Date()) {
  const seed = createSeed(now)
  seed.reservations = []
  localStorage.setItem(DATABASE_KEY, JSON.stringify(seed))
  localStorage.setItem('spin-club:profile', 'alba')
  const repository = createLocalRepository(localStorage, () => structuredClone(seed))
  const gateway = createClubService(repository, () => now)
  const slot = { court: 1, date: addDays(dateKey(now), 1), hour: 18 }
  const subscription = {
    memberId: 'hugo',
    period: periodKey(now),
    quotedCents: 3900,
    paymentOutcome: 'success' as const,
  }
  return { now, seed, repository, gateway, slot, subscription }
}
