import { NavLink } from 'react-router-dom'

import { cn } from '../../shared/cn'
import type { NavigationItem } from '../app-routes'

export function ClubNavigation({
  items,
  mobile = false,
}: {
  items: NavigationItem[]
  mobile?: boolean
}) {
  return (
    <nav
      aria-label={mobile ? 'Navegación móvil' : 'Navegación principal'}
      className={
        mobile
          ? 'border-line bg-surface desktop:hidden fixed inset-x-0 bottom-0 z-40 flex h-[var(--mobile-nav-height)] gap-1 overflow-x-auto border-t px-2 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))]'
          : 'grid min-w-0 gap-1.5'
      }
    >
      {items.map(({ to, label, mobile: shortLabel, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          title={mobile ? undefined : label}
          className={({ isActive }) =>
            cn(
              mobile
                ? 'text-muted grid min-h-11 min-w-16 flex-1 content-center justify-items-center gap-1 rounded-lg px-1 py-1 text-[11px]'
                : 'text-muted flex min-h-11 min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-[13px] leading-5 font-medium focus-visible:outline-offset-[-3px]',
              isActive
                ? 'bg-accent-soft text-green font-semibold'
                : !mobile && 'hover:bg-canvas hover:text-green',
              isActive && !mobile && 'ring-green/10 ring-1 ring-inset',
            )
          }
        >
          <Icon size={mobile ? 21 : 20} strokeWidth={1.7} aria-hidden="true" className="shrink-0" />
          <span className={mobile ? 'whitespace-nowrap' : 'min-w-0 flex-1 truncate'}>
            {mobile ? shortLabel : label}
          </span>
        </NavLink>
      ))}
    </nav>
  )
}
