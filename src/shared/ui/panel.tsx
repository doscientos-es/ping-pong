import type { ComponentProps, ReactNode } from 'react'

import { cn } from '../cn'

export function Panel({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn('border-line min-w-0 rounded-2xl border bg-white', className)}
      {...props}
    />
  )
}

export function SectionHeading({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div className="desktop:px-4 flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
      <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold">{title}</h2>
      {action}
    </div>
  )
}
