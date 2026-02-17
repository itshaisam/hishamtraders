-- Check inventory unique index
SHOW INDEX FROM inventory WHERE Key_name LIKE '%tenant%';
-- Check if FK constraints exist
SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = 'hisham_erp' AND TABLE_NAME = 'suppliers' AND CONSTRAINT_NAME = 'suppliers_tenantId_fkey';
-- Check tenantId indexes
SHOW INDEX FROM products WHERE Key_name = 'products_tenantId_idx';
-- Check FK on products
SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = 'hisham_erp' AND TABLE_NAME = 'products' AND CONSTRAINT_NAME = 'products_tenantId_fkey';
