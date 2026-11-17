/** Shared spring speeds: direct feedback, small controls, and larger surfaces. */
export const spring = {
  fast: { type: 'spring', duration: 0.08, bounce: 0 },
  moderate: { type: 'spring', duration: 0.16, bounce: 0 },
  slow: { type: 'spring', duration: 0.24, bounce: 0.12 },
} as const
