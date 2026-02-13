SET @c1 = (SELECT id FROM clients WHERE companyName = 'ABC Construction' LIMIT 1);
SET @c2 = (SELECT id FROM clients WHERE companyName = 'Paradise Builders' LIMIT 1);
SET @c3 = (SELECT id FROM clients WHERE companyName = 'Metro Plumbing' LIMIT 1);
SET @c4 = (SELECT id FROM clients WHERE companyName = 'Royal Interiors' LIMIT 1);
SET @c5 = (SELECT id FROM clients WHERE companyName = 'Green Valley Homes' LIMIT 1);
SET @w1 = (SELECT id FROM warehouses WHERE name = 'Main Warehouse - Karachi' LIMIT 1);
SET @w2 = (SELECT id FROM warehouses WHERE name = 'Islamabad Branch Warehouse' LIMIT 1);
SET @p1 = (SELECT id FROM products WHERE sku = 'SINK-001' LIMIT 1);
SET @p2 = (SELECT id FROM products WHERE sku = 'SINK-002' LIMIT 1);
SET @p3 = (SELECT id FROM products WHERE sku = 'FAUCET-001' LIMIT 1);
SET @p4 = (SELECT id FROM products WHERE sku = 'FAUCET-002' LIMIT 1);
SET @p5 = (SELECT id FROM products WHERE sku = 'TOILET-001' LIMIT 1);
SET @p6 = (SELECT id FROM products WHERE sku = 'TOILET-002' LIMIT 1);

INSERT INTO invoices (id,invoiceNumber,clientId,warehouseId,invoiceDate,dueDate,paymentType,subtotal,taxAmount,taxRate,total,paidAmount,status,createdAt,updatedAt) VALUES
('inv_seed_001','INV-20260113-001',@c1,@w1,DATE_SUB(CURDATE(),INTERVAL 28 DAY),DATE_ADD(CURDATE(),INTERVAL 2 DAY),'CREDIT',2500,0,0,2500,0,'PENDING',NOW(),NOW()),
('inv_seed_002','INV-20260116-001',@c2,@w1,DATE_SUB(CURDATE(),INTERVAL 25 DAY),DATE_ADD(CURDATE(),INTERVAL 5 DAY),'CASH',4200,0,0,4200,4200,'PAID',NOW(),NOW()),
('inv_seed_003','INV-20260119-001',@c3,@w2,DATE_SUB(CURDATE(),INTERVAL 22 DAY),DATE_ADD(CURDATE(),INTERVAL 8 DAY),'CREDIT',7500,0,0,7500,2000,'PARTIAL',NOW(),NOW()),
('inv_seed_004','INV-20260121-001',@c4,@w1,DATE_SUB(CURDATE(),INTERVAL 20 DAY),DATE_ADD(CURDATE(),INTERVAL 10 DAY),'CASH',1600,0,0,1600,1600,'PAID',NOW(),NOW()),
('inv_seed_005','INV-20260123-001',@c5,@w2,DATE_SUB(CURDATE(),INTERVAL 18 DAY),DATE_ADD(CURDATE(),INTERVAL 12 DAY),'CREDIT',9600,0,0,9600,0,'PENDING',NOW(),NOW()),
('inv_seed_006','INV-20260126-001',@c1,@w1,DATE_SUB(CURDATE(),INTERVAL 15 DAY),DATE_ADD(CURDATE(),INTERVAL 15 DAY),'CASH',3550,0,0,3550,3550,'PAID',NOW(),NOW()),
('inv_seed_007','INV-20260129-001',@c2,@w1,DATE_SUB(CURDATE(),INTERVAL 12 DAY),DATE_ADD(CURDATE(),INTERVAL 18 DAY),'CREDIT',12800,0,0,12800,5000,'PARTIAL',NOW(),NOW()),
('inv_seed_008','INV-20260131-001',@c3,@w2,DATE_SUB(CURDATE(),INTERVAL 10 DAY),DATE_ADD(CURDATE(),INTERVAL 20 DAY),'CASH',5200,0,0,5200,5200,'PAID',NOW(),NOW()),
('inv_seed_009','INV-20260203-001',@c4,@w1,DATE_SUB(CURDATE(),INTERVAL 7 DAY),DATE_ADD(CURDATE(),INTERVAL 23 DAY),'CREDIT',15000,0,0,15000,0,'PENDING',NOW(),NOW()),
('inv_seed_010','INV-20260205-001',@c5,@w2,DATE_SUB(CURDATE(),INTERVAL 5 DAY),DATE_ADD(CURDATE(),INTERVAL 25 DAY),'CASH',6400,0,0,6400,6400,'PAID',NOW(),NOW()),
('inv_seed_011','INV-20260207-001',@c1,@w1,DATE_SUB(CURDATE(),INTERVAL 3 DAY),DATE_ADD(CURDATE(),INTERVAL 27 DAY),'CREDIT',8500,0,0,8500,3000,'PARTIAL',NOW(),NOW()),
('inv_seed_012','INV-20260208-001',@c3,@w1,DATE_SUB(CURDATE(),INTERVAL 2 DAY),DATE_ADD(CURDATE(),INTERVAL 28 DAY),'CASH',2720,0,0,2720,2720,'PAID',NOW(),NOW()),
('inv_seed_013','INV-20260209-001',@c2,@w2,DATE_SUB(CURDATE(),INTERVAL 1 DAY),DATE_ADD(CURDATE(),INTERVAL 29 DAY),'CREDIT',11200,0,0,11200,0,'PENDING',NOW(),NOW()),
('inv_seed_014','INV-20260210-001',@c4,@w1,CURDATE(),DATE_ADD(CURDATE(),INTERVAL 30 DAY),'CASH',4800,0,0,4800,4800,'PAID',NOW(),NOW()),
('inv_seed_015','INV-20260210-002',@c5,@w2,CURDATE(),DATE_ADD(CURDATE(),INTERVAL 30 DAY),'CREDIT',3500,0,0,3500,0,'PENDING',NOW(),NOW());

INSERT INTO invoice_items (id,invoiceId,productId,quantity,unitPrice,discount,total) VALUES
('ii_s01a','inv_seed_001',@p1,5,250,0,1250),
('ii_s01b','inv_seed_001',@p3,10,125,0,1250),
('ii_s02a','inv_seed_002',@p6,10,320,0,3200),
('ii_s02b','inv_seed_002',@p4,5,85,0,425),
('ii_s02c','inv_seed_002',@p3,4,125,5,475),
('ii_s03a','inv_seed_003',@p1,20,250,0,5000),
('ii_s03b','inv_seed_003',@p2,5,350,0,1750),
('ii_s03c','inv_seed_003',@p4,8,85,5,750),
('ii_s04a','inv_seed_004',@p5,8,200,0,1600),
('ii_s05a','inv_seed_005',@p6,20,320,0,6400),
('ii_s05b','inv_seed_005',@p1,8,250,0,2000),
('ii_s05c','inv_seed_005',@p3,8,125,5,1200),
('ii_s06a','inv_seed_006',@p2,6,350,0,2100),
('ii_s06b','inv_seed_006',@p4,15,85,0,1275),
('ii_s06c','inv_seed_006',@p5,1,200,10,175),
('ii_s07a','inv_seed_007',@p6,25,320,0,8000),
('ii_s07b','inv_seed_007',@p1,12,250,0,3000),
('ii_s07c','inv_seed_007',@p4,20,85,5,1800),
('ii_s08a','inv_seed_008',@p2,10,350,0,3500),
('ii_s08b','inv_seed_008',@p3,12,125,0,1500),
('ii_s08c','inv_seed_008',@p5,1,200,0,200),
('ii_s09a','inv_seed_009',@p1,30,250,0,7500),
('ii_s09b','inv_seed_009',@p6,15,320,0,4800),
('ii_s09c','inv_seed_009',@p2,5,350,0,1750),
('ii_s09d','inv_seed_009',@p3,6,125,5,950),
('ii_s10a','inv_seed_010',@p6,12,320,0,3840),
('ii_s10b','inv_seed_010',@p4,20,85,0,1700),
('ii_s10c','inv_seed_010',@p5,4,200,2,860),
('ii_s11a','inv_seed_011',@p1,15,250,0,3750),
('ii_s11b','inv_seed_011',@p2,8,350,0,2800),
('ii_s11c','inv_seed_011',@p3,15,125,2,1950),
('ii_s12a','inv_seed_012',@p6,5,320,0,1600),
('ii_s12b','inv_seed_012',@p4,8,85,0,680),
('ii_s12c','inv_seed_012',@p5,2,200,2,440),
('ii_s13a','inv_seed_013',@p1,20,250,0,5000),
('ii_s13b','inv_seed_013',@p6,10,320,0,3200),
('ii_s13c','inv_seed_013',@p2,4,350,0,1400),
('ii_s13d','inv_seed_013',@p3,10,125,4,1600),
('ii_s14a','inv_seed_014',@p6,10,320,0,3200),
('ii_s14b','inv_seed_014',@p1,4,250,0,1000),
('ii_s14c','inv_seed_014',@p4,6,85,5,600),
('ii_s15a','inv_seed_015',@p2,6,350,0,2100),
('ii_s15b','inv_seed_015',@p3,8,125,0,1000),
('ii_s15c','inv_seed_015',@p5,2,200,0,400);
