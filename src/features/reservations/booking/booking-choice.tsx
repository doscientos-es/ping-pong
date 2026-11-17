import type { ComponentProps } from 'react'

import { cn } from '../../../shared/cn'
import { Button } from '../../../shared/ui/button'

export function BookingChoice({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      className={cn(
        'group border-line enabled:hover:border-green-mid enabled:hover:ring-green-mid disabled:bg-canvas aria-pressed:border-green-mid aria-pressed:bg-accent-soft aria-pressed:ring-green-mid relative grid h-auto min-h-16 min-w-0 content-center gap-1 rounded-[10px] border bg-white px-2.5 py-2.5 text-left enabled:hover:ring-1 disabled:border-dashed disabled:opacity-65 aria-pressed:ring-1',
        className,
      )}
      {...props}
    />
  )
}
