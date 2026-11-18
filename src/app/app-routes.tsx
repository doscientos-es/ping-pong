import {
  BarChart3,
  CalendarDays,
  CreditCard,
  History,
  ListChecks,
  Settings2,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import type { Member } from '../features/club/domain/model'
import { MemberProfilePage } from '../features/members/member-profile-page'
import { MembersPage } from '../features/members/members-page'
import { PaymentsPage } from '../features/payments/payments-page'
import { CalendarPage } from '../features/reservations/calendar/calendar-page'
import { MyReservationsPage } from '../features/reservations/my-reservations-page'
import { AccountPage } from '../features/session/account-page'
import { SettingsPage } from '../features/settings/settings-page'

const AccountingPage = lazy(() =>
  import('../features/accounting/accounting-page').then((module) => ({
    default: module.AccountingPage,
  })),
)
const ActivityPage = lazy(() =>
  import('../features/activity/activity-page').then((module) => ({ default: module.ActivityPage })),
)

type Role = Member['role']
export interface NavigationItem {
  to: string
  label: string
  mobile: string
  Icon: LucideIcon
}
interface AppRoute extends NavigationItem {
  role?: Role
  element: ReactNode
}

const routes: AppRoute[] = [
  {
    to: '/actividad',
    label: 'Actividad del club',
    mobile: 'Actividad',
    Icon: BarChart3,
    role: 'admin',
    element: (
      <Suspense fallback={<p role="status">Cargando actividad…</p>}>
        <ActivityPage />
      </Suspense>
    ),
  },
  {
    to: '/contabilidad',
    label: 'Contabilidad',
    mobile: 'Cuentas',
    Icon: CreditCard,
    role: 'admin',
    element: (
      <Suspense fallback={<p role="status">Cargando contabilidad…</p>}>
        <AccountingPage />
      </Suspense>
    ),
  },
  {
    to: '/',
    label: 'Reservar pista',
    mobile: 'Reservar',
    Icon: CalendarDays,
    element: <CalendarPage />,
  },
  {
    to: '/reservas',
    label: 'Mis reservas',
    mobile: 'Reservas',
    Icon: ListChecks,
    role: 'member',
    element: <MyReservationsPage />,
  },
  {
    to: '/historial',
    label: 'Historial de partidas',
    mobile: 'Historial',
    Icon: History,
    role: 'member',
    element: <MyReservationsPage history />,
  },
  {
    to: '/socios',
    label: 'Gestión de socios',
    mobile: 'Socios',
    Icon: Users,
    role: 'admin',
    element: <MembersPage />,
  },
  {
    to: '/pagos',
    label: 'Mis pagos',
    mobile: 'Pagos',
    Icon: CreditCard,
    element: <PaymentsPage />,
  },
  {
    to: '/configuracion',
    label: 'Configuración',
    mobile: 'Ajustes',
    Icon: Settings2,
    role: 'admin',
    element: <SettingsPage />,
  },
]

export function navigationFor(role: Role): NavigationItem[] {
  return routes
    .filter((route) => !route.role || route.role === role)
    .map((route) => {
      if (role !== 'admin') return route
      if (route.to === '/') return { ...route, label: 'Calendario del club', mobile: 'Calendario' }
      if (route.to === '/pagos') return { ...route, label: 'Pagos y comprobantes' }
      return route
    })
}

export function AppRoutes({ role }: { role: Role }) {
  return (
    <Routes>
      {routes.map(({ to, role: requiredRole, element }) => (
        <Route
          key={to}
          path={to}
          element={!requiredRole || role === requiredRole ? element : <Navigate to="/" replace />}
        />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/cuenta" element={<AccountPage />} />
      <Route
        path="/socios/:id"
        element={role === 'admin' ? <MemberProfilePage /> : <Navigate to="/" replace />}
      />
    </Routes>
  )
}
