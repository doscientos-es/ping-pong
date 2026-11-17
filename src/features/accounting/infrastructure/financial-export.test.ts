import { describe, expect, it } from 'vitest'
import { csvCell, ledgerCsv, summaryCsv } from './financial-export'
import type { FinancialRow } from '../domain/model'

describe('exportación financiera', () => {
  it('escapa separadores, comillas, saltos de línea y fórmulas de hojas de cálculo', () => {
    expect(csvCell('A;"B"\nC')).toBe('"A;""B""\nC"')
    for (const text of ['=1+1', '+42', '-2+3', '@SUM(A1)', ' \t=1+1'])
      expect(csvCell(text)).toBe(`"'${text}"`)
    expect(csvCell(-100)).toBe('"-100"')
  })
  it('exporta el periodo completo y el resumen sin incluir credenciales', () => {
    const rows: FinancialRow[] = [
      {
        id: 'one',
        source: 'manual',
        kind: 'income',
        documentType: 'invoice',
        date: '2026-11-03',
        description: 'Prueba',
        category: 'Otros',
        counterparty: '',
        reference: 'REF-1',
        grossCents: 12100,
        vatBps: 2100,
        deductible: false,
        status: 'pending',
      },
    ]
    expect(ledgerCsv(rows, '2026-11-01', '2026-11-30')).toContain('121,00')
    expect(ledgerCsv(rows, '2026-12-01', '2026-12-31')).not.toContain('REF-1')
    expect(summaryCsv(rows, '2026-11-01', '2026-11-30', 1000)).toContain(
      '"Resultado neto";"100,00"',
    )
    expect(summaryCsv(rows, '2026-11-01', '2026-11-30', 1000)).toContain('SIN VALIDEZ FISCAL')
  })
})
