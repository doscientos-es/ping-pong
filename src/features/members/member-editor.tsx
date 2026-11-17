import { Check } from 'lucide-react'

import { useClub } from '../../app/club-context'
import { Button, InlineError, Modal, useCommand } from '../../shared/ui'
import { MemberFields, readMemberForm } from './member-fields'

export function MemberEditor({ onClose }: { onClose: () => void }) {
  const { gateway, selectedId } = useClub()
  const command = useCommand()

  return (
    <Modal open onClose={onClose} title="Nuevo socio">
      <form
        className="grid gap-5"
        onSubmit={async (event) => {
          event.preventDefault()
          const input = readMemberForm(event.currentTarget)
          const result = await command.run(
            () => gateway.saveMember(selectedId, input),
            'Socio creado. Ya aparece en el selector de perfiles.',
          )
          if (result) onClose()
        }}
      >
        <MemberFields />
        <InlineError>{command.error}</InlineError>
        <Button type="submit" disabled={command.busy}>
          <Check size={17} />
          {command.busy ? 'Guardando…' : 'Crear socio'}
        </Button>
      </form>
    </Modal>
  )
}
