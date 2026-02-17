-- Add tenantId to audit_logs table
ALTER TABLE `audit_logs` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
UPDATE `audit_logs` SET `tenantId` = 'default-tenant';
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX `audit_logs_tenantId_idx` ON `audit_logs`(`tenantId`);
ALTER TABLE `audit_logs` ALTER COLUMN `tenantId` DROP DEFAULT;
