import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { clubFixture } from '../test/club-fixture'
import { useClubClock } from './club-clock'
import { ClubProvider, useClub } from './club-context'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('actualizaciones aisladas del reloj', () => {
  it('actualiza consumidores temporales sin renderizar de nuevo los datos estables del club', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 17, 12))
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    const { gateway } = clubFixture(new Date())
    const dataRender = vi.fn()
    const clockRender = vi.fn()
    function DataConsumer() {
      const { view } = useClub()
      dataRender()
      return <span>{view?.actor.name}</span>
    }
    function ClockConsumer() {
      const now = useClubClock()
      clockRender()
      return <time>{now.toISOString()}</time>
    }
    const { unmount } = render(
      <ClubProvider gateway={gateway}>
        <DataConsumer />
        <ClockConsumer />
      </ClubProvider>,
    )
    try {
      await act(async () => {})
      expect(screen.getByText('Alba Martín')).toBeInTheDocument()
      const initialDataRenders = dataRender.mock.calls.length
      const initialClockRenders = clockRender.mock.calls.length
      await act(async () => {
        vi.advanceTimersByTime(30000)
      })
      expect(clockRender).toHaveBeenCalledTimes(initialClockRenders + 1)
      expect(dataRender).toHaveBeenCalledTimes(initialDataRenders)
      visibility.mockReturnValue('hidden')
      await act(async () => {
        vi.advanceTimersByTime(30000)
      })
      expect(clockRender).toHaveBeenCalledTimes(initialClockRenders + 1)
      visibility.mockReturnValue('visible')
      await act(async () => {
        window.dispatchEvent(new Event('focus'))
      })
      expect(clockRender).toHaveBeenCalledTimes(initialClockRenders + 2)
      expect(dataRender).toHaveBeenCalledTimes(initialDataRenders)
    } finally {
      unmount()
    }
    expect(vi.getTimerCount()).toBe(0)
  })
})
