-- CreateTable
CREATE TABLE `change_history` (
    `id` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL,
    `changedBy` VARCHAR(191) NOT NULL,
    `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `snapshot` JSON NOT NULL,
    `changeReason` TEXT NULL,

    INDEX `change_history_entityType_entityId_idx`(`entityType`, `entityId`),
    UNIQUE INDEX `change_history_entityType_entityId_version_key`(`entityType`, `entityId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `change_history` ADD CONSTRAINT `change_history_changedBy_fkey` FOREIGN KEY (`changedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
