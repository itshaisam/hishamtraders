-- CreateTable
CREATE TABLE `stock_adjustments` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `productVariantId` VARCHAR(191) NULL,
    `warehouseId` VARCHAR(191) NOT NULL,
    `adjustmentType` ENUM('WASTAGE', 'DAMAGE', 'THEFT', 'CORRECTION') NOT NULL,
    `quantity` INTEGER NOT NULL,
    `reason` TEXT NOT NULL,
    `notes` TEXT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedBy` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `rejectionReason` TEXT NULL,
    `stockMovementId` VARCHAR(191) NULL,

    UNIQUE INDEX `stock_adjustments_stockMovementId_key`(`stockMovementId`),
    INDEX `stock_adjustments_productId_idx`(`productId`),
    INDEX `stock_adjustments_warehouseId_idx`(`warehouseId`),
    INDEX `stock_adjustments_status_idx`(`status`),
    INDEX `stock_adjustments_createdBy_idx`(`createdBy`),
    INDEX `stock_adjustments_createdAt_idx`(`createdAt`),
    INDEX `stock_adjustments_productVariantId_idx`(`productVariantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `stock_adjustments` ADD CONSTRAINT `stock_adjustments_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_adjustments` ADD CONSTRAINT `stock_adjustments_productVariantId_fkey` FOREIGN KEY (`productVariantId`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_adjustments` ADD CONSTRAINT `stock_adjustments_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_adjustments` ADD CONSTRAINT `stock_adjustments_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_adjustments` ADD CONSTRAINT `stock_adjustments_reviewedBy_fkey` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_adjustments` ADD CONSTRAINT `stock_adjustments_stockMovementId_fkey` FOREIGN KEY (`stockMovementId`) REFERENCES `stock_movements`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
