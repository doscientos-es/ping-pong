import type { AccountingData } from '../../accounting/domain/model'
import type { LocalCredential } from '../../session/domain/accounts'
import type { PaymentMethod, RecordedPaymentMethod } from './payment-methods'

export const COURTS = Array.from({ length: 8 }, (_, i) => i + 1)
export const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export interface Member {
  id: string
  name: string
  email: string
  phone: string
  dni?: string
  address?: string
  role: 'member' | 'admin'
  active: boolean
  number: string
  joinedAt: string
  planId: string
}

export interface Reservation {
  id: string
  memberId: string
  court: number
  date: string
  hour: number
  status: 'confirmed' | 'cancelled'
  createdAt: string
}

export interface Payment {
  id: string
  period: string
  memberId: string
  amountCents: number
  status: 'paid' | 'voided'
  paidAt: string
  voidedAt?: string
  method: PaymentMethod
  invoiceNumber: string
  customer: { name: string; email: string; dni?: string; address?: string }
  issuer?: FiscalIssuer
  vatBps?: number
  plan?: { id: string; name: string }
}

export interface OpeningDay {
  day: number
  intervals: { start: number; end: number }[]
}

export interface ClubPlan {
  id: string
  name: string
  priceCents: number
}

export interface FiscalIssuer {
  legalName: string
  nif: string
  address: string
}

export interface ClubSettings {
  plans: ClubPlan[]
  issuer?: FiscalIssuer
  weekly: OpeningDay[]
  closedDates: string[]
}

export interface ClubState {
  version: 2
  members: Member[]
  reservations: Reservation[]
  payments: Payment[]
  settings: ClubSettings
  accounting: AccountingData
  credentials: LocalCredential[]
}

export interface ClubView {
  actor: Member
  subscriptionActive: boolean
  members: Member[]
  reservations: Reservation[]
  payments: Payment[]
  settings: ClubSettings
  accounting?: AccountingData
}

export interface Profile {
  id: string
  name: string
  role: Member['role']
  active: boolean
  subscriptionActive: boolean
  passwordRequired: boolean
  mustChangePassword: boolean
}

export interface MemberInput {
  name: string
  email: string
  phone: string
  dni?: string
  address?: string
  planId?: string
}

export interface BookingInput {
  court: number
  date: string
  hour: number
}

export interface ManagedBookingInput extends BookingInput {
  memberId: string
}

export type SubscriptionInput = {
  memberId: string
  period: string
  quotedCents: number
  planId?: string
} & (
  | { method: RecordedPaymentMethod; paymentOutcome?: never }
  | { paymentOutcome: 'success' | 'failure'; method?: never }
)
