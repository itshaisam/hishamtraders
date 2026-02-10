-- AlterTable
ALTER TABLE `stock_movements` MODIFY `movementType` ENUM('RECEIPT', 'SALE', 'ADJUSTMENT', 'TRANSFER', 'SALES_RETURN') NOT NULL,
    MODIFY `referenceType` ENUM('PO', 'INVOICE', 'ADJUSTMENT', 'TRANSFER', 'CREDIT_NOTE') NULL;

-- CreateTable
CREATE TABLE `credit_notes` (
    `id` VARCHAR(191) NOT NULL,
    `creditNoteNumber` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `reason` TEXT NOT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `taxRate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `taxAmount` DECIMAL(12, 2) NOT NULL,
    `totalAmount` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('OPEN', 'APPLIED', 'VOIDED') NOT NULL DEFAULT 'OPEN',
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `credit_notes_creditNoteNumber_key`(`creditNoteNumber`),
    INDEX `credit_notes_invoiceId_idx`(`invoiceId`),
    INDEX `credit_notes_clientId_idx`(`clientId`),
    INDEX `credit_notes_status_idx`(`status`),
    INDEX `credit_notes_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credit_note_items` (
    `id` VARCHAR(191) NOT NULL,
    `creditNoteId` VARCHAR(191) NOT NULL,
    `invoiceItemId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `productVariantId` VARCHAR(191) NULL,
    `batchNo` VARCHAR(191) NULL,
    `quantityReturned` INTEGER NOT NULL,
    `unitPrice` DECIMAL(10, 2) NOT NULL,
    `discount` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(12, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `credit_note_items_creditNoteId_idx`(`creditNoteId`),
    INDEX `credit_note_items_invoiceItemId_idx`(`invoiceItemId`),
    INDEX `credit_note_items_productId_idx`(`productId`),
    INDEX `credit_note_items_productVariantId_idx`(`productVariantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `credit_notes` ADD CONSTRAINT `credit_notes_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credit_notes` ADD CONSTRAINT `credit_notes_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credit_notes` ADD CONSTRAINT `credit_notes_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credit_note_items` ADD CONSTRAINT `credit_note_items_creditNoteId_fkey` FOREIGN KEY (`creditNoteId`) REFERENCES `credit_notes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credit_note_items` ADD CONSTRAINT `credit_note_items_invoiceItemId_fkey` FOREIGN KEY (`invoiceItemId`) REFERENCES `invoice_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credit_note_items` ADD CONSTRAINT `credit_note_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credit_note_items` ADD CONSTRAINT `credit_note_items_productVariantId_fkey` FOREIGN KEY (`productVariantId`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
