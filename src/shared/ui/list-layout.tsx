import { Search } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

export function StatsGrid({ children }: { children: ReactNode }) {
  return <div className="desktop:mb-4 desktop:gap-3 mb-3 grid grid-cols-3 gap-2">{children}</div>
}

export function ListToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="border-line desktop:px-4 flex flex-wrap items-center justify-between gap-2 border-b px-3 pb-3">
      {children}
    </div>
  )
}

export function SearchField(props: Omit<ComponentProps<'input'>, 'className' | 'type'>) {
  return (
    <label className="border-line text-muted focus-within:outline-green-mid desktop:max-w-[420px] desktop:min-w-[220px] desktop:flex-1 flex min-h-10 w-full items-center gap-2.5 rounded-lg border px-3 focus-within:outline-2 focus-within:outline-offset-2">
      <Search size={18} />
      <input
        type="search"
        className="min-h-10 w-full border-0 bg-transparent p-0 outline-none focus-visible:outline-none"
        {...props}
      />
    </label>
  )
}

export function ListFooter({ children }: { children: ReactNode }) {
  return (
    <div className="text-muted desktop:px-4 flex flex-wrap justify-between gap-2 px-3 py-3 text-xs">
      {children}
    </div>
  )
}
