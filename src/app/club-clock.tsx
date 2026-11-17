import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const ClockContext = createContext<Date | null>(null)

/** Only time-sensitive screens subscribe to the clock, not the entire application shell. */
export function ClubClockProvider({
  onTick,
  children,
}: {
  onTick: () => void
  children: ReactNode
}) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'hidden') return
      setNow(new Date())
      onTick()
    }
    const timer = window.setInterval(tick, 30000)
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('focus', tick)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
      window.removeEventListener('focus', tick)
    }
  }, [onTick])
  return <ClockContext.Provider value={now}>{children}</ClockContext.Provider>
}

export function useClubClock() {
  const now = useContext(ClockContext)
  if (!now) throw new Error('ClubClockProvider no está disponible.')
  return now
}
