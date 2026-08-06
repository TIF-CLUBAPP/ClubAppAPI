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
  name?: string;
  fullName?: string;
  email?: string;
  role?: UserRole;
}