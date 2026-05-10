-- ============================================================
-- TAMILARASU ENTERPRISES — Database Schema
-- MySQL 8.x
-- ============================================================

-- Drop tables in reverse dependency order (for clean re-runs)
DROP TABLE IF EXISTS order_status_history;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS users;

-- ============================================================
-- users
-- ============================================================
CREATE TABLE users (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    email           VARCHAR(255)    NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    name            VARCHAR(255)    NOT NULL,
    phone           VARCHAR(20),
    role            ENUM('CUSTOMER','ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    locked          BOOLEAN         NOT NULL DEFAULT FALSE,
    failed_attempts INT             NOT NULL DEFAULT 0,
    lock_time       TIMESTAMP       NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- categories
-- ============================================================
CREATE TABLE categories (
    id      BIGINT          NOT NULL AUTO_INCREMENT,
    name    VARCHAR(255)    NOT NULL,
    slug    VARCHAR(255)    NOT NULL,
    CONSTRAINT pk_categories PRIMARY KEY (id),
    CONSTRAINT uq_categories_slug UNIQUE (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- products
-- ============================================================
CREATE TABLE products (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    name        VARCHAR(255)    NOT NULL,
    description TEXT,
    price       DECIMAL(10,2)   NOT NULL,
    category_id BIGINT          NOT NULL,
    active      BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_products PRIMARY KEY (id),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id)
        REFERENCES categories (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for products
CREATE INDEX idx_products_name        ON products (name);
CREATE INDEX idx_products_category_id ON products (category_id);
ALTER TABLE products ADD FULLTEXT INDEX ft_products_name_description (name, description);

-- ============================================================
-- product_images
-- ============================================================
CREATE TABLE product_images (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    product_id  BIGINT          NOT NULL,
    url         VARCHAR(500)    NOT NULL,
    sort_order  INT             NOT NULL DEFAULT 0,
    CONSTRAINT pk_product_images PRIMARY KEY (id),
    CONSTRAINT fk_product_images_product FOREIGN KEY (product_id)
        REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- inventory
-- ============================================================
CREATE TABLE inventory (
    id           BIGINT   NOT NULL AUTO_INCREMENT,
    product_id   BIGINT   NOT NULL,
    quantity     INT      NOT NULL DEFAULT 0,
    out_of_stock BOOLEAN  NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_inventory PRIMARY KEY (id),
    CONSTRAINT uq_inventory_product UNIQUE (product_id),
    CONSTRAINT fk_inventory_product FOREIGN KEY (product_id)
        REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- carts
-- ============================================================
CREATE TABLE carts (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    user_id     BIGINT          NULL,
    session_id  VARCHAR(255)    NULL,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_carts PRIMARY KEY (id),
    CONSTRAINT fk_carts_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- cart_items
-- ============================================================
CREATE TABLE cart_items (
    id          BIGINT  NOT NULL AUTO_INCREMENT,
    cart_id     BIGINT  NOT NULL,
    product_id  BIGINT  NOT NULL,
    quantity    INT     NOT NULL DEFAULT 1,
    CONSTRAINT pk_cart_items PRIMARY KEY (id),
    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id)
        REFERENCES carts (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id)
        REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- orders
-- ============================================================
CREATE TABLE orders (
    id               BIGINT          NOT NULL AUTO_INCREMENT,
    order_number     VARCHAR(50)     NOT NULL,
    user_id          BIGINT          NOT NULL,
    subtotal         DECIMAL(10,2)   NOT NULL,
    tax              DECIMAL(10,2)   NOT NULL,
    total            DECIMAL(10,2)   NOT NULL,
    status           ENUM('PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED')
                                     NOT NULL DEFAULT 'PENDING',
    delivery_address TEXT            NOT NULL,
    contact_phone    VARCHAR(20)     NOT NULL,
    created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_orders PRIMARY KEY (id),
    CONSTRAINT uq_orders_order_number UNIQUE (order_number),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for orders
CREATE INDEX idx_orders_status     ON orders (status);
CREATE INDEX idx_orders_created_at ON orders (created_at);
CREATE INDEX idx_orders_user_id    ON orders (user_id);

-- ============================================================
-- order_items
-- ============================================================
CREATE TABLE order_items (
    id           BIGINT          NOT NULL AUTO_INCREMENT,
    order_id     BIGINT          NOT NULL,
    product_id   BIGINT          NOT NULL,
    product_name VARCHAR(255)    NOT NULL,
    unit_price   DECIMAL(10,2)   NOT NULL,
    quantity     INT             NOT NULL,
    CONSTRAINT pk_order_items PRIMARY KEY (id),
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id)
        REFERENCES products (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- order_status_history
-- ============================================================
CREATE TABLE order_status_history (
    id         BIGINT  NOT NULL AUTO_INCREMENT,
    order_id   BIGINT  NOT NULL,
    status     ENUM('PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED') NOT NULL,
    reason     TEXT    NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_order_status_history PRIMARY KEY (id),
    CONSTRAINT fk_order_status_history_order FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- reports
-- ============================================================
CREATE TABLE reports (
    id           BIGINT          NOT NULL AUTO_INCREMENT,
    report_date  DATE            NOT NULL,
    total_sales  DECIMAL(12,2)   NOT NULL,
    order_count  INT             NOT NULL,
    top_products JSON            NOT NULL,
    generated_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_reports PRIMARY KEY (id),
    CONSTRAINT uq_reports_report_date UNIQUE (report_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
