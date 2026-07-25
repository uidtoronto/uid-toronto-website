import type { UserRole } from '../types';

export function getUserRole(appMetadata: Record<string, unknown> | undefined): UserRole {
  return appMetadata?.role === 'super_admin' ? 'super_admin' : 'member';
}

export function isSuperAdmin(appMetadata: Record<string, unknown> | undefined): boolean {
  return getUserRole(appMetadata) === 'super_admin';
}
