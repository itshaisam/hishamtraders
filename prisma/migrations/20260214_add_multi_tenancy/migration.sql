-- CreateTable: tenants
CREATE TABLE `tenants` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tenants_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Insert default tenant
INSERT INTO `tenants` (`id`, `name`, `slug`, `status`, `updatedAt`)
VALUES ('default-tenant', 'Hisham Traders', 'hisham-traders', 'active', NOW());

-- ============================================================================
-- Add tenantId to all business tables with DEFAULT 'default-tenant'
-- ============================================================================

-- Users: change nullable to non-nullable
UPDATE `users` SET `tenantId` = 'default-tenant' WHERE `tenantId` IS NULL;
ALTER TABLE `users` MODIFY `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';

-- Supply Chain
ALTER TABLE `suppliers` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `warehouses` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `bin_locations` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `purchase_orders` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `po_items` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `po_costs` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';

-- Products
ALTER TABLE `products` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `product_variants` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';

-- Inventory
ALTER TABLE `inventory` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `stock_movements` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `stock_adjustments` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `stock_transfers` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `stock_transfer_items` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `stock_counts` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `stock_count_items` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';

-- Sales
ALTER TABLE `clients` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `invoices` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `invoice_items` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `credit_notes` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `credit_note_items` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';

-- Payments
ALTER TABLE `payments` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `payment_allocations` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';

-- Expenses
ALTER TABLE `expenses` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';

-- Gate Passes
ALTER TABLE `gate_passes` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `gate_pass_items` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';

-- Accounting
ALTER TABLE `account_heads` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `journal_entries` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `journal_entry_lines` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `bank_reconciliations` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `bank_reconciliation_items` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `period_closes` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';

-- Recovery
ALTER TABLE `recovery_visits` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `payment_promises` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `alerts` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `alert_rules` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';

-- Settings & History
ALTER TABLE `system_settings` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `change_history` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';

-- ============================================================================
-- Drop old unique constraints that are being replaced
-- ============================================================================

-- Supplier: drop old unique on name and email
DROP INDEX `suppliers_name_key` ON `suppliers`;
DROP INDEX `suppliers_email_key` ON `suppliers`;

-- Warehouse: drop old unique on name
DROP INDEX `warehouses_name_key` ON `warehouses`;

-- Product: drop old unique on sku
DROP INDEX `products_sku_key` ON `products`;

-- ProductVariant: drop old unique on sku
DROP INDEX `product_variants_sku_key` ON `product_variants`;

-- PurchaseOrder: drop old unique on poNumber
DROP INDEX `purchase_orders_poNumber_key` ON `purchase_orders`;

-- Invoice: drop old unique on invoiceNumber
DROP INDEX `invoices_invoiceNumber_key` ON `invoices`;

-- CreditNote: drop old unique on creditNoteNumber
DROP INDEX `credit_notes_creditNoteNumber_key` ON `credit_notes`;

-- GatePass: drop old unique on gatePassNumber
DROP INDEX `gate_passes_gatePassNumber_key` ON `gate_passes`;

-- StockTransfer: drop old unique on transferNumber
DROP INDEX `stock_transfers_transferNumber_key` ON `stock_transfers`;

-- StockCount: drop old unique on countNumber
DROP INDEX `stock_counts_countNumber_key` ON `stock_counts`;

-- JournalEntry: drop old unique on entryNumber
DROP INDEX `journal_entries_entryNumber_key` ON `journal_entries`;

-- RecoveryVisit: drop old unique on visitNumber
DROP INDEX `recovery_visits_visitNumber_key` ON `recovery_visits`;

-- AlertRule: drop old unique on name
DROP INDEX `alert_rules_name_key` ON `alert_rules`;

-- AccountHead: drop old unique on code
DROP INDEX `account_heads_code_key` ON `account_heads`;

-- SystemSetting: drop old unique on key
DROP INDEX `system_settings_key_key` ON `system_settings`;

-- BinLocation: drop old composite unique
DROP INDEX `bin_locations_warehouseId_code_key` ON `bin_locations`;

-- ChangeHistory: drop old composite unique
DROP INDEX `change_history_entityType_entityId_version_key` ON `change_history`;

-- PeriodClose: drop old composite unique
DROP INDEX `period_closes_periodType_periodDate_key` ON `period_closes`;

-- Inventory: drop old composite unique
DROP INDEX `inventory_productId_productVariantId_warehouseId_batchNo_key` ON `inventory`;

-- ============================================================================
-- Add new per-tenant unique constraints
-- ============================================================================

CREATE UNIQUE INDEX `suppliers_tenantId_name_key` ON `suppliers`(`tenantId`, `name`);
CREATE UNIQUE INDEX `suppliers_tenantId_email_key` ON `suppliers`(`tenantId`, `email`);
CREATE UNIQUE INDEX `warehouses_tenantId_name_key` ON `warehouses`(`tenantId`, `name`);
CREATE UNIQUE INDEX `products_tenantId_sku_key` ON `products`(`tenantId`, `sku`);
CREATE UNIQUE INDEX `product_variants_tenantId_sku_key` ON `product_variants`(`tenantId`, `sku`);
CREATE UNIQUE INDEX `purchase_orders_tenantId_poNumber_key` ON `purchase_orders`(`tenantId`, `poNumber`);
CREATE UNIQUE INDEX `invoices_tenantId_invoiceNumber_key` ON `invoices`(`tenantId`, `invoiceNumber`);
CREATE UNIQUE INDEX `credit_notes_tenantId_creditNoteNumber_key` ON `credit_notes`(`tenantId`, `creditNoteNumber`);
CREATE UNIQUE INDEX `gate_passes_tenantId_gatePassNumber_key` ON `gate_passes`(`tenantId`, `gatePassNumber`);
CREATE UNIQUE INDEX `stock_transfers_tenantId_transferNumber_key` ON `stock_transfers`(`tenantId`, `transferNumber`);
CREATE UNIQUE INDEX `stock_counts_tenantId_countNumber_key` ON `stock_counts`(`tenantId`, `countNumber`);
CREATE UNIQUE INDEX `journal_entries_tenantId_entryNumber_key` ON `journal_entries`(`tenantId`, `entryNumber`);
CREATE UNIQUE INDEX `recovery_visits_tenantId_visitNumber_key` ON `recovery_visits`(`tenantId`, `visitNumber`);
CREATE UNIQUE INDEX `alert_rules_tenantId_name_key` ON `alert_rules`(`tenantId`, `name`);
CREATE UNIQUE INDEX `account_heads_tenantId_code_key` ON `account_heads`(`tenantId`, `code`);
CREATE UNIQUE INDEX `system_settings_tenantId_key_key` ON `system_settings`(`tenantId`, `key`);
CREATE UNIQUE INDEX `bin_locations_tenantId_warehouseId_code_key` ON `bin_locations`(`tenantId`, `warehouseId`, `code`);
CREATE UNIQUE INDEX `change_history_tenantId_entityType_entityId_version_key` ON `change_history`(`tenantId`, `entityType`, `entityId`, `version`);
CREATE UNIQUE INDEX `period_closes_tenantId_periodType_periodDate_key` ON `period_closes`(`tenantId`, `periodType`, `periodDate`);
CREATE UNIQUE INDEX `inventory_tenant_product_variant_warehouse_batch_key` ON `inventory`(`tenantId`, `productId`, `productVariantId`, `warehouseId`, `batchNo`);

-- ============================================================================
-- Add tenantId indexes for query performance
-- ============================================================================

CREATE INDEX `suppliers_tenantId_idx` ON `suppliers`(`tenantId`);
CREATE INDEX `warehouses_tenantId_idx` ON `warehouses`(`tenantId`);
CREATE INDEX `bin_locations_tenantId_idx` ON `bin_locations`(`tenantId`);
CREATE INDEX `products_tenantId_idx` ON `products`(`tenantId`);
CREATE INDEX `product_variants_tenantId_idx` ON `product_variants`(`tenantId`);
CREATE INDEX `purchase_orders_tenantId_idx` ON `purchase_orders`(`tenantId`);
CREATE INDEX `po_items_tenantId_idx` ON `po_items`(`tenantId`);
CREATE INDEX `po_costs_tenantId_idx` ON `po_costs`(`tenantId`);
CREATE INDEX `inventory_tenantId_idx` ON `inventory`(`tenantId`);
CREATE INDEX `stock_movements_tenantId_idx` ON `stock_movements`(`tenantId`);
CREATE INDEX `stock_adjustments_tenantId_idx` ON `stock_adjustments`(`tenantId`);
CREATE INDEX `stock_transfers_tenantId_idx` ON `stock_transfers`(`tenantId`);
CREATE INDEX `stock_transfer_items_tenantId_idx` ON `stock_transfer_items`(`tenantId`);
CREATE INDEX `stock_counts_tenantId_idx` ON `stock_counts`(`tenantId`);
CREATE INDEX `stock_count_items_tenantId_idx` ON `stock_count_items`(`tenantId`);
CREATE INDEX `clients_tenantId_idx` ON `clients`(`tenantId`);
CREATE INDEX `invoices_tenantId_idx` ON `invoices`(`tenantId`);
CREATE INDEX `invoice_items_tenantId_idx` ON `invoice_items`(`tenantId`);
CREATE INDEX `credit_notes_tenantId_idx` ON `credit_notes`(`tenantId`);
CREATE INDEX `credit_note_items_tenantId_idx` ON `credit_note_items`(`tenantId`);
CREATE INDEX `payments_tenantId_idx` ON `payments`(`tenantId`);
CREATE INDEX `payment_allocations_tenantId_idx` ON `payment_allocations`(`tenantId`);
CREATE INDEX `expenses_tenantId_idx` ON `expenses`(`tenantId`);
CREATE INDEX `gate_passes_tenantId_idx` ON `gate_passes`(`tenantId`);
CREATE INDEX `gate_pass_items_tenantId_idx` ON `gate_pass_items`(`tenantId`);
CREATE INDEX `account_heads_tenantId_idx` ON `account_heads`(`tenantId`);
CREATE INDEX `journal_entries_tenantId_idx` ON `journal_entries`(`tenantId`);
CREATE INDEX `journal_entry_lines_tenantId_idx` ON `journal_entry_lines`(`tenantId`);
CREATE INDEX `bank_reconciliations_tenantId_idx` ON `bank_reconciliations`(`tenantId`);
CREATE INDEX `bank_reconciliation_items_tenantId_idx` ON `bank_reconciliation_items`(`tenantId`);
CREATE INDEX `period_closes_tenantId_idx` ON `period_closes`(`tenantId`);
CREATE INDEX `recovery_visits_tenantId_idx` ON `recovery_visits`(`tenantId`);
CREATE INDEX `payment_promises_tenantId_idx` ON `payment_promises`(`tenantId`);
CREATE INDEX `alerts_tenantId_idx` ON `alerts`(`tenantId`);
CREATE INDEX `alert_rules_tenantId_idx` ON `alert_rules`(`tenantId`);
CREATE INDEX `system_settings_tenantId_idx` ON `system_settings`(`tenantId`);
CREATE INDEX `change_history_tenantId_idx` ON `change_history`(`tenantId`);

-- ============================================================================
-- Add foreign key constraints for tenantId
-- ============================================================================

ALTER TABLE `users` ADD CONSTRAINT `users_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `warehouses` ADD CONSTRAINT `warehouses_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bin_locations` ADD CONSTRAINT `bin_locations_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `products` ADD CONSTRAINT `products_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `po_items` ADD CONSTRAINT `po_items_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `po_costs` ADD CONSTRAINT `po_costs_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `inventory` ADD CONSTRAINT `inventory_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `stock_adjustments` ADD CONSTRAINT `stock_adjustments_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `stock_transfers` ADD CONSTRAINT `stock_transfers_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `stock_transfer_items` ADD CONSTRAINT `stock_transfer_items_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `stock_counts` ADD CONSTRAINT `stock_counts_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `stock_count_items` ADD CONSTRAINT `stock_count_items_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `clients` ADD CONSTRAINT `clients_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `credit_notes` ADD CONSTRAINT `credit_notes_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `credit_note_items` ADD CONSTRAINT `credit_note_items_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `payments` ADD CONSTRAINT `payments_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `payment_allocations` ADD CONSTRAINT `payment_allocations_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `gate_passes` ADD CONSTRAINT `gate_passes_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `gate_pass_items` ADD CONSTRAINT `gate_pass_items_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `account_heads` ADD CONSTRAINT `account_heads_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `journal_entries` ADD CONSTRAINT `journal_entries_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `journal_entry_lines` ADD CONSTRAINT `journal_entry_lines_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bank_reconciliations` ADD CONSTRAINT `bank_reconciliations_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bank_reconciliation_items` ADD CONSTRAINT `bank_reconciliation_items_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `period_closes` ADD CONSTRAINT `period_closes_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `recovery_visits` ADD CONSTRAINT `recovery_visits_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `payment_promises` ADD CONSTRAINT `payment_promises_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `alert_rules` ADD CONSTRAINT `alert_rules_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `system_settings` ADD CONSTRAINT `system_settings_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `change_history` ADD CONSTRAINT `change_history_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
