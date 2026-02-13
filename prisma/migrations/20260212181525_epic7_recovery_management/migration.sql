-- AlterTable
ALTER TABLE `clients` ADD COLUMN `recoveryAgentId` VARCHAR(191) NULL,
    ADD COLUMN `recoveryDay` ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'NONE') NULL DEFAULT 'NONE';

-- CreateTable
CREATE TABLE `recovery_visits` (
    `id` VARCHAR(191) NOT NULL,
    `visitNumber` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `visitDate` DATETIME(3) NOT NULL,
    `visitTime` VARCHAR(191) NULL,
    `outcome` ENUM('PAYMENT_COLLECTED', 'PROMISE_MADE', 'CLIENT_UNAVAILABLE', 'REFUSED_TO_PAY', 'PARTIAL_PAYMENT', 'DISPUTE_RAISED', 'OTHER') NOT NULL,
    `amountCollected` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `promiseDate` DATETIME(3) NULL,
    `promiseAmount` DECIMAL(12, 2) NULL,
    `notes` TEXT NULL,
    `visitedBy` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `recovery_visits_visitNumber_key`(`visitNumber`),
    INDEX `recovery_visits_clientId_visitDate_idx`(`clientId`, `visitDate`),
    INDEX `recovery_visits_visitedBy_idx`(`visitedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_promises` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `promiseDate` DATETIME(3) NOT NULL,
    `promiseAmount` DECIMAL(12, 2) NOT NULL,
    `actualPaymentDate` DATETIME(3) NULL,
    `actualAmount` DECIMAL(12, 2) NULL,
    `status` ENUM('PENDING', 'FULFILLED', 'PARTIAL', 'BROKEN', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `recoveryVisitId` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_promises_recoveryVisitId_key`(`recoveryVisitId`),
    INDEX `payment_promises_clientId_status_idx`(`clientId`, `status`),
    INDEX `payment_promises_promiseDate_status_idx`(`promiseDate`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alert_rules` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `daysOverdue` INTEGER NOT NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    `targetRoles` JSON NOT NULL,
    `action` ENUM('NOTIFY', 'EMAIL', 'SMS') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `alert_rules_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alerts` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('CLIENT_OVERDUE', 'PROMISE_BROKEN', 'STOCK_LOW', 'EXPIRY_WARNING', 'CREDIT_LIMIT_EXCEEDED') NOT NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    `message` TEXT NOT NULL,
    `relatedType` VARCHAR(191) NULL,
    `relatedId` VARCHAR(191) NULL,
    `targetUserId` VARCHAR(191) NULL,
    `targetRole` VARCHAR(191) NULL,
    `acknowledged` BOOLEAN NOT NULL DEFAULT false,
    `acknowledgedBy` VARCHAR(191) NULL,
    `acknowledgedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `alerts_targetUserId_acknowledged_idx`(`targetUserId`, `acknowledged`),
    INDEX `alerts_type_relatedId_idx`(`type`, `relatedId`),
    INDEX `alerts_targetRole_acknowledged_idx`(`targetRole`, `acknowledged`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `clients_recoveryAgentId_idx` ON `clients`(`recoveryAgentId`);

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_recoveryAgentId_fkey` FOREIGN KEY (`recoveryAgentId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recovery_visits` ADD CONSTRAINT `recovery_visits_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recovery_visits` ADD CONSTRAINT `recovery_visits_visitedBy_fkey` FOREIGN KEY (`visitedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_promises` ADD CONSTRAINT `payment_promises_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_promises` ADD CONSTRAINT `payment_promises_recoveryVisitId_fkey` FOREIGN KEY (`recoveryVisitId`) REFERENCES `recovery_visits`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_promises` ADD CONSTRAINT `payment_promises_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_targetUserId_fkey` FOREIGN KEY (`targetUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_acknowledgedBy_fkey` FOREIGN KEY (`acknowledgedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
