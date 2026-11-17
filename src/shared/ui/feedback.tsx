import { Check, ArrowUpRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '../cn'

export function Empty({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon
  title: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="grid justify-items-center gap-2 px-4 py-6 text-center">
      <span className="border-line bg-canvas text-green-mid grid size-10 place-items-center rounded-xl border">
        <Icon size={22} strokeWidth={1.5} />
      </span>
      <h3 className="text-sm">{title}</h3>
      <p className="text-muted max-w-[340px] text-sm">{children}</p>
      {action}
    </div>
  )
}

export function InlineError({ children, className }: { children: ReactNode; className?: string }) {
  return children ? (
    <div
      role="alert"
      className={cn(
        'rounded-lg border border-[#f0d5c6] bg-[#fff4ec] p-3 text-[13px] leading-relaxed text-[#a55f40]',
        className,
      )}
    >
      {children}
    </div>
  ) : null
}

export function Notice({ children, warning = false, className, ...props }: ComponentPropsNotice) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3.5 text-[13px] leading-relaxed [&_strong]:block [&_svg]:mt-0.5',
        warning
          ? 'border-[#efdfbd] bg-[#fdf6e9] text-[#9b7a44]'
          : 'border-line bg-accent-soft text-green-mid',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
type ComponentPropsNotice = import('react').ComponentProps<'div'> & { warning?: boolean }

export function SuccessMark() {
  return (
    <span className="grid size-[77px] place-items-center rounded-full border-8 border-[#f3f8e9] bg-[#ebf4d8] text-[#779b4c]">
      <Check size={32} />
    </span>
  )
}
export function ArrowLink() {
  return <ArrowUpRight size={17} aria-hidden="true" />
}
