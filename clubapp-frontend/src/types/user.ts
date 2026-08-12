import type { UserRole } from './auth';

// Item de la lista de usuarios de gestión (GET /api/users)
export interface UserListItem {
  id: number;
  badgeNum: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  dni: string;
  phone: string;
  birthDate?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface RoleOption {
  value: UserRole;
  label: string;
  badgeClasses: string;
  // Valor numérico equivalente al enum UserRole del backend (.NET)
  numeric: number;
}

// IMPORTANTE: el orden coincide con el enum `UserRole` del backend:
// MEMBER=0, TEACHER=1, ADMIN=2, SUPERADMIN=3
export const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'MEMBER',
    label: 'Socio',
    badgeClasses: 'text-slate-200 bg-slate-500/10 border-slate-500/30',
    numeric: 0,
  },
  {
    value: 'TEACHER',
    label: 'Profesor',
    badgeClasses: 'text-sky-300 bg-sky-500/10 border-sky-500/20',
    numeric: 1,
  },
  {
    value: 'ADMIN',
    label: 'Admin',
    badgeClasses: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    numeric: 2,
  },
  {
    value: 'SUPERADMIN',
    label: 'Super Admin',
    badgeClasses: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    numeric: 3,
  },
];

export const getRoleConfig = (role: UserRole): RoleOption =>
  ROLE_OPTIONS.find((r) => r.value === role) ?? ROLE_OPTIONS[0];
