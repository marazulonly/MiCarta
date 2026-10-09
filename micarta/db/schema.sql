-- =============================================================================
-- MI CARTA SaaS - Esquema Relacional Multitenant para MySQL / MariaDB (cPanel)
-- Dominio de despliegue: https://aynis.pe/micarta
-- Motor: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "-05:00";

-- -----------------------------------------------------------------------------
-- 1. TABLA: restaurants (Multitenant - Sedes / Restaurantes)
-- Identificados de forma única por `id` y `slug` para URLs públicas (?r=slug)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `restaurants` (
  `id` VARCHAR(64) NOT NULL,
  `slug` VARCHAR(120) NOT NULL,
  `name` VARCHAR(180) NOT NULL,
  `tagline` VARCHAR(255) DEFAULT '',
  `cuisine_type` VARCHAR(120) DEFAULT 'VARIADA',
  `address` VARCHAR(255) DEFAULT '',
  `phone` VARCHAR(60) DEFAULT '',
  `rating` DECIMAL(3,2) DEFAULT 5.00,
  `review_count` INT UNSIGNED DEFAULT 1,
  `logo_url` LONGTEXT DEFAULT NULL,
  `cover_url` LONGTEXT DEFAULT NULL,
  `template_id` VARCHAR(80) DEFAULT 'tmpl-modern-seafood',
  `owner_id` VARCHAR(64) DEFAULT NULL,
  `is_open` TINYINT(1) NOT NULL DEFAULT 1,
  `currency` VARCHAR(16) DEFAULT 'S/',
  `total_tables_count` INT UNSIGNED DEFAULT 12,
  `branding_json` LONGTEXT DEFAULT NULL COMMENT 'Configuración visual, colores, fuentes y diseño de tarjetas',
  `metrics_json` TEXT DEFAULT NULL COMMENT 'KPIs y métricas operativas del restaurante',
  `menu_access_settings_json` TEXT DEFAULT NULL COMMENT 'Configuración Salón vs Delivery y fondos',
  `waiter_permissions_json` TEXT DEFAULT NULL,
  `kitchen_permissions_json` TEXT DEFAULT NULL,
  `delivery_permissions_json` TEXT DEFAULT NULL,
  `customer_access_settings_json` TEXT DEFAULT NULL,
  `weekly_schedule_json` LONGTEXT DEFAULT NULL,
  `shifts_json` LONGTEXT DEFAULT NULL,
  `tables_json` LONGTEXT DEFAULT NULL,
  `published_version` INT UNSIGNED DEFAULT 1,
  `published_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_restaurants_slug` (`slug`),
  KEY `idx_restaurants_owner` (`owner_id`),
  KEY `idx_restaurants_is_open` (`is_open`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. TABLA: users (Usuarios del Sistema: Admin, Dueños, Mozos, Cocina, Delivery)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL,
  `dni` VARCHAR(20) NOT NULL,
  `name` VARCHAR(180) NOT NULL,
  `email` VARCHAR(180) NOT NULL,
  `password` VARCHAR(255) NOT NULL DEFAULT '12345678',
  `role` ENUM('ADMIN','OWNER','RESTAURANT_MANAGER','KITCHEN','WAITER','DELIVERY','CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
  `phone` VARCHAR(60) DEFAULT '',
  `avatar` LONGTEXT DEFAULT NULL,
  `status` ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `last_active` VARCHAR(100) DEFAULT 'En línea',
  `created_by_owner_id` VARCHAR(64) DEFAULT NULL,
  `kitchen_station` VARCHAR(80) DEFAULT NULL,
  `vip_tier` VARCHAR(32) DEFAULT 'STANDARD',
  `vehicle_type` VARCHAR(32) DEFAULT NULL,
  `license_plate` VARCHAR(32) DEFAULT NULL,
  `assigned_shift` VARCHAR(32) DEFAULT NULL,
  `pin_code` VARCHAR(20) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `restaurant_ids_json` TEXT DEFAULT NULL COMMENT 'Lista JSON de IDs de restaurantes asignados',
  `waiter_permissions_json` TEXT DEFAULT NULL,
  `kitchen_permissions_json` TEXT DEFAULT NULL,
  `delivery_permissions_json` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_dni` (`dni`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. TABLA: user_restaurants (Relación N:M Usuario <-> Restaurante Multitenant)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_restaurants` (
  `user_id` VARCHAR(64) NOT NULL,
  `restaurant_id` VARCHAR(64) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `restaurant_id`),
  KEY `idx_ur_restaurant` (`restaurant_id`),
  CONSTRAINT `fk_ur_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ur_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. TABLA: categories (Categorías de Carta por Restaurante)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(64) NOT NULL,
  `restaurant_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(180) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 1,
  `icon_name` VARCHAR(80) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `target_menu_scope` ENUM('ALL','DINE_IN','DELIVERY') NOT NULL DEFAULT 'ALL',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_categories_restaurant_sort` (`restaurant_id`, `sort_order`),
  CONSTRAINT `fk_categories_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. TABLA: menu_items (Platos, Bebidas y Productos por Restaurante)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `menu_items` (
  `id` VARCHAR(64) NOT NULL,
  `restaurant_id` VARCHAR(64) NOT NULL,
  `category_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `image_url` LONGTEXT DEFAULT NULL,
  `is_available` TINYINT(1) NOT NULL DEFAULT 1,
  `is_popular` TINYINT(1) NOT NULL DEFAULT 0,
  `is_chef_special` TINYINT(1) NOT NULL DEFAULT 0,
  `prep_time_minutes` INT UNSIGNED NOT NULL DEFAULT 15,
  `target_menu_scope` ENUM('ALL','DINE_IN','DELIVERY') NOT NULL DEFAULT 'ALL',
  `sort_order` INT NOT NULL DEFAULT 0,
  `allergens_json` TEXT DEFAULT NULL COMMENT 'Array JSON de alérgenos',
  `tags_json` TEXT DEFAULT NULL COMMENT 'Array JSON de etiquetas',
  `available_addons_json` LONGTEXT DEFAULT NULL COMMENT 'Array JSON de adicionales {id, name, price}',
  `suggested_observations_json` TEXT DEFAULT NULL COMMENT 'Array JSON de observaciones sugeridas',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_items_restaurant` (`restaurant_id`),
  KEY `idx_items_category` (`category_id`),
  KEY `idx_items_available` (`restaurant_id`, `is_available`),
  CONSTRAINT `fk_items_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. TABLA: orders (Comandas de Salón, Para Llevar y Delivery por Restaurante)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(64) NOT NULL,
  `restaurant_id` VARCHAR(64) NOT NULL,
  `order_number` VARCHAR(40) NOT NULL,
  `type` ENUM('DINE_IN','TAKEAWAY','DELIVERY') NOT NULL DEFAULT 'DINE_IN',
  `status` ENUM('PENDING','IN_KITCHEN','READY','ON_THE_WAY','DELIVERED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `table_number` VARCHAR(40) DEFAULT NULL,
  `customer_id` VARCHAR(64) DEFAULT NULL,
  `customer_name` VARCHAR(180) NOT NULL,
  `customer_dni` VARCHAR(20) DEFAULT NULL,
  `customer_phone` VARCHAR(60) DEFAULT NULL,
  `customer_whatsapp` VARCHAR(60) DEFAULT NULL,
  `delivery_address` VARCHAR(255) DEFAULT NULL,
  `delivery_gps_location` VARCHAR(255) DEFAULT NULL,
  `delivery_reference` VARCHAR(255) DEFAULT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `tax` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `delivery_fee` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `payment_status` ENUM('PENDING','PAID','REFUNDED') NOT NULL DEFAULT 'PENDING',
  `estimated_minutes` INT UNSIGNED NOT NULL DEFAULT 20,
  `waiter_id` VARCHAR(64) DEFAULT NULL,
  `waiter_name` VARCHAR(180) DEFAULT NULL,
  `courier_id` VARCHAR(64) DEFAULT NULL,
  `courier_name` VARCHAR(180) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `items_json` LONGTEXT NOT NULL COMMENT 'Detalle completo de líneas y unidades de la comanda',
  `created_at_label` VARCHAR(80) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_orders_restaurant_status` (`restaurant_id`, `status`),
  KEY `idx_orders_created_at` (`created_at`),
  CONSTRAINT `fk_orders_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. TABLA: order_items (Detalle Relacional de Ítems por Comanda para Reportes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` VARCHAR(80) NOT NULL,
  `order_id` VARCHAR(64) NOT NULL,
  `restaurant_id` VARCHAR(64) NOT NULL,
  `menu_item_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `notes` TEXT DEFAULT NULL,
  `units_json` LONGTEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order` (`order_id`),
  KEY `idx_order_items_restaurant` (`restaurant_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- DATOS INICIALES (SEED DATA MULTITENANT)
-- =============================================================================

-- 1. Usuarios Iniciales (Administradores, Dueños y Staff Operativo)
INSERT INTO `users` (`id`, `dni`, `name`, `email`, `password`, `role`, `phone`, `avatar`, `status`, `last_active`, `restaurant_ids_json`) VALUES
('u-admin-herly', '00448157', 'Herly Lizarazo', 'herly.lizarazo@micarta.pe', 'password', 'ADMIN', '952341165', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', 'active', 'En línea', '[]'),
('u-ever-aguilar', '10203040', 'Ever Aguilar', 'ever.aguilar@micarta.pe', '12345678', 'ADMIN', '+51 980 102 030', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80', 'active', 'En línea', '[]'),
('u-owner-carlos', '21001001', 'Carlos Mendoza (Dueño)', 'carlos.owner@micarta.pe', '12345678', 'OWNER', '+51 987 654 321', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', 'active', 'Recién registrado', '["cevichito-pliz"]'),
('u-owner-mariana', '21001002', 'Mariana Silva (Dueño)', 'mariana.owner@micarta.pe', '12345678', 'OWNER', '+51 987 654 322', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80', 'active', 'Recién registrado', '["fuego-criollo"]'),
('u-manager-roberto', '31001001', 'Roberto Paredes (Gerente)', 'roberto.manager@micarta.pe', '12345678', 'RESTAURANT_MANAGER', '+51 987 654 323', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80', 'active', 'Recién registrado', '["cevichito-pliz"]'),
('u-kitchen-gaston', '41001001', 'Chef Gastón Rivas (Cocina)', 'gaston.chef@micarta.pe', '12345678', 'KITCHEN', '+51 987 654 325', 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=120&auto=format&fit=crop&q=80', 'active', 'Recién registrado', '["cevichito-pliz"]'),
('u-waiter-mateo', '51001001', 'Mateo Flores (Mesero)', 'mateo.mesero@micarta.pe', '12345678', 'WAITER', '+51 987 654 327', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80', 'active', 'Recién registrado', '["cevichito-pliz"]'),
('u-waiter-camila', '51001002', 'Camila Vega (Mesero)', 'camila.mesero@micarta.pe', '12345678', 'WAITER', '+51 987 654 328', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80', 'active', 'Recién registrado', '["fuego-criollo"]'),
('u-delivery-diego', '61001001', 'Diego Quispe (Delivery)', 'diego.rider@micarta.pe', '12345678', 'DELIVERY', '+51 987 654 329', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80', 'active', 'Recién registrado', '["cevichito-pliz"]'),
('u-delivery-sofia', '61001002', 'Sofía Torres (Delivery)', 'sofia.rider@micarta.pe', '12345678', 'DELIVERY', '+51 987 654 330', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80', 'active', 'Recién registrado', '["fuego-criollo"]')
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `email` = VALUES(`email`),
  `role` = VALUES(`role`);

-- 2. Restaurantes Iniciales (Multitenant)
INSERT INTO `restaurants` (
  `id`, `slug`, `name`, `tagline`, `cuisine_type`, `address`, `phone`, `rating`, `review_count`,
  `logo_url`, `cover_url`, `template_id`, `owner_id`, `is_open`, `total_tables_count`,
  `branding_json`, `metrics_json`, `menu_access_settings_json`
) VALUES
(
  'cevichito-pliz',
  'cevichito-pliz',
  'Cevichito Pliz',
  'Sazón Norteña & Pescados Frescos del Día',
  'Cevichería & Mariscos',
  'Av. La Marina 1420, San Miguel, Lima',
  '+51 987 111 222',
  4.90,
  148,
  'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
  'tmpl-modern-seafood',
  'u-owner-carlos',
  1,
  12,
  '{"primaryColor":"#0284C7","secondaryColor":"#0EA5E9","accentColor":"#F59E0B","darkBgColor":"#0F172A","cardBgColor":"#1E293B","textColor":"#F8FAFC","fontDisplay":"Outfit","cardStyle":"grid","headerStyle":"banner"}',
  '{"dailyRevenue":3420,"activeOrders":6,"avgTicket":58.5,"customerRating":4.9,"totalTables":12,"occupancyRate":75}',
  '{"menuMode":"SAME","enableDineIn":true,"enableDelivery":true,"presentialTitle":"Carta Salón & Terraza","deliveryTitle":"Delivery Marino","deliveryMinOrder":30,"deliveryEstimatedMinutes":35}'
),
(
  'fuego-criollo',
  'fuego-criollo',
  'El Fuego Criollo',
  'Pollo a la Brasa & Parrillas a la Leña',
  'Pollería & Parrillas',
  'Calle Primavera 850, Surco, Lima',
  '+51 987 333 444',
  4.80,
  210,
  'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
  'tmpl-fire-grill',
  'u-owner-mariana',
  1,
  16,
  '{"primaryColor":"#DC2626","secondaryColor":"#EA580C","accentColor":"#F59E0B","darkBgColor":"#18181B","cardBgColor":"#27272A","textColor":"#FAFAFA","fontDisplay":"Outfit","cardStyle":"horizontal","headerStyle":"banner"}',
  '{"dailyRevenue":4890,"activeOrders":8,"avgTicket":68.0,"customerRating":4.8,"totalTables":16,"occupancyRate":82}',
  '{"menuMode":"SAME","enableDineIn":true,"enableDelivery":true,"presentialTitle":"Carta de Salón & Parrillas","deliveryTitle":"Delivery Pollo & Parrillas","deliveryMinOrder":25,"deliveryEstimatedMinutes":30}'
)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `slug` = VALUES(`slug`);

-- 3. Relación Usuarios <-> Restaurantes
INSERT IGNORE INTO `user_restaurants` (`user_id`, `restaurant_id`) VALUES
('u-owner-carlos', 'cevichito-pliz'),
('u-owner-mariana', 'fuego-criollo'),
('u-manager-roberto', 'cevichito-pliz'),
('u-kitchen-gaston', 'cevichito-pliz'),
('u-waiter-mateo', 'cevichito-pliz'),
('u-waiter-camila', 'fuego-criollo'),
('u-delivery-diego', 'cevichito-pliz'),
('u-delivery-sofia', 'fuego-criollo');

-- 4. Categorías Iniciales
INSERT INTO `categories` (`id`, `restaurant_id`, `name`, `description`, `sort_order`, `is_active`, `target_menu_scope`) VALUES
('cat-mar-1', 'cevichito-pliz', 'Ceviches & Entradas Marinas', 'Pescados frescos del día con ají limo, camote glaseado y choclo desgranado', 1, 1, 'ALL'),
('cat-mar-2', 'cevichito-pliz', 'Platos de Fondo & Arroces', 'Especialidades calientes salteadas al wok y guisos marinos', 2, 1, 'ALL'),
('cat-mar-3', 'cevichito-pliz', 'Bebidas & Cocteles', 'Refrescos naturales y cocteles de autor', 3, 1, 'ALL'),
('cat-fuego-1', 'fuego-criollo', 'Pollos a la Brasa & Combos', 'Sabor tradicional a la leña acompañado de papas crocantes y ensalada', 1, 1, 'ALL'),
('cat-fuego-2', 'fuego-criollo', 'Cortes a la Parrilla', 'Cortes selectos al término de su preferencia con chimichurri de la casa', 2, 1, 'ALL'),
('cat-fuego-3', 'fuego-criollo', 'Guarniciones & Bebidas', 'Papas, ensaladas extras y gaseosas frías', 3, 1, 'ALL')
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `sort_order` = VALUES(`sort_order`);

-- 5. Platos Iniciales (Menu Items)
INSERT INTO `menu_items` (
  `id`, `restaurant_id`, `category_id`, `name`, `description`, `price`, `image_url`,
  `is_available`, `is_popular`, `prep_time_minutes`, `allergens_json`, `tags_json`, `suggested_observations_json`
) VALUES
(
  'item-mar-1', 'cevichito-pliz', 'cat-mar-1',
  'Ceviche Clásico Mixto',
  'Pesca del día, calamar, langostino y pulpo con leche de tigre tradicional, cancha y camote',
  42.00,
  'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=600&auto=format&fit=crop&q=80',
  1, 1, 12,
  '["Mariscos","Pescado"]',
  '["Ceviche","Popular","Pescados"]',
  '["Sin Picante","Picante Medio","Bien Picante"]'
),
(
  'item-mar-2', 'cevichito-pliz', 'cat-mar-1',
  'Chicharrón de Calamar Crocante',
  'Aros de calamar crujientes acompañados de yuca frita y salsa tártara de la casa',
  38.00,
  'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80',
  1, 0, 15,
  '["Mariscos","Gluten"]',
  '["Chicharrón","Entrada"]',
  '[]'
),
(
  'item-mar-3', 'cevichito-pliz', 'cat-mar-2',
  'Arroz con Mariscos a la Norteña',
  'Arroz criollo ahumado al wok con mariscos seleccionados, sarza criolla y toque de ají amarillo',
  45.00,
  'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
  1, 1, 18,
  '["Mariscos"]',
  '["Arroz","Fondo"]',
  '[]'
),
(
  'item-mar-4', 'cevichito-pliz', 'cat-mar-3',
  'Chicha Morada Artesanal 1L',
  'Elaborada diariamente con maíz morado, piña, membrillo, manzana y especias',
  18.00,
  'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
  1, 0, 3,
  '[]',
  '["Bebida","Refresco"]',
  '["Helada","Sin Hielo"]'
),
(
  'item-fuego-1', 'fuego-criollo', 'cat-fuego-1',
  '1/2 Pollo a la Brasa + Papas + Ensalada',
  'Medio pollo dorado a la leña, papas amarillas crocantes, ensalada fresca y cremas artesanales',
  39.00,
  'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80',
  1, 1, 15,
  '[]',
  '["Pollo","Brasa","Combo"]',
  '["Papas bien doradas","Con bastante ají"]'
),
(
  'item-fuego-2', 'fuego-criollo', 'cat-fuego-1',
  'Pollo Entero Familiar + Papas Grandes',
  '1 pollo entero a la brasa, porción familiar de papas crocantes, ensalada familiar y cremas',
  72.00,
  'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80',
  1, 1, 20,
  '[]',
  '["Familiar","Pollo"]',
  '[]'
),
(
  'item-fuego-3', 'fuego-criollo', 'cat-fuego-2',
  'Bife de Ancho 350g a la Leña',
  'Corte jugoso de res madurada, sazonada con sal marina y chimichurri artesanal de hierbas',
  58.00,
  'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop&q=80',
  1, 0, 22,
  '[]',
  '["Parrilla","Carne"]',
  '["Término 3/4","Término Medio","Bien Cocido"]'
),
(
  'item-fuego-4', 'fuego-criollo', 'cat-fuego-3',
  'Inca Kola 1.5L',
  'Gaseosa helada en botella familiar',
  12.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
  1, 0, 2,
  '[]',
  '["Bebida","Gaseosa"]',
  '["Helada","Al Tiempo"]'
)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `price` = VALUES(`price`);

SET FOREIGN_KEY_CHECKS = 1;
