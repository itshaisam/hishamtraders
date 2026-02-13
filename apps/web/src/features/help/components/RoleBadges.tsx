import Badge from '../../../components/ui/Badge';

const ROLE_COLORS: Record<string, 'info' | 'default' | 'success' | 'warning' | 'danger'> = {
  ADMIN: 'info',
  WAREHOUSE_MANAGER: 'default',
  SALES_OFFICER: 'success',
  ACCOUNTANT: 'warning',
  RECOVERY_AGENT: 'danger',
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  WAREHOUSE_MANAGER: 'Warehouse Manager',
  SALES_OFFICER: 'Sales Officer',
  ACCOUNTANT: 'Accountant',
  RECOVERY_AGENT: 'Recovery Agent',
};

interface RoleBadgesProps {
  roles: string[];
}

export default function RoleBadges({ roles }: RoleBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((role) => (
        <Badge key={role} variant={ROLE_COLORS[role] || 'default'} size="sm">
          {ROLE_LABELS[role] || role}
        </Badge>
      ))}
    </div>
  );
}
