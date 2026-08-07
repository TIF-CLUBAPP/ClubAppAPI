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