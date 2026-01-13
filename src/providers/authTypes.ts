// Auth types
// Re-export User type from users.ts to ensure consistency
// The User type now includes enhanced_capabilities support
export type { User, UserCapabilities } from '@/lib/users';

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