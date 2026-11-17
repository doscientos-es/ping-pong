import { z } from 'zod'

import type { ClubState } from '../domain/model'
import { LEGACY_PLAN_ID, LEGACY_PLAN_NAME, requirePlan } from '../domain/plans'
import { validateSettings } from '../domain/rules'

const issuer = z.object({
  legalName: z.string().max(160),
  nif: z.string().max(20),
  address: z.string().max(300),
})

const member = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  dni: z.string().max(20).optional(),
  address: z.string().max(300).optional(),
  role: z.enum(['member', 'admin']),
  active: z.boolean(),
  number: z.string(),
  joinedAt: z.string(),
  planId: z.string().optional(),
})

const schema = z.object({
  version: z.literal(2),
  members: z.array(member),
  reservations: z.array(
    z.object({
      id: z.string(),
      memberId: z.string(),
      court: z.number().int().min(1).max(8),
      date: z.iso.date(),
      hour: z.number().int().min(0).max(23),
      status: z.enum(['confirmed', 'cancelled']),
      createdAt: z.string(),
    }),
  ),
  payments: z.array(
    z.object({
      id: z.string(),
      memberId: z.string(),
      period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
      amountCents: z.number().int().positive(),
      status: z.enum(['paid', 'voided']),
      paidAt: z.string(),
      voidedAt: z.string().optional(),
      method: z.enum(['demo', 'manual']),
      invoiceNumber: z.string(),
      customer: z.object({
        name: z.string(),
        email: z.string(),
        dni: z.string().max(20).optional(),
        address: z.string().max(300).optional(),
      }),
      issuer: issuer.optional(),
      vatBps: z.number().int().min(0).max(10000).optional(),
      plan: z.object({ id: z.string(), name: z.string() }).optional(),
    }),
  ),
  settings: z.object({
    issuer: issuer.optional(),
    priceCents: z.number().int().optional(),
    plans: z
      .array(z.object({ id: z.string(), name: z.string(), priceCents: z.number().int() }))
      .optional(),
    closedDates: z.array(z.iso.date()),
    weekly: z.array(
      z.object({
        day: z.number().int(),
        intervals: z.array(z.object({ start: z.number().int(), end: z.number().int() })),
      }),
    ),
  }),
  accounting: z
    .object({
      openingBalanceCents: z.number().int().min(-9999999999).max(9999999999),
      subscriptionVatBps: z.number().int().min(0).max(10000),
      entries: z.array(
        z.object({
          id: z.string(),
          kind: z.enum(['income', 'expense']),
          documentType: z.enum(['invoice', 'receipt', 'other']),
          date: z.iso.date(),
          description: z.string(),
          category: z.string(),
          counterparty: z.string(),
          reference: z.string(),
          grossCents: z.number().int().positive().max(9999999999),
          vatBps: z.number().int().min(0).max(10000),
          deductible: z.boolean(),
          status: z.enum(['paid', 'pending', 'voided']),
          paidDate: z.iso.date().optional(),
          createdAt: z.string(),
          revision: z.string(),
        }),
      ),
    })
    .default({ entries: [], openingBalanceCents: 0, subscriptionVatBps: 0 }),
  credentials: z
    .array(
      z.object({
        memberId: z.string(),
        version: z.string(),
        temporary: z.boolean(),
        password: z.object({
          salt: z.string().regex(/^[a-f0-9]{32}$/),
          digest: z.string().regex(/^[a-f0-9]{64}$/),
        }),
        recovery: z
          .object({
            expiresAt: z.number(),
            password: z.object({
              salt: z.string().regex(/^[a-f0-9]{32}$/),
              digest: z.string().regex(/^[a-f0-9]{64}$/),
            }),
          })
          .optional(),
      }),
    )
    .default([]),
})

export function decodeState(raw: string): ClubState {
  const parsed = schema.safeParse(JSON.parse(raw))
  if (!parsed.success)
    throw new Error(
      'Los datos locales no son compatibles. No se han sobrescrito. Usa otro perfil de navegador o recupera una copia.',
    )
  const { priceCents, plans, ...schedule } = parsed.data.settings
  const legacy = plans === undefined && priceCents !== undefined
  const settings = {
    ...schedule,
    plans:
      plans ??
      (legacy ? [{ id: LEGACY_PLAN_ID, name: LEGACY_PLAN_NAME, priceCents: priceCents! }] : []),
  }
  validateSettings(settings)
  const members = parsed.data.members.map((member) => ({
    ...member,
    planId: requirePlan(settings, member.planId ?? (legacy ? LEGACY_PLAN_ID : '')).id,
  }))
  return { ...parsed.data, settings, members }
}
