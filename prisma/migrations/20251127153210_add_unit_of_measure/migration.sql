-- AlterTable
ALTER TABLE `products` ADD COLUMN `uomId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `units_of_measure` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `abbreviation` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `units_of_measure_name_key`(`name`),
    UNIQUE INDEX `units_of_measure_abbreviation_key`(`abbreviation`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `products_uomId_idx` ON `products`(`uomId`);

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_uomId_fkey` FOREIGN KEY (`uomId`) REFERENCES `units_of_measure`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
