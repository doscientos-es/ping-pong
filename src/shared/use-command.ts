import { useRef, useState } from 'react'
import { useClub } from '../app/club-context'
import { messageOf } from './format'

export function useCommand() {
  const { notify } = useClub()
  const running = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function run<T>(operation: () => Promise<T>, success?: string): Promise<T | undefined> {
    if (running.current) return
    running.current = true
    setBusy(true)
    setError('')
    try {
      const result = await operation()
      if (success) notify(success)
      return result
    } catch (cause) {
      setError(messageOf(cause))
      return undefined
    } finally {
      running.current = false
      setBusy(false)
    }
  }
  return { busy, error, run }
}
