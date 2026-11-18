import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource-variable/dm-sans/index.css'
import '@fontsource-variable/manrope/index.css'
import './theme.css'
import { App } from './app/app'
import { createClubService } from './features/club/application/club-service'
import { createLocalRepository } from './features/club/infrastructure/local-repository'
import { createDemoSeed } from './features/club/infrastructure/seed'

const repository = createLocalRepository(
  {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value),
  },
  createDemoSeed,
)
const gateway = createClubService(repository, undefined, createDemoSeed)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App gateway={gateway} />
  </StrictMode>,
)
