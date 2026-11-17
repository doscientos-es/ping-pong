import { twMerge } from 'tailwind-merge'

export function cn(...values: (string | false | null | undefined)[]) {
  return twMerge(values.filter(Boolean).join(' '))
}
