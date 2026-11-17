import type { ReactNode } from 'react'

export function PageHeading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="desktop:flex-row desktop:items-center desktop:justify-between flex min-w-0 flex-col items-start gap-2 pb-3">
      <h1 className="desktop:text-xl min-w-0 text-lg leading-snug font-semibold tracking-tight">
        {title}
      </h1>
      {action && (
        <div className="desktop:w-auto w-full [&>a]:w-full [&>button]:w-full">{action}</div>
      )}
    </header>
  )
}
