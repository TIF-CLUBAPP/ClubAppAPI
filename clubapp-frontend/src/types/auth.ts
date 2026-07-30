export interface AuthenticationRequest {
  email: string;
  password: string;
}

export interface AuthenticationResponse {
  token: string;
}

export interface User {
  userName?: string;
  email?: string;
  role?: string;
}