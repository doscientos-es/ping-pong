import type { ReactNode } from 'react'

import { cn } from '../cn'
import { Button } from './button'

export function SegmentedControl<T extends string | number>({
  value,
  options,
  onChange,
  className,
}: {
  value: T
  options: { value: T; label: ReactNode }[]
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div
      className={cn('border-line bg-canvas inline-flex gap-0.5 rounded-lg border p-1', className)}
    >
      {options.map((option) => (
        <Button
          variant="ghost"
          key={option.value}
          aria-pressed={value === option.value}
          className="text-muted aria-pressed:text-green inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs whitespace-nowrap aria-pressed:bg-white aria-pressed:shadow-sm"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
