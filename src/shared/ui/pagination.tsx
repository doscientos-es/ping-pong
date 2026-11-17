import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

import { pageSizes, type PaginationState } from '../use-pagination'
import { IconButton } from './button'

export function Pagination({
  pagination,
  label,
  controls,
}: {
  pagination: PaginationState
  label: string
  controls: string
}) {
  const { total, start, end, page, pageSize, pageCount, setPage, setPageSize } = pagination
  return (
    <nav
      aria-label={`Paginación de ${label}`}
      className="border-line desktop:px-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t px-3 py-2"
    >
      <p role="status" aria-atomic="true" className="text-muted text-xs">
        {start}–{end} de {total} {label} · Página {page} de {pageCount}
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:ml-auto">
        <label className="text-muted flex items-center gap-2 text-xs">
          Por página
          <select
            aria-label="Resultados por página"
            aria-controls={controls}
            className="desktop:min-h-8 desktop:px-2 desktop:py-1 min-h-11"
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center">
          {[
            { text: 'Primera', icon: ChevronsLeft, target: 1, disabled: page === 1 },
            { text: 'Anterior', icon: ChevronLeft, target: page - 1, disabled: page === 1 },
            {
              text: 'Siguiente',
              icon: ChevronRight,
              target: page + 1,
              disabled: page === pageCount,
            },
            {
              text: 'Última',
              icon: ChevronsRight,
              target: pageCount,
              disabled: page === pageCount,
            },
          ].map(({ text, icon: Icon, target, disabled }) => (
            <IconButton
              key={text}
              label={text}
              aria-controls={controls}
              isDisabled={disabled}
              onPress={() => setPage(target)}
            >
              <Icon aria-hidden="true" />
            </IconButton>
          ))}
        </div>
      </div>
    </nav>
  )
}
