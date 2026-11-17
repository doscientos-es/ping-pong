import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function Stat({
  label,
  value,
  icon: Icon,
  note,
}: {
  label: string
  value: ReactNode
  icon: LucideIcon
  note?: string
}) {
  return (
    <div className="border-line desktop:flex desktop:items-center desktop:gap-2.5 desktop:p-3 min-w-0 rounded-xl border bg-white p-2.5">
      <span className="bg-accent-soft text-green-mid desktop:grid hidden size-8 shrink-0 place-items-center rounded-lg">
        <Icon size={21} strokeWidth={1.7} className="max-desktop:size-4" />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-muted desktop:order-none desktop:min-h-0 desktop:text-xs order-1 min-h-8 text-[11px] leading-4">
          {label}
        </span>
        <strong className="font-heading text-xl tracking-tight break-words tabular-nums">
          {value}
        </strong>
        {note && <span className="text-muted wide:inline hidden text-xs">{note}</span>}
      </div>
    </div>
  )
}
