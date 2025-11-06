import { useAuthStore } from '../stores/auth.store';

export type RoleName =
  | 'ADMIN'
  | 'WAREHOUSE_MANAGER'
  | 'SALES_OFFICER'
  | 'ACCOUNTANT'
  | 'RECOVERY_AGENT';

export function usePermission() {
  const user = useAuthStore((state) => state.user);

  const hasRole = (allowedRoles: RoleName[]): boolean => {
    if (!user || !user.roleId) return false;
    // Note: In MVP, we don't have role name in JWT, so we'll need to enhance this
    // For now, we check against roleId or implement a role name fetch
    return true; // Simplified for MVP
  };

  const isAdmin = (): boolean => {
    // This should be enhanced to check actual role name
    return user?.roleId === 'admin-role-id'; // Placeholder
  };

  return {
    hasRole,
    isAdmin,
    user,
  };
}
