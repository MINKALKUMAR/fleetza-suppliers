-- =========================================================================
-- FLEETZA TAXI SUPPLIER & VEHICLE MANAGEMENT SYSTEM
-- MySQL Database Schema (Safe for Production & Hosting)
-- Preserves existing tables and data with 'IF NOT EXISTS'
-- =========================================================================

CREATE DATABASE IF NOT EXISTS `fleetza_suppliers` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `fleetza_suppliers`;

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS `roles` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users Table (Admin, Dispatcher, Suppliers/DCOs)
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `company_name` VARCHAR(100) DEFAULT NULL,
    `city` VARCHAR(100) DEFAULT NULL,
    `whatsapp` VARCHAR(20) DEFAULT NULL,
    `email` VARCHAR(100) DEFAULT NULL,
    `mobile` VARCHAR(20) DEFAULT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    `requires_password_change` BOOLEAN NOT NULL DEFAULT FALSE,
    `supplier_id` BIGINT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_username` (`username`),
    INDEX `idx_users_city` (`city`),
    INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. User Roles Join Table
CREATE TABLE IF NOT EXISTS `user_roles` (
    `user_id` BIGINT NOT NULL,
    `role_id` BIGINT NOT NULL,
    PRIMARY KEY (`user_id`, `role_id`),
    CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Vehicles Table
CREATE TABLE IF NOT EXISTS `vehicles` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `vehicle_number` VARCHAR(30) NOT NULL UNIQUE,
    `model` VARCHAR(50) NOT NULL,
    `supplier_id` BIGINT NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_vehicles_supplier` (`supplier_id`),
    INDEX `idx_vehicles_status` (`status`),
    INDEX `idx_vehicles_number` (`vehicle_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Booking Requests Table
CREATE TABLE IF NOT EXISTS `booking_requests` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `vehicle_id` BIGINT NOT NULL,
    `supplier_id` BIGINT NOT NULL,
    `message` VARCHAR(500) DEFAULT NULL,
    `remarks` VARCHAR(500) DEFAULT NULL,
    `pickup_date` VARCHAR(30) DEFAULT NULL,
    `pickup_time` VARCHAR(30) DEFAULT NULL,
    `duty_type` VARCHAR(50) DEFAULT '4/40',
    `pickup_location` VARCHAR(200) DEFAULT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'REQUESTED',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `completed_at` DATETIME DEFAULT NULL,
    INDEX `idx_booking_supplier` (`supplier_id`),
    INDEX `idx_booking_vehicle` (`vehicle_id`),
    INDEX `idx_booking_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `recipient_id` VARCHAR(50) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `message` VARCHAR(500) NOT NULL,
    `request_id` BIGINT DEFAULT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_notifications_recipient` (`recipient_id`),
    INDEX `idx_notifications_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Cities Table
CREATE TABLE IF NOT EXISTS `cities` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_cities_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial Core Roles
INSERT IGNORE INTO `roles` (`name`) VALUES
('ROLE_SUPER_ADMIN'),
('ROLE_ADMIN'),
('ROLE_DISPATCHER'),
('ROLE_SUPPLIER');

-- Initial Core Cities
INSERT IGNORE INTO `cities` (`name`) VALUES
('Chandigarh'),
('Ludhiana'),
('Jalandhar'),
('Amritsar'),
('Bathinda'),
('Ambala'),
('Jammu');
