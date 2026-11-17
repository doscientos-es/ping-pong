import type { ClubSettings } from './model'

function settingsKey(settings: ClubSettings): string {
  return JSON.stringify([
    settings.plans.map(({ id, name, priceCents }) => [id, name, priceCents]),
    [settings.issuer?.legalName ?? '', settings.issuer?.nif ?? '', settings.issuer?.address ?? ''],
    [...settings.closedDates].sort(),
    [...settings.weekly]
      .sort((a, b) => a.day - b.day)
      .map(({ day, intervals }) => [
        day,
        [...intervals].sort((a, b) => a.start - b.start).map(({ start, end }) => [start, end]),
      ]),
  ])
}

export function sameSettings(left: ClubSettings, right: ClubSettings): boolean {
  return settingsKey(left) === settingsKey(right)
}
