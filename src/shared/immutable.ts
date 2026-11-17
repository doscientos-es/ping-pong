/** Shared read models are immutable; transaction drafts remain independently mutable. */
export function freezeSnapshot<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeSnapshot(child)
    Object.freeze(value)
  }
  return value
}
