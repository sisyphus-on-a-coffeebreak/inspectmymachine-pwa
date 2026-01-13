import { describe, it, expect } from 'vitest';
import { hasCapability } from '../users';
import type { User } from '../users';

describe('hasCapability', () => {
  it('should return true for super_admin with any capability', () => {
    const user: User = { 
      id: 1, 
      employee_id: 'EMP001',
      name: 'Super Admin',
      email: 'admin@test.com',
      role: 'super_admin',
      capabilities: null,
      yard_id: null,
      is_active: true,
      last_login_at: null,
    };
    expect(hasCapability(user, 'user_management', 'delete')).toBe(true);
    expect(hasCapability(user, 'gate_pass', 'create')).toBe(true);
    expect(hasCapability(user, 'expense', 'approve')).toBe(true);
  });

  it('should return true when user has custom capability', () => {
    const user: User = { 
      id: 2, 
      employee_id: 'EMP002',
      name: 'Guard User',
      email: 'guard@test.com',
      role: 'guard',
      capabilities: { 
        expense: ['delete'] 
      },
      yard_id: 'yard1',
      is_active: true,
      last_login_at: null,
    };
    expect(hasCapability(user, 'expense', 'delete')).toBe(true);
  });

  it('should return true when role has default capability', () => {
    const user: User = { 
      id: 3, 
      employee_id: 'EMP003',
      name: 'Clerk User',
      email: 'clerk@test.com',
      role: 'clerk',
      capabilities: null,
      yard_id: null,
      is_active: true,
      last_login_at: null,
    };
    // Clerk role has gate_pass.create by default
    expect(hasCapability(user, 'gate_pass', 'create')).toBe(true);
    expect(hasCapability(user, 'gate_pass', 'read')).toBe(true);
  });

  it('should return false when user lacks capability', () => {
    const user: User = { 
      id: 4, 
      employee_id: 'EMP004',
      name: 'Clerk User',
      email: 'clerk2@test.com',
      role: 'clerk',
      capabilities: null,
      yard_id: null,
      is_active: true,
      last_login_at: null,
    };
    // Clerk role does not have user_management.delete
    expect(hasCapability(user, 'user_management', 'delete')).toBe(false);
  });

  it('should return false for null user', () => {
    expect(hasCapability(null, 'expense', 'read')).toBe(false);
    expect(hasCapability(null, 'gate_pass', 'create')).toBe(false);
  });

  it('should return true for admin with user_management.read', () => {
    const user: User = { 
      id: 5, 
      employee_id: 'EMP005',
      name: 'Admin User',
      email: 'admin2@test.com',
      role: 'admin',
      capabilities: null,
      yard_id: null,
      is_active: true,
      last_login_at: null,
    };
    expect(hasCapability(user, 'user_management', 'read')).toBe(true);
  });

  it('should return false for admin without user_management.delete', () => {
    const user: User = { 
      id: 6, 
      employee_id: 'EMP006',
      name: 'Admin User',
      email: 'admin3@test.com',
      role: 'admin',
      capabilities: null,
      yard_id: null,
      is_active: true,
      last_login_at: null,
    };
    // Admin role does not have user_management.delete
    expect(hasCapability(user, 'user_management', 'delete')).toBe(false);
  });
});




