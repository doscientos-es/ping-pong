import { Component, type ReactNode } from 'react'

import { Button } from '../shared/ui'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <section className="p-[10%]" role="alert">
        <h1>Error de la aplicación</h1>
        <p className="my-5">
          Recarga la aplicación para volver a intentarlo. No se borrarán tus datos locales.
        </p>
        <Button onClick={() => location.reload()}>Recargar</Button>
      </section>
    )
  }
}
