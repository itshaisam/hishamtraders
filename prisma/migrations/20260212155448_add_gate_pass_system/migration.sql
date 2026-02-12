-- AlterTable
ALTER TABLE `warehouses` ADD COLUMN `gatePassMode` ENUM('AUTO', 'MANUAL') NOT NULL DEFAULT 'AUTO';

-- CreateTable
CREATE TABLE `gate_passes` (
    `id` VARCHAR(191) NOT NULL,
    `gatePassNumber` VARCHAR(191) NOT NULL,
    `warehouseId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `purpose` ENUM('SALE', 'TRANSFER', 'RETURN', 'OTHER') NOT NULL,
    `referenceType` ENUM('PO', 'INVOICE', 'ADJUSTMENT', 'TRANSFER', 'CREDIT_NOTE') NULL,
    `referenceId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `issuedBy` VARCHAR(191) NOT NULL,
    `approvedBy` VARCHAR(191) NULL,
    `dispatchedBy` VARCHAR(191) NULL,
    `completedBy` VARCHAR(191) NULL,
    `cancelReason` TEXT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `gate_passes_gatePassNumber_key`(`gatePassNumber`),
    INDEX `gate_passes_warehouseId_idx`(`warehouseId`),
    INDEX `gate_passes_status_idx`(`status`),
    INDEX `gate_passes_date_idx`(`date`),
    INDEX `gate_passes_referenceType_referenceId_idx`(`referenceType`, `referenceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gate_pass_items` (
    `id` VARCHAR(191) NOT NULL,
    `gatePassId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `batchNo` VARCHAR(191) NULL,
    `binLocation` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `gate_pass_items_gatePassId_idx`(`gatePassId`),
    INDEX `gate_pass_items_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `gate_passes` ADD CONSTRAINT `gate_passes_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gate_passes` ADD CONSTRAINT `gate_passes_issuedBy_fkey` FOREIGN KEY (`issuedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gate_passes` ADD CONSTRAINT `gate_passes_approvedBy_fkey` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gate_pass_items` ADD CONSTRAINT `gate_pass_items_gatePassId_fkey` FOREIGN KEY (`gatePassId`) REFERENCES `gate_passes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gate_pass_items` ADD CONSTRAINT `gate_pass_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
