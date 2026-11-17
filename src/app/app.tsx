import { BrowserRouter } from 'react-router-dom'

import type { ClubGateway } from '../features/club/application/ports'
import { ClubProvider } from './club-context'
import { ErrorBoundary } from './error-boundary'
import { SessionRoutes } from './session-routes'

export function App({ gateway }: { gateway: ClubGateway }) {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ClubProvider gateway={gateway}>
          <SessionRoutes />
        </ClubProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
