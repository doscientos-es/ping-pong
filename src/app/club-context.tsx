import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import type { ClubGateway } from '../features/club/application/ports'
import type { ClubPlan, ClubView, Profile } from '../features/club/domain/model'
import type { LocalSession } from '../features/session/domain/accounts'
import { messageOf } from '../shared/format'
import { Toast } from '../shared/ui/toast'
import { ClubClockProvider } from './club-clock'

const PROFILE_KEY = 'spin-club:profile'
const SESSION_KEY = 'spin-club:session:v1'

function readSession(): LocalSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw !== null) {
      const value: unknown = JSON.parse(raw)
      if (
        value &&
        typeof value === 'object' &&
        'memberId' in value &&
        'credentialVersion' in value &&
        typeof value.memberId === 'string' &&
        typeof value.credentialVersion === 'string'
      )
        return value as LocalSession
      return null
    }
    const legacy = localStorage.getItem(PROFILE_KEY)
    return legacy ? { memberId: legacy, credentialVersion: 'legacy' } : null
  } catch {
    return null
  }
}

interface ClubContextValue {
  gateway: ClubGateway
  view: ClubView | null
  profiles: Profile[]
  plans: ClubPlan[]
  selectedId: string
  selectProfile: (id: string, password?: string) => Promise<void>
  acceptSession: (session: LocalSession) => void
  signOut: () => void
  loading: boolean
  error: string
  notify: (message: string) => void
}

const ClubContext = createContext<ClubContextValue | null>(null)

export function ClubProvider({ gateway, children }: { gateway: ClubGateway; children: ReactNode }) {
  const [session, setSession] = useState<LocalSession | null>(readSession)
  const selectedId = session?.memberId ?? ''
  const [data, setData] = useState<{
    profiles: Profile[]
    plans: ClubPlan[]
    view: ClubView | null
    error: string
    loading: boolean
  }>({ profiles: [], plans: [], view: null, error: '', loading: true })
  const [toast, setToast] = useState('')
  const generation = useRef(0)

  const refresh = useCallback(async () => {
    const current = ++generation.current
    try {
      const valid = session ? await gateway.sessionValid(session) : false
      if (current !== generation.current) return
      if (session && !valid) {
        setSession(null)
        return
      }
      const [profiles, view, plans] = await Promise.allSettled([
        gateway.profiles(),
        valid ? gateway.view(selectedId) : Promise.resolve(null),
        gateway.subscriptionPlans(),
      ])
      if (current !== generation.current) return
      const next = {
        profiles: profiles.status === 'fulfilled' ? profiles.value : [],
        plans: plans.status === 'fulfilled' ? plans.value : [],
        view: profiles.status === 'fulfilled' && view.status === 'fulfilled' ? view.value : null,
        error:
          profiles.status === 'rejected'
            ? messageOf(profiles.reason)
            : plans.status === 'rejected'
              ? messageOf(plans.reason)
              : view.status === 'rejected'
                ? messageOf(view.reason)
                : '',
        loading: false,
      }
      setData((previous) =>
        previous.profiles === next.profiles &&
        previous.plans === next.plans &&
        previous.view === next.view &&
        previous.error === next.error &&
        previous.loading === next.loading
          ? previous
          : next,
      )
    } catch (error) {
      if (current === generation.current)
        setData({ profiles: [], plans: [], view: null, error: messageOf(error), loading: false })
    }
  }, [gateway, selectedId, session])

  useEffect(() => {
    void refresh()
    let active = true
    let queued = false
    const unsubscribe = gateway.subscribe(() => {
      if (queued) return
      queued = true
      queueMicrotask(() => {
        queued = false
        if (active) void refresh()
      })
    })
    return () => {
      active = false
      generation.current++
      unsubscribe()
    }
  }, [gateway, refresh])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 5000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const replaceSession = useCallback((next: LocalSession | null) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(next))
    localStorage.removeItem(PROFILE_KEY)
    generation.current++
    setData((previous) =>
      previous.view?.actor.id === next?.memberId
        ? { ...previous, error: '' }
        : { ...previous, view: null, loading: true, error: '' },
    )
    setSession(next)
  }, [])
  const acceptSession = useCallback((next: LocalSession) => replaceSession(next), [replaceSession])
  const signOut = useCallback(() => replaceSession(null), [replaceSession])
  const selectProfile = useCallback(
    async (id: string, password?: string) => {
      acceptSession(await gateway.login(id, password))
    },
    [gateway, acceptSession],
  )

  useEffect(() => {
    const synchronize = (event: StorageEvent) => {
      if (event.key === SESSION_KEY || event.key === null) {
        generation.current++
        const next = readSession()
        setData((previous) => ({ ...previous, view: null, loading: Boolean(next), error: '' }))
        setSession(next)
      }
    }
    window.addEventListener('storage', synchronize)
    return () => window.removeEventListener('storage', synchronize)
  }, [])

  const value = useMemo(
    () => ({
      gateway,
      ...data,
      selectedId,
      selectProfile,
      acceptSession,
      signOut,
      notify: setToast,
    }),
    [gateway, data, selectedId, selectProfile, acceptSession, signOut],
  )

  return (
    <ClubContext.Provider value={value}>
      <ClubClockProvider onTick={refresh}>{children}</ClubClockProvider>
      <Toast message={toast} />
    </ClubContext.Provider>
  )
}

export function useClub() {
  const value = useContext(ClubContext)
  if (!value) throw new Error('ClubProvider no está disponible.')
  return value
}
