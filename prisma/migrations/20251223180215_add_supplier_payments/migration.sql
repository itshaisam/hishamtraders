-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
    `supplierId` VARCHAR(191) NULL,
    `paymentType` ENUM('SUPPLIER', 'CLIENT') NOT NULL,
    `paymentReferenceType` ENUM('PO', 'INVOICE', 'GENERAL') NULL,
    `referenceId` VARCHAR(191) NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `method` ENUM('CASH', 'BANK_TRANSFER', 'CHEQUE') NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `notes` TEXT NULL,
    `recordedBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payments_paymentType_paymentReferenceType_referenceId_idx`(`paymentType`, `paymentReferenceType`, `referenceId`),
    INDEX `payments_supplierId_idx`(`supplierId`),
    INDEX `payments_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_recordedBy_fkey` FOREIGN KEY (`recordedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
