-- Check if old unique indexes still exist
SHOW INDEX FROM suppliers WHERE Key_name = 'suppliers_name_key';
SHOW INDEX FROM suppliers WHERE Key_name = 'suppliers_tenantId_name_key';
-- Check if tenants table exists
SELECT COUNT(*) as tenant_count FROM tenants;
-- Check user tenantId state
SELECT id, tenantId FROM users LIMIT 3;
