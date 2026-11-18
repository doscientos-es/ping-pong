import { BrowserRouter } from 'react-router-dom'

import type { ClubGateway } from '../features/club/application/ports'
import { InstallationProvider } from '../features/pwa/installation-provider'
import { ClubProvider } from './club-context'
import { ErrorBoundary } from './error-boundary'
import { SessionRoutes } from './session-routes'

export function App({ gateway }: { gateway: ClubGateway }) {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <InstallationProvider>
          <ClubProvider gateway={gateway}>
            <SessionRoutes />
          </ClubProvider>
        </InstallationProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
