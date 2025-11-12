// Auth types
import type { UserCapabilities } from '@/lib/users';

export interface User {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "inspector" | "supervisor" | "guard" | "clerk";
  capabilities?: UserCapabilities; // Capability matrix (module-level + CRUD flags)
  yard_id: string | null;
  is_active: boolean;
  last_login_at: string | null;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (employeeId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchJson: <T = unknown>(url: string, options?: RequestInit) => Promise<T>;
}

export interface ApiErrorResponse {
  message?: string;
}