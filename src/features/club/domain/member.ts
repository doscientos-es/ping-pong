import type { ClubState, Member, MemberInput } from './model'
import { requirePlan } from './plans'
import { validateMember } from './rules'

export function createMember(
  input: MemberInput,
  state: ClubState,
  now: Date,
  role: Member['role'] = 'member',
): Member {
  return {
    ...validateMember(input, state),
    planId: requirePlan(
      state.settings,
      input.planId ?? (state.settings.plans.length === 1 ? state.settings.plans[0].id : ''),
    ).id,
    id: crypto.randomUUID(),
    role,
    active: true,
    number: `SC-${String(state.members.length + 1).padStart(4, '0')}`,
    joinedAt: now.toISOString(),
  }
}
