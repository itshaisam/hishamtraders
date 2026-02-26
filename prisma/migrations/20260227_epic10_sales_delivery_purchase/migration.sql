-- Epic 10: Sales Orders, Delivery Notes, Purchase Invoices

-- AlterTable: Add salesOrderId and deliveryNoteId to invoices
ALTER TABLE `invoices` ADD COLUMN `salesOrderId` VARCHAR(191) NULL;
ALTER TABLE `invoices` ADD COLUMN `deliveryNoteId` VARCHAR(191) NULL;

-- CreateTable: sales_orders
CREATE TABLE `sales_orders` (
    `id` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `warehouseId` VARCHAR(191) NOT NULL,
    `orderDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expectedDeliveryDate` DATETIME(3) NULL,
    `paymentType` VARCHAR(191) NOT NULL,
    `subtotal` DECIMAL(14, 4) NOT NULL,
    `taxRate` DECIMAL(5, 4) NOT NULL,
    `taxAmount` DECIMAL(14, 4) NOT NULL,
    `total` DECIMAL(14, 4) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `notes` TEXT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,
    `cancelReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `sales_orders_tenantId_orderNumber_key`(`tenantId`, `orderNumber`),
    INDEX `sales_orders_tenantId_idx`(`tenantId`),
    INDEX `sales_orders_clientId_idx`(`clientId`),
    INDEX `sales_orders_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: sales_order_items
CREATE TABLE `sales_order_items` (
    `id` VARCHAR(191) NOT NULL,
    `salesOrderId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `productVariantId` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL,
    `deliveredQuantity` INTEGER NOT NULL DEFAULT 0,
    `invoicedQuantity` INTEGER NOT NULL DEFAULT 0,
    `unitPrice` DECIMAL(14, 4) NOT NULL,
    `discount` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(14, 4) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,

    INDEX `sales_order_items_tenantId_idx`(`tenantId`),
    INDEX `sales_order_items_salesOrderId_idx`(`salesOrderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: delivery_notes
CREATE TABLE `delivery_notes` (
    `id` VARCHAR(191) NOT NULL,
    `deliveryNoteNumber` VARCHAR(191) NOT NULL,
    `salesOrderId` VARCHAR(191) NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `warehouseId` VARCHAR(191) NOT NULL,
    `deliveryDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `deliveryAddress` TEXT NULL,
    `driverName` VARCHAR(191) NULL,
    `vehicleNo` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `dispatchedBy` VARCHAR(191) NULL,
    `completedBy` VARCHAR(191) NULL,
    `cancelReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `delivery_notes_tenantId_deliveryNoteNumber_key`(`tenantId`, `deliveryNoteNumber`),
    INDEX `delivery_notes_tenantId_idx`(`tenantId`),
    INDEX `delivery_notes_clientId_idx`(`clientId`),
    INDEX `delivery_notes_salesOrderId_idx`(`salesOrderId`),
    INDEX `delivery_notes_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: delivery_note_items
CREATE TABLE `delivery_note_items` (
    `id` VARCHAR(191) NOT NULL,
    `deliveryNoteId` VARCHAR(191) NOT NULL,
    `salesOrderItemId` VARCHAR(191) NULL,
    `productId` VARCHAR(191) NOT NULL,
    `productVariantId` VARCHAR(191) NULL,
    `batchNo` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,

    INDEX `delivery_note_items_tenantId_idx`(`tenantId`),
    INDEX `delivery_note_items_deliveryNoteId_idx`(`deliveryNoteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: purchase_invoices
CREATE TABLE `purchase_invoices` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `internalNumber` VARCHAR(191) NOT NULL,
    `supplierId` VARCHAR(191) NOT NULL,
    `poId` VARCHAR(191) NULL,
    `grnId` VARCHAR(191) NULL,
    `invoiceDate` DATETIME(3) NOT NULL,
    `dueDate` DATETIME(3) NULL,
    `subtotal` DECIMAL(14, 4) NOT NULL,
    `taxRate` DECIMAL(5, 4) NOT NULL,
    `taxAmount` DECIMAL(14, 4) NOT NULL,
    `total` DECIMAL(14, 4) NOT NULL,
    `paidAmount` DECIMAL(14, 4) NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `purchase_invoices_tenantId_internalNumber_key`(`tenantId`, `internalNumber`),
    INDEX `purchase_invoices_tenantId_idx`(`tenantId`),
    INDEX `purchase_invoices_supplierId_idx`(`supplierId`),
    INDEX `purchase_invoices_poId_idx`(`poId`),
    INDEX `purchase_invoices_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: purchase_invoice_items
CREATE TABLE `purchase_invoice_items` (
    `id` VARCHAR(191) NOT NULL,
    `purchaseInvoiceId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `productVariantId` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL,
    `unitCost` DECIMAL(14, 4) NOT NULL,
    `total` DECIMAL(14, 4) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,

    INDEX `purchase_invoice_items_tenantId_idx`(`tenantId`),
    INDEX `purchase_invoice_items_purchaseInvoiceId_idx`(`purchaseInvoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: invoices -> sales_orders
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_salesOrderId_fkey` FOREIGN KEY (`salesOrderId`) REFERENCES `sales_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: invoices -> delivery_notes
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_deliveryNoteId_fkey` FOREIGN KEY (`deliveryNoteId`) REFERENCES `delivery_notes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: sales_orders -> tenants
ALTER TABLE `sales_orders` ADD CONSTRAINT `sales_orders_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: sales_orders -> clients
ALTER TABLE `sales_orders` ADD CONSTRAINT `sales_orders_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: sales_orders -> warehouses
ALTER TABLE `sales_orders` ADD CONSTRAINT `sales_orders_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: sales_orders -> users (creator)
ALTER TABLE `sales_orders` ADD CONSTRAINT `sales_orders_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: sales_order_items -> tenants
ALTER TABLE `sales_order_items` ADD CONSTRAINT `sales_order_items_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: sales_order_items -> sales_orders
ALTER TABLE `sales_order_items` ADD CONSTRAINT `sales_order_items_salesOrderId_fkey` FOREIGN KEY (`salesOrderId`) REFERENCES `sales_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: sales_order_items -> products
ALTER TABLE `sales_order_items` ADD CONSTRAINT `sales_order_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: sales_order_items -> product_variants
ALTER TABLE `sales_order_items` ADD CONSTRAINT `sales_order_items_productVariantId_fkey` FOREIGN KEY (`productVariantId`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: delivery_notes -> tenants
ALTER TABLE `delivery_notes` ADD CONSTRAINT `delivery_notes_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: delivery_notes -> sales_orders
ALTER TABLE `delivery_notes` ADD CONSTRAINT `delivery_notes_salesOrderId_fkey` FOREIGN KEY (`salesOrderId`) REFERENCES `sales_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: delivery_notes -> clients
ALTER TABLE `delivery_notes` ADD CONSTRAINT `delivery_notes_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: delivery_notes -> warehouses
ALTER TABLE `delivery_notes` ADD CONSTRAINT `delivery_notes_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: delivery_notes -> users (creator)
ALTER TABLE `delivery_notes` ADD CONSTRAINT `delivery_notes_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: delivery_notes -> users (dispatcher)
ALTER TABLE `delivery_notes` ADD CONSTRAINT `delivery_notes_dispatchedBy_fkey` FOREIGN KEY (`dispatchedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: delivery_notes -> users (completer)
ALTER TABLE `delivery_notes` ADD CONSTRAINT `delivery_notes_completedBy_fkey` FOREIGN KEY (`completedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: delivery_note_items -> tenants
ALTER TABLE `delivery_note_items` ADD CONSTRAINT `delivery_note_items_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: delivery_note_items -> delivery_notes
ALTER TABLE `delivery_note_items` ADD CONSTRAINT `delivery_note_items_deliveryNoteId_fkey` FOREIGN KEY (`deliveryNoteId`) REFERENCES `delivery_notes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: delivery_note_items -> sales_order_items
ALTER TABLE `delivery_note_items` ADD CONSTRAINT `delivery_note_items_salesOrderItemId_fkey` FOREIGN KEY (`salesOrderItemId`) REFERENCES `sales_order_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: delivery_note_items -> products
ALTER TABLE `delivery_note_items` ADD CONSTRAINT `delivery_note_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: delivery_note_items -> product_variants
ALTER TABLE `delivery_note_items` ADD CONSTRAINT `delivery_note_items_productVariantId_fkey` FOREIGN KEY (`productVariantId`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: purchase_invoices -> tenants
ALTER TABLE `purchase_invoices` ADD CONSTRAINT `purchase_invoices_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: purchase_invoices -> suppliers
ALTER TABLE `purchase_invoices` ADD CONSTRAINT `purchase_invoices_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: purchase_invoices -> purchase_orders
ALTER TABLE `purchase_invoices` ADD CONSTRAINT `purchase_invoices_poId_fkey` FOREIGN KEY (`poId`) REFERENCES `purchase_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: purchase_invoices -> goods_receive_notes
ALTER TABLE `purchase_invoices` ADD CONSTRAINT `purchase_invoices_grnId_fkey` FOREIGN KEY (`grnId`) REFERENCES `goods_receive_notes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: purchase_invoices -> users (creator)
ALTER TABLE `purchase_invoices` ADD CONSTRAINT `purchase_invoices_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: purchase_invoice_items -> tenants
ALTER TABLE `purchase_invoice_items` ADD CONSTRAINT `purchase_invoice_items_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: purchase_invoice_items -> purchase_invoices
ALTER TABLE `purchase_invoice_items` ADD CONSTRAINT `purchase_invoice_items_purchaseInvoiceId_fkey` FOREIGN KEY (`purchaseInvoiceId`) REFERENCES `purchase_invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: purchase_invoice_items -> products
ALTER TABLE `purchase_invoice_items` ADD CONSTRAINT `purchase_invoice_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: purchase_invoice_items -> product_variants
ALTER TABLE `purchase_invoice_items` ADD CONSTRAINT `purchase_invoice_items_productVariantId_fkey` FOREIGN KEY (`productVariantId`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
