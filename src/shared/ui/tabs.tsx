import {
  Tabs as ClubTabs,
  TabsContent as ClubTabsContent,
  TabsList as ClubTabsList,
  TabsTrigger as ClubTabsTrigger,
} from '@doscientos/ui/tabs'
import type { ComponentProps } from 'react'

import { cn } from '../cn'

type StyledProps<T> = Omit<T, 'className'> & { className?: string }

export function Tabs({ className, ...props }: StyledProps<ComponentProps<typeof ClubTabs>>) {
  return <ClubTabs className={cn('min-w-0 gap-4', className)} {...props} />
}

export function TabsList({
  className,
  ...props
}: StyledProps<ComponentProps<typeof ClubTabsList>> & { 'aria-label': string }) {
  return (
    <ClubTabsList
      className={cn(
        'w-full max-w-full min-w-0 shrink-0 justify-start overflow-x-auto overscroll-x-contain',
        className,
      )}
      {...props}
    />
  )
}

export function TabsTrigger({
  className,
  ...props
}: StyledProps<ComponentProps<typeof ClubTabsTrigger>>) {
  return (
    <ClubTabsTrigger
      className={cn(
        'max-desktop:h-auto max-desktop:min-h-11 max-desktop:py-2 data-focus-visible:outline-green-mid shrink-0 whitespace-nowrap data-focus-visible:outline-2 data-focus-visible:-outline-offset-2',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({
  className,
  ...props
}: StyledProps<Omit<ComponentProps<typeof ClubTabsContent>, 'style' | 'shouldForceMount'>>) {
  return (
    <ClubTabsContent
      {...props}
      shouldForceMount
      className={cn('min-w-0 rounded-lg', className)}
      // Preserve drafts, but remove inactive controls from layout, focus and the accessibility tree.
      style={({ isInert }) => (isInert ? { display: 'none' } : undefined)}
    />
  )
}
