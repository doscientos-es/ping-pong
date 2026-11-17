import { useState } from 'react'

import { useClubClock } from '../../app/club-clock'
import { useClub } from '../../app/club-context'
import { useCommand } from '../../shared/use-command'
import type { ClubSettings } from '../club/domain/model'
import { dateKey, hoursFor } from '../club/domain/rules'
import { sameSettings } from '../club/domain/settings'

export function useSettingsDraft() {
  const { view, gateway, selectedId } = useClub()
  const now = useClubClock()
  const settings = view!.settings
  const [editing, setEditing] = useState<{ base: ClubSettings; draft: ClubSettings } | null>(null)
  const [priceTexts, setPriceTexts] = useState<Record<string, string>>({})
  const draft = editing?.draft ?? settings
  const command = useCommand()
  const changed = !sameSettings(draft, settings)
  const conflicted = editing !== null && !sameSettings(editing.base, settings)
  const affected = view!.reservations.filter(
    (item) =>
      item.status === 'confirmed' &&
      item.date >= dateKey(now) &&
      !hoursFor(draft, item.date).includes(item.hour),
  ).length

  function update<K extends keyof ClubSettings>(key: K, value: ClubSettings[K]) {
    setEditing((previous) => ({
      base: previous?.base ?? settings,
      draft: { ...(previous?.draft ?? settings), [key]: value },
    }))
  }
  function changePrice(id: string, value: string) {
    setPriceTexts((previous) => ({ ...previous, [id]: value }))
    update(
      'plans',
      draft.plans.map((plan) =>
        plan.id === id ? { ...plan, priceCents: Math.round(Number(value) * 100) } : plan,
      ),
    )
  }
  function discard() {
    setEditing(null)
    setPriceTexts({})
  }
  async function save() {
    if (conflicted || !editing) return
    const saved = await command.run(async () => {
      await gateway.saveSettings(selectedId, draft, editing.base)
      return true
    }, 'Configuración guardada. Las reservas existentes se conservan.')
    if (saved) discard()
  }
  return {
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
  }
}
