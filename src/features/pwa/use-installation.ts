import { useEffect, useRef, useState } from 'react'

interface InstallPrompt extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function useInstallation() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null)
  const [help, setHelp] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const running = useRef(false)
  const [installed, setInstalled] = useState(
    () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
  )

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setPrompt(event as InstallPrompt)
    }
    const onInstalled = () => {
      setInstalled(true)
      setPrompt(null)
      setHelp(false)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function install() {
    if (running.current) return
    setError('')
    setNotice('')
    if (!prompt) {
      setHelp(true)
      return
    }
    running.current = true
    setBusy(true)
    setPrompt(null)
    try {
      await prompt.prompt()
      const choice = await prompt.userChoice
      setNotice(
        choice.outcome === 'accepted'
          ? 'Solicitud aceptada. El navegador completará la instalación.'
          : 'Has cancelado la instalación. Puedes instalar la app desde el menú del navegador.',
      )
      // Only appinstalled confirms that installation actually completed.
    } catch {
      setError('El navegador no pudo abrir la instalación. Puedes intentarlo desde su menú.')
      setHelp(true)
    } finally {
      running.current = false
      setBusy(false)
    }
  }

  return { installed, help, setHelp, busy, error, notice, canInstall: prompt !== null, install }
}
