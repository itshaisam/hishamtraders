-- DropForeignKey
ALTER TABLE `change_history` DROP FOREIGN KEY `change_history_changedBy_fkey`;

-- DropIndex
DROP INDEX `change_history_changedBy_fkey` ON `change_history`;

-- AlterTable
ALTER TABLE `change_history` MODIFY `changedBy` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `change_history` ADD CONSTRAINT `change_history_changedBy_fkey` FOREIGN KEY (`changedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
