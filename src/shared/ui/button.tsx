import {
  Button as ClubButton,
  LinkButton,
  type ButtonProps,
  type LinkButtonProps,
} from '@doscientos/ui/button'
import { IconButton as ClubIconButton, type IconButtonProps } from '@doscientos/ui/icon-button'
import { Tooltip, type TooltipProps } from '@doscientos/ui/tooltip'
import type { MouseEvent } from 'react'
import { useHref, useLinkClickHandler, type LinkProps } from 'react-router-dom'

import { cn } from '../cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
const variants = {
  primary: 'default',
  secondary: 'outline',
  ghost: 'ghost',
  danger: 'destructive',
} as const

type ClubButtonProps = Omit<ButtonProps, 'variant'> & {
  variant?: ButtonVariant | ButtonProps['variant']
  tooltip?: TooltipProps['label']
}

function uiVariant(variant: ClubButtonProps['variant']) {
  return variant && variant in variants
    ? variants[variant as ButtonVariant]
    : (variant as ButtonProps['variant'])
}

export function Button({ variant = 'primary', className, tooltip, ...props }: ClubButtonProps) {
  const button = (
    <ClubButton
      variant={uiVariant(variant)}
      className={cn(
        'max-desktop:h-auto max-desktop:min-h-11 max-desktop:whitespace-normal',
        className,
      )}
      {...props}
    />
  )
  return tooltip ? <Tooltip label={tooltip}>{button}</Tooltip> : button
}

export function ButtonLink({
  variant = 'primary',
  className,
  to,
  replace,
  state,
  target,
  relative,
  preventScrollReset,
  children,
  onClick,
  ...props
}: Omit<LinkButtonProps, 'href' | 'variant'> &
  Pick<LinkProps, 'to' | 'replace' | 'state' | 'relative' | 'preventScrollReset'> & {
    variant?: ButtonVariant
  }) {
  const href = useHref(to, { relative })
  const navigate = useLinkClickHandler(to, { replace, state, target, relative, preventScrollReset })
  return (
    <LinkButton
      href={href}
      target={target}
      variant={variants[variant]}
      className={cn(
        'max-desktop:h-auto max-desktop:min-h-11 max-desktop:whitespace-normal',
        className,
      )}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) navigate(event as MouseEvent<HTMLAnchorElement>)
      }}
      {...props}
    >
      {children}
    </LinkButton>
  )
}

export function IconButton({ className, variant = 'ghost', ...props }: IconButtonProps) {
  return (
    <ClubIconButton variant={variant} className={cn('max-desktop:size-11', className)} {...props} />
  )
}
