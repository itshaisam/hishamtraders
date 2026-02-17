SELECT u.id, u.email, u.name, u.tenantId, r.name as roleName FROM users u JOIN roles r ON u.roleId = r.id;
