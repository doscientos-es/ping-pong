import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function DetailList({
  items,
}: {
  items: { label: string; value: ReactNode; icon?: LucideIcon }[]
}) {
  return (
    <dl className="desktop:gap-4 m-0 grid gap-3">
      {items.map(({ label, value, icon: Icon }) => (
        <div key={label} className="text-green-mid flex items-start gap-3">
          {Icon && <Icon size={20} className="mt-0.5 shrink-0" />}
          <div className="min-w-0 flex-1">
            <dt className="text-muted text-[13px]">{label}</dt>
            <dd className="mx-0 mt-1 text-sm font-semibold break-words">{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  )
}
