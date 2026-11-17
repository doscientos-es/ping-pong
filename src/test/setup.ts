import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Real application routes include Suspense; allow a bounded wait on slower CI workers.
configure({ asyncUtilTimeout: 3000 })

afterEach(() => {
  cleanup()
  localStorage.clear()
  window.location.hash = ''
})
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
window.scrollTo = vi.fn()
HTMLElement.prototype.scrollIntoView = vi.fn()
