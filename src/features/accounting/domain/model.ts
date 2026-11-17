export interface LedgerInput {
  kind: 'income' | 'expense'
  documentType: 'invoice' | 'receipt' | 'other'
  date: string
  description: string
  category: string
  counterparty: string
  reference: string
  grossCents: number
  vatBps: number
  deductible: boolean
  status: 'paid' | 'pending'
  paidDate?: string
}

export interface LedgerEntry extends Omit<LedgerInput, 'status'> {
  id: string
  status: 'paid' | 'pending' | 'voided'
  createdAt: string
  revision: string
}

export interface AccountingData {
  entries: LedgerEntry[]
  openingBalanceCents: number
  subscriptionVatBps: number
}

export interface FinancialRow extends Omit<LedgerEntry, 'revision' | 'createdAt'> {
  source: 'subscription' | 'manual'
}
