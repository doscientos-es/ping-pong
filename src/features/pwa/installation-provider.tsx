import { createContext, useContext, type ReactNode } from 'react'

import { useInstallation } from './use-installation'

const InstallationContext = createContext<ReturnType<typeof useInstallation> | null>(null)

export function InstallationProvider({ children }: { children: ReactNode }) {
  const installation = useInstallation()
  return <InstallationContext.Provider value={installation}>{children}</InstallationContext.Provider>
}

export function useAppInstallation() {
  const installation = useContext(InstallationContext)
  if (!installation) throw new Error('InstallationProvider is missing')
  return installation
}
