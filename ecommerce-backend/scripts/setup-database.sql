-- E-Commerce Database Setup Script
-- This script creates the database and initial data

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS ecommerce_db;

-- Connect to the database
\c ecommerce_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create initial admin user (password: Admin123!)
-- Note: This will be handled by the application's seeding mechanism

-- Sample data for testing (will be inserted by TypeORM)
-- Categories
INSERT INTO categories (id, name, description, "createdAt", "updatedAt") VALUES
  (uuid_generate_v4(), 'Electronics', 'Electronic devices and accessories', NOW(), NOW()),
  (uuid_generate_v4(), 'Clothing', 'Fashion and clothing items', NOW(), NOW()),
  (uuid_generate_v4(), 'Books', 'Books and educational materials', NOW(), NOW()),
  (uuid_generate_v4(), 'Home & Garden', 'Home improvement and garden supplies', NOW(), NOW()),
  (uuid_generate_v4(), 'Sports', 'Sports equipment and accessories', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Note: Products, Users, and Orders will be created through the API
-- This script is mainly for initial database setup and sample categories

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products (categoryId);
CREATE INDEX IF NOT EXISTS idx_products_active ON products (isActive);
CREATE INDEX IF NOT EXISTS idx_products_price ON products (price);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products (stock);
CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (userId);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (createdAt);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (orderId);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items (productId);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users (isActive);

-- Performance optimization settings
ANALYZE;