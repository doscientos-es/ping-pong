import { useMemo, useState } from 'react'

export const pageSizes = [12, 24, 48] as const

export function usePagination<T>(items: T[], resetKey: string) {
  const [selection, setSelection] = useState({ key: resetKey, page: 1, pageSize: 12 })
  const { pageSize } = selection
  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page = selection.key === resetKey ? Math.min(selection.page, pageCount) : 1

  // Reset before rendering children; data removal must never leave an empty/stale page.
  if (selection.key !== resetKey || selection.page !== page) {
    setSelection({ ...selection, key: resetKey, page })
  }

  const offset = (page - 1) * pageSize
  const visibleItems = useMemo(
    () => items.slice(offset, offset + pageSize),
    [items, offset, pageSize],
  )
  return {
    items: visibleItems,
    total,
    page,
    pageSize,
    pageCount,
    start: total ? offset + 1 : 0,
    end: Math.min(offset + pageSize, total),
    setPage: (next: number) =>
      setSelection({ key: resetKey, page: Math.max(1, Math.min(next, pageCount)), pageSize }),
    setPageSize: (next: number) => {
      if (pageSizes.some((size) => size === next)) {
        setSelection({ key: resetKey, page: 1, pageSize: next })
      }
    },
  }
}

export type PaginationState = Omit<ReturnType<typeof usePagination>, 'items'>
