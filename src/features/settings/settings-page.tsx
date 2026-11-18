import { Info } from 'lucide-react'

import {
  InlineError,
  Notice,
  PageHeading,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../shared/ui'
import { ClosedDatesPanel } from './closed-dates-panel'
import { ClubFeePanel } from './club-fee-panel'
import { FiscalIssuerPanel } from './fiscal-issuer-panel'
import { ResetDemoPanel } from './reset-demo-panel'
import { SettingsSaveBar } from './settings-save-bar'
import { useSettingsDraft } from './use-settings-draft'
import { WeeklySchedulePanel } from './weekly-schedule-panel'

export function SettingsPage() {
  const {
    draft,
    priceTexts,
    changed,
    conflicted,
    affected,
    command,
    update,
    changePrice,
    discard,
    save,
  } = useSettingsDraft()
  return (
    <>
      <PageHeading title="Configuración" />
      <InlineError className="mb-5">{command.error}</InlineError>
      <InlineError className="mb-5">
        {conflicted &&
          'La configuración ha cambiado en otra pestaña. Conservamos tu borrador; pulsa Descartar para cargar los ajustes actuales antes de volver a editar.'}
      </InlineError>
      {affected > 0 && (
        <Notice warning className="mb-4">
          <Info size={20} />
          <span>
            <strong>{affected} reservas fuera del nuevo horario.</strong> No se borrarán ni
            cancelarán. Puedes reprogramarlas desde el calendario.
          </span>
        </Notice>
      )}
      <Tabs defaultSelectedKey="schedule">
        <TabsList aria-label="Secciones de configuración">
          <TabsTrigger id="schedule">Horarios</TabsTrigger>
          <TabsTrigger id="closures">Cierres</TabsTrigger>
          <TabsTrigger id="fee">Cuotas</TabsTrigger>
          <TabsTrigger id="fiscal">Datos fiscales</TabsTrigger>
        </TabsList>
        <fieldset disabled={command.busy} className="m-0 min-w-0 border-0 p-0">
          <TabsContent id="schedule">
            <WeeklySchedulePanel
              weekly={draft.weekly}
              onChange={(value) => update('weekly', value)}
            />
          </TabsContent>
          <TabsContent id="closures">
            <ClosedDatesPanel
              dates={draft.closedDates}
              onChange={(value) => update('closedDates', value)}
            />
          </TabsContent>
          <TabsContent id="fee">
            <ClubFeePanel
              plans={draft.plans}
              priceTexts={priceTexts}
              onChange={(plans) => update('plans', plans)}
              onPriceChange={changePrice}
            />
          </TabsContent>
          <TabsContent id="fiscal">
            <FiscalIssuerPanel
              issuer={draft.issuer}
              onChange={(issuer) => update('issuer', issuer)}
            />
          </TabsContent>
        </fieldset>
      </Tabs>
      <ResetDemoPanel disabled={command.busy} />
      <SettingsSaveBar
        changed={changed}
        conflicted={conflicted}
        busy={command.busy}
        onDiscard={discard}
        onSave={() => void save()}
      />
    </>
  )
}
