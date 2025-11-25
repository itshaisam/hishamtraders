/*
  Warnings:

  - You are about to drop the column `brand` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `suppliers` table. All the data in the column will be lost.
  - You are about to drop the column `paymentTerms` on the `suppliers` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `po_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `payment_terms` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `po_items` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `product_categories` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `products` DROP COLUMN `brand`,
    DROP COLUMN `category`,
    ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `purchase_orders` ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `suppliers` DROP COLUMN `country`,
    DROP COLUMN `paymentTerms`,
    ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `updatedBy` VARCHAR(191) NULL;
