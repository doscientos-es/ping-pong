import { pageSizes, type PaginationState } from '../use-pagination'
import { Button } from './button'

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
      className="border-line desktop:px-4 flex flex-wrap items-center justify-between gap-3 border-t px-3 py-3"
    >
      <p role="status" aria-atomic="true" className="text-muted text-xs">
        {start}–{end} de {total} {label} · Página {page} de {pageCount}
      </p>
      <label className="text-muted flex items-center gap-2 text-xs">
        Por página
        <select
          aria-label="Resultados por página"
          aria-controls={controls}
          className="min-h-11"
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
      <div className="grid w-full grid-cols-4 gap-1 sm:w-auto">
        {[
          { text: 'Primera', target: 1, disabled: page === 1 },
          { text: 'Anterior', target: page - 1, disabled: page === 1 },
          { text: 'Siguiente', target: page + 1, disabled: page === pageCount },
          { text: 'Última', target: pageCount, disabled: page === pageCount },
        ].map(({ text, target, disabled }) => (
          <Button
            key={text}
            variant="secondary"
            className="min-w-0 px-2 text-xs"
            aria-controls={controls}
            disabled={disabled}
            onClick={() => setPage(target)}
          >
            {text}
          </Button>
        ))}
      </div>
    </nav>
  )
}
