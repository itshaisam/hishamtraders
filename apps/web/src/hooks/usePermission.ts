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
    if (!user?.role?.name) return false;
    return allowedRoles.includes(user.role.name as RoleName);
  };

  const isAdmin = (): boolean => {
    return user?.role?.name === 'ADMIN';
  };

  return {
    hasRole,
    isAdmin,
    user,
  };
}
