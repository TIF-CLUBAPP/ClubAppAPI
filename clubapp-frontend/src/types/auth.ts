export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'TEACHER' | 'MEMBER';

export interface AuthenticationRequest {
  email: string;
  password: string;
}

export interface AuthenticationResponse {
  token: string;
  user?: User;
}

export interface User {
  id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  role?: UserRole;
  /** Indica si el usuario es Socio del club (abona cuota social / tiene membresía). */
  isSocio?: boolean;
  tipoProfesor?: 'CLUB' | 'INDEPENDIENTE';
  dni?: string;
  phone?: string;
  birthDate?: string; // ISO date string
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  dni: string;
  phone: string;
  birthDate: string; // ISO date
}