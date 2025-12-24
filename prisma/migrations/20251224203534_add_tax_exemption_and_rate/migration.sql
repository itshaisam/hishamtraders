-- AlterTable
ALTER TABLE `clients` ADD COLUMN `taxExempt` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `taxExemptReason` TEXT NULL;

-- AlterTable
ALTER TABLE `invoices` ADD COLUMN `taxRate` DECIMAL(5, 2) NOT NULL DEFAULT 0;
