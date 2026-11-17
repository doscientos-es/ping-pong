import { HashRouter } from 'react-router-dom'

import type { ClubGateway } from '../features/club/application/ports'
import { ClubProvider } from './club-context'
import { ClubShell } from './club-shell'
import { ErrorBoundary } from './error-boundary'

export function App({ gateway }: { gateway: ClubGateway }) {
  return (
    <ErrorBoundary>
      <HashRouter>
        <ClubProvider gateway={gateway}>
          <ClubShell />
        </ClubProvider>
      </HashRouter>
    </ErrorBoundary>
  )
}
