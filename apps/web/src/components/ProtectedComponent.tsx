import { ReactNode } from 'react';
import { usePermission, RoleName } from '../hooks/usePermission';

interface ProtectedComponentProps {
  allowedRoles: RoleName[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedComponent({
  allowedRoles,
  children,
  fallback = null,
}: ProtectedComponentProps) {
  const { hasRole } = usePermission();

  if (!hasRole(allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
