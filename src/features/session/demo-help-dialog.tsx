import { Modal } from '../../shared/ui'
import type { Profile } from '../club/domain/model'

const memberSteps = [
  {
    title: 'Reservar pista',
    description:
      'Elige día, hora y pista disponible. Para reservar necesitas tener pagada la cuota del mes en curso, aunque reserves para más adelante.',
  },
  {
    title: 'Mis reservas e historial',
    description:
      'Consulta tus próximas reservas, cancélalas antes de que empiecen y revisa tus partidas anteriores.',
  },
  {
    title: 'Mis pagos',
    description:
      'Consulta tus cuotas y comprobantes. La cuota incluye reservas ilimitadas según disponibilidad.',
  },
]

const adminSteps = [
  {
    title: 'Actividad del club',
    description: 'Analiza las reservas por día, hora, pista y socio para identificar la demanda.',
  },
  {
    title: 'Calendario del club',
    description: 'Consulta la disponibilidad y gestiona las reservas de los socios.',
  },
  {
    title: 'Gestión de socios',
    description: 'Da de alta socios, consulta sus fichas y administra accesos y roles.',
  },
  {
    title: 'Pagos y contabilidad',
    description:
      'Registra cuotas por periodo, consulta comprobantes y revisa los movimientos y resúmenes contables.',
  },
  {
    title: 'Configuración',
    description: 'Gestiona horarios, cierres, cuotas y datos fiscales del club.',
  },
]

export function DemoHelpDialog({
  open,
  onClose,
  role,
}: {
  open: boolean
  onClose: () => void
  role: Profile['role']
}) {
  const steps = role === 'admin' ? adminSteps : memberSteps
  return (
    <Modal open={open} onClose={onClose} title="Cómo funciona">
      <ol className="mb-5 grid list-none gap-4 p-0">
        {steps.map(({ title, description }, index) => (
          <li key={title} className="flex items-start gap-4">
            <span className="bg-accent-soft text-green-mid rounded-lg p-2.5 text-[13px] font-semibold">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <h3 className="text-sm">{title}</h3>
              <p className="text-muted mt-1 text-sm">{description}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-muted mb-4 text-sm">
        Desde el menú de usuario puedes cambiar de perfil, gestionar tu contraseña y cerrar sesión.
      </p>
      <p className="border-line bg-accent-soft text-muted rounded-lg border p-3.5 text-[13px] leading-relaxed">
        Los datos y contraseñas se guardan solo en este navegador; no hay seguridad de servidor ni
        cobros reales. No introduzcas datos personales reales.
      </p>
    </Modal>
  )
}
