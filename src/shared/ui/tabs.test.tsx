import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

function ExampleTabs({ label = 'Módulos' }: { label?: string }) {
  return (
    <Tabs defaultSelectedKey="schedule">
      <TabsList aria-label={label}>
        <TabsTrigger id="schedule">Horarios</TabsTrigger>
        <TabsTrigger id="disabled" isDisabled>
          No disponible
        </TabsTrigger>
        <TabsTrigger id="fee">Cuota</TabsTrigger>
        <TabsTrigger id="closures">Cierres</TabsTrigger>
      </TabsList>
      <TabsContent id="schedule">
        <label>
          Apertura
          <input defaultValue="08:00" />
        </label>
      </TabsContent>
      <TabsContent id="disabled">Módulo deshabilitado</TabsContent>
      <TabsContent id="fee">
        <label>
          Importe
          <input defaultValue="39" />
        </label>
      </TabsContent>
      <TabsContent id="closures">
        <button type="button">Añadir cierre</button>
      </TabsContent>
    </Tabs>
  )
}

describe('pestañas de módulos con @doscientos/ui real', () => {
  it('asocia pestañas y paneles y limita la exposición y el tabulado al panel activo', async () => {
    const user = userEvent.setup()
    render(<ExampleTabs />)
    const list = screen.getByRole('tablist', { name: 'Módulos' })
    const schedule = within(list).getByRole('tab', { name: 'Horarios' })
    const fee = within(list).getByRole('tab', { name: 'Cuota' })
    const panel = screen.getByRole('tabpanel', { name: 'Horarios' })
    expect(schedule).toHaveAttribute('aria-selected', 'true')
    expect(schedule).toHaveAttribute('aria-controls', panel.id)
    expect(panel).toHaveAttribute('aria-labelledby', schedule.id)
    expect(fee).toHaveAttribute('tabindex', '-1')
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
    const hiddenFee = screen.getByLabelText('Importe')
    expect(hiddenFee).not.toBeVisible()
    expect(hiddenFee.closest('[data-slot="tabs-content"]')).toHaveAttribute('inert')
    await user.tab()
    expect(schedule).toHaveFocus()
    await user.tab()
    expect(screen.getByLabelText('Apertura')).toHaveFocus()
    await user.tab({ shift: true })
    expect(schedule).toHaveFocus()
    await user.tab()
    await user.tab()
    expect(hiddenFee).not.toHaveFocus()
  })

  it('navega con flechas, Inicio y Fin, omite deshabilitados y conserva formularios', async () => {
    const user = userEvent.setup()
    render(<ExampleTabs />)
    await user.tab()
    await user.keyboard('{ArrowRight}')
    const fee = screen.getByRole('tab', { name: 'Cuota' })
    expect(fee).toHaveFocus()
    expect(fee).toHaveAttribute('aria-selected', 'true')
    const amount = screen.getByLabelText('Importe')
    await user.clear(amount)
    await user.type(amount, '45.50')
    await user.click(fee)
    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Cierres' })).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Horarios' })).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Cierres' })).toHaveFocus()
    await user.keyboard('{Home}{ArrowRight}')
    expect(fee).toHaveFocus()
    expect(amount).toBeVisible()
    expect(amount).toHaveValue('45.50')
    expect(screen.getByRole('tabpanel', { name: 'Cuota' })).toBeInTheDocument()
  })

  it('genera identificadores independientes para grupos montados a la vez', () => {
    render(
      <>
        <ExampleTabs label="Primero" />
        <ExampleTabs label="Segundo" />
      </>,
    )
    const tabs = screen.getAllByRole('tab')
    const panels = screen.getAllByRole('tabpanel', { hidden: true })
    const ids = [...tabs, ...panels].map((element) => element.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const tab of screen.getAllByRole('tab', { selected: true })) {
      const panel = document.getElementById(tab.getAttribute('aria-controls')!)
      expect(panel).toHaveAttribute('aria-labelledby', tab.id)
    }
  })
})
