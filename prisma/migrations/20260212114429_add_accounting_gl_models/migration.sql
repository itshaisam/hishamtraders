-- AlterTable
ALTER TABLE `payments` ADD COLUMN `bankAccountId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `account_heads` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `accountType` ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE') NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `openingBalance` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `currentBalance` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `isSystemAccount` BOOLEAN NOT NULL DEFAULT false,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `account_heads_code_key`(`code`),
    INDEX `account_heads_accountType_idx`(`accountType`),
    INDEX `account_heads_parentId_idx`(`parentId`),
    INDEX `account_heads_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `journal_entries` (
    `id` VARCHAR(191) NOT NULL,
    `entryNumber` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('DRAFT', 'POSTED') NOT NULL DEFAULT 'DRAFT',
    `referenceType` VARCHAR(191) NULL,
    `referenceId` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `approvedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `journal_entries_entryNumber_key`(`entryNumber`),
    INDEX `journal_entries_status_idx`(`status`),
    INDEX `journal_entries_date_idx`(`date`),
    INDEX `journal_entries_referenceType_referenceId_idx`(`referenceType`, `referenceId`),
    INDEX `journal_entries_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `journal_entry_lines` (
    `id` VARCHAR(191) NOT NULL,
    `journalEntryId` VARCHAR(191) NOT NULL,
    `accountHeadId` VARCHAR(191) NOT NULL,
    `debitAmount` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `creditAmount` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `journal_entry_lines_journalEntryId_idx`(`journalEntryId`),
    INDEX `journal_entry_lines_accountHeadId_idx`(`accountHeadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_reconciliations` (
    `id` VARCHAR(191) NOT NULL,
    `bankAccountId` VARCHAR(191) NOT NULL,
    `statementDate` DATETIME(3) NOT NULL,
    `statementBalance` DECIMAL(14, 2) NOT NULL,
    `systemBalance` DECIMAL(14, 2) NOT NULL,
    `status` ENUM('IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'IN_PROGRESS',
    `reconciledBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bank_reconciliations_bankAccountId_idx`(`bankAccountId`),
    INDEX `bank_reconciliations_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_reconciliation_items` (
    `id` VARCHAR(191) NOT NULL,
    `reconciliationId` VARCHAR(191) NOT NULL,
    `journalEntryLineId` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `statementAmount` DECIMAL(14, 2) NOT NULL,
    `statementDate` DATETIME(3) NOT NULL,
    `matched` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bank_reconciliation_items_reconciliationId_idx`(`reconciliationId`),
    INDEX `bank_reconciliation_items_journalEntryLineId_idx`(`journalEntryLineId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `period_closes` (
    `id` VARCHAR(191) NOT NULL,
    `periodType` ENUM('MONTH', 'YEAR') NOT NULL,
    `periodDate` DATETIME(3) NOT NULL,
    `netProfit` DECIMAL(14, 2) NOT NULL,
    `status` ENUM('CLOSED', 'REOPENED') NOT NULL DEFAULT 'CLOSED',
    `closedBy` VARCHAR(191) NOT NULL,
    `closingJournalEntryId` VARCHAR(191) NULL,
    `reopenReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `period_closes_status_idx`(`status`),
    UNIQUE INDEX `period_closes_periodType_periodDate_key`(`periodType`, `periodDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `payments_bankAccountId_idx` ON `payments`(`bankAccountId`);

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_bankAccountId_fkey` FOREIGN KEY (`bankAccountId`) REFERENCES `account_heads`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_heads` ADD CONSTRAINT `account_heads_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `account_heads`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `journal_entries` ADD CONSTRAINT `journal_entries_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `journal_entries` ADD CONSTRAINT `journal_entries_approvedBy_fkey` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `journal_entry_lines` ADD CONSTRAINT `journal_entry_lines_journalEntryId_fkey` FOREIGN KEY (`journalEntryId`) REFERENCES `journal_entries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `journal_entry_lines` ADD CONSTRAINT `journal_entry_lines_accountHeadId_fkey` FOREIGN KEY (`accountHeadId`) REFERENCES `account_heads`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_reconciliations` ADD CONSTRAINT `bank_reconciliations_bankAccountId_fkey` FOREIGN KEY (`bankAccountId`) REFERENCES `account_heads`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_reconciliations` ADD CONSTRAINT `bank_reconciliations_reconciledBy_fkey` FOREIGN KEY (`reconciledBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_reconciliation_items` ADD CONSTRAINT `bank_reconciliation_items_reconciliationId_fkey` FOREIGN KEY (`reconciliationId`) REFERENCES `bank_reconciliations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_reconciliation_items` ADD CONSTRAINT `bank_reconciliation_items_journalEntryLineId_fkey` FOREIGN KEY (`journalEntryLineId`) REFERENCES `journal_entry_lines`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `period_closes` ADD CONSTRAINT `period_closes_closedBy_fkey` FOREIGN KEY (`closedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `period_closes` ADD CONSTRAINT `period_closes_closingJournalEntryId_fkey` FOREIGN KEY (`closingJournalEntryId`) REFERENCES `journal_entries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
