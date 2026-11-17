import { Avatar as ClubAvatar, AvatarFallback, type AvatarProps } from '@doscientos/ui/avatar'
import type { ReactNode } from 'react'

import { cn } from '../cn'

const tones = [
  'bg-[#e6edda] text-[#53703e]',
  'bg-[#f6e9d8] text-[#937045]',
  'bg-[#e2eaf1] text-[#53758f]',
  'bg-[#eee5ef] text-[#8c6a92]',
]

export function Avatar({
  children,
  index = 0,
  large = false,
  small = false,
  className,
  size,
  ...props
}: {
  children: ReactNode
  index?: number
  large?: boolean
  small?: boolean
} & AvatarProps) {
  return (
    <ClubAvatar
      size={size ?? (large ? 'lg' : small ? 'sm' : 'default')}
      className={cn(
        'border-[3px] border-white',
        tones[index % tones.length],
        large ? 'size-14 text-xl' : small ? 'size-[33px] text-[10px]' : 'size-9 text-[11px]',
        className,
      )}
      {...props}
    >
      <AvatarFallback>{children}</AvatarFallback>
    </ClubAvatar>
  )
}
