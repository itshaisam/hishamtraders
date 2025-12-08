-- AlterTable
ALTER TABLE `purchase_orders` ADD COLUMN `arrivalDate` DATETIME(3) NULL,
    ADD COLUMN `containerNo` VARCHAR(191) NULL,
    ADD COLUMN `shipDate` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `po_costs` (
    `id` VARCHAR(191) NOT NULL,
    `poId` VARCHAR(191) NOT NULL,
    `type` ENUM('SHIPPING', 'CUSTOMS', 'TAX', 'OTHER') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(191) NULL,

    INDEX `po_costs_poId_idx`(`poId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `po_costs` ADD CONSTRAINT `po_costs_poId_fkey` FOREIGN KEY (`poId`) REFERENCES `purchase_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
