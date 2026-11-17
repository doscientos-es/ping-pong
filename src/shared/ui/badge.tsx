import type { ReactNode } from 'react'

import { cn } from '../cn'

const tones = {
  green: 'bg-[#edf4e6] text-[#386245]',
  orange: 'bg-[#fbf0df] text-[#96602c]',
  gray: 'bg-[#f0f2ec] text-[#737d72]',
  blue: 'bg-[#eaf0f6] text-[#45617d]',
}

export function Badge({
  children,
  tone = 'green',
  className,
}: {
  children: ReactNode
  tone?: keyof typeof tones
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs leading-[1.3] font-semibold whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
