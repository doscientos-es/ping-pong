import { freezeSnapshot } from '../../../shared/immutable'
import type { ClubRepository } from '../application/ports'
import type { ClubState } from '../domain/model'
import { decodeState } from './schema'
import { createSeed } from './seed'

export const DATABASE_KEY = 'spin-club:database:v2'
const CHANGE_EVENT = 'spin-club:changed'
let pending: Promise<unknown> = Promise.resolve()

export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function createLocalRepository(storage: KeyValueStorage, seed = createSeed): ClubRepository {
  let cachedRaw: string | null = null
  let cachedContent: string | undefined
  let cachedState: ClubState | undefined

  const read = (): ClubState => {
    try {
      const raw = storage.getItem(DATABASE_KEY)
      if (cachedState && raw === cachedRaw) return cachedState
      const state = raw ? decodeState(raw) : seed()
      // Schema decoding can reorder keys; compare drafts with decoded content, not raw JSON.
      const serialized = JSON.stringify(state)
      if (!raw) storage.setItem(DATABASE_KEY, serialized)
      cachedState = freezeSnapshot(state)
      cachedRaw = raw || serialized
      cachedContent = serialized
      return cachedState
    } catch (error) {
      if (error instanceof SyntaxError)
        throw new Error('Los datos locales están dañados. No se han modificado.')
      if (error instanceof DOMException)
        throw new Error(
          'No se puede guardar en este navegador. Habilita el almacenamiento local o libera espacio.',
        )
      throw error
    }
  }

  const execute = <T>(operation: (state: ClubState) => T): T => {
    // Always check storage inside the lock, including changes from other repositories/tabs.
    const state = structuredClone(read())
    const result = operation(state)
    if (result && typeof (result as { then?: unknown }).then === 'function')
      throw new Error('Las transacciones locales deben ser síncronas.')
    // Clone before committing: an uncloneable result must not cause a partial success.
    const detachedResult = structuredClone(result)
    const serialized = JSON.stringify(state)
    if (serialized === cachedContent) return detachedResult
    const snapshot = freezeSnapshot(state)
    // One atomic localStorage write: failed validation or payment never changes persisted state.
    try {
      storage.setItem(DATABASE_KEY, serialized)
    } catch {
      throw new Error(
        'No se han podido guardar los cambios. Revisa el espacio disponible del navegador.',
      )
    }
    cachedRaw = serialized
    cachedContent = serialized
    cachedState = snapshot
    window.dispatchEvent(new Event(CHANGE_EVENT))
    return detachedResult
  }

  return {
    async read() {
      return read()
    },
    transact<T>(operation: (state: ClubState) => T): Promise<T> {
      if (typeof navigator !== 'undefined' && navigator.locks) {
        return navigator.locks.request(DATABASE_KEY, () => execute(operation))
      }
      const task = pending.then(() => execute(operation))
      pending = task.catch(() => undefined)
      return task
    },
    subscribe(listener) {
      const onStorage = (event: StorageEvent) => {
        if (event.key === DATABASE_KEY || event.key === null) listener()
      }
      window.addEventListener('storage', onStorage)
      window.addEventListener(CHANGE_EVENT, listener)
      return () => {
        window.removeEventListener('storage', onStorage)
        window.removeEventListener(CHANGE_EVENT, listener)
      }
    },
  }
}
