import { lazy, Suspense, type ComponentProps } from 'react'

import type { BookingFlow } from './booking-flow'

// Keep the booking motion engine out of the initial administration bundle.
const LazyBookingFlow = lazy(() =>
  import('./booking-flow').then((module) => ({ default: module.BookingFlow })),
)

export function BookingFlowLoader(props: ComponentProps<typeof BookingFlow>) {
  return (
    <Suspense
      fallback={
        <div className="text-muted grid min-h-[420px] place-items-center text-sm" role="status">
          Preparando reserva…
        </div>
      }
    >
      <LazyBookingFlow {...props} />
    </Suspense>
  )
}
