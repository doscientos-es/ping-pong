import { Modal } from '../../shared/ui'

const steps = [
  {
    title: 'Perfiles',
    description:
      'Cambia de perfil desde tu avatar. Prueba socios con cuota al día, Hugo con cuota pendiente o administración.',
  },
  {
    title: 'Cuota mensual',
    description:
      'La suscripción mensual al club incluye todas las reservas que quieras, según disponibilidad. Actívala con un pago simulado.',
  },
  {
    title: 'Reservas',
    description:
      'Elige día, hora y pista libre y confirma tu reserva, sin pagar nada más. Puedes cancelar antes de empezar.',
  },
  {
    title: 'Administración',
    description:
      'Como administrador, cambia horarios y cuota, gestiona socios y registra pagos por periodo.',
  },
]

export function DemoHelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Ayuda de la demo">
      <ol className="mb-6 grid list-none gap-6 p-0">
        {steps.map(({ title, description }, index) => (
          <li key={title} className="flex items-start gap-4">
            <span className="bg-accent-soft text-green-mid rounded-lg p-2.5 text-[13px] font-semibold">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <h3 className="text-sm">{title}</h3>
              <p className="text-muted mt-2 text-sm">{description}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="border-line bg-accent-soft text-muted rounded-lg border p-3.5 text-[13px] leading-relaxed">
        Datos y contraseñas locales solo en este navegador. Sin seguridad de servidor ni cobros
        reales. No introduzcas datos personales reales.
      </p>
    </Modal>
  )
}
