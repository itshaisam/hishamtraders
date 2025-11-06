import { PERMISSIONS, PermissionResource, PermissionAction } from '../config/permissions.js';
import { RoleName } from '../middleware/role.middleware.js';

/**
 * Check if a role has permission to perform an action on a resource
 */
export function hasPermission(
  roleName: RoleName,
  resource: PermissionResource,
  action: PermissionAction
): boolean {
  const resourcePermissions = PERMISSIONS[resource];

  if (!resourcePermissions) {
    return false;
  }

  const allowedRoles = resourcePermissions[action as keyof typeof resourcePermissions];

  if (!allowedRoles) {
    return false;
  }

  return allowedRoles.includes(roleName);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(roleName: RoleName) {
  const permissions: Record<string, string[]> = {};

  for (const [resource, actions] of Object.entries(PERMISSIONS)) {
    permissions[resource] = [];

    for (const [action, allowedRoles] of Object.entries(actions)) {
      if (allowedRoles.includes(roleName)) {
        permissions[resource].push(action);
      }
    }

    // Remove empty resources
    if (permissions[resource].length === 0) {
      delete permissions[resource];
    }
  }

  return permissions;
}
