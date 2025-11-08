-- MySQL Initialization Script for Hisham Traders ERP
-- This script runs automatically when MySQL container starts

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS hisham_erp;

-- Create user if it doesn't exist
CREATE USER IF NOT EXISTS 'hisham_user'@'%' IDENTIFIED BY 'hisham_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON hisham_erp.* TO 'hisham_user'@'%';
FLUSH PRIVILEGES;

-- Set default database
USE hisham_erp;

-- Character set
ALTER DATABASE hisham_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
