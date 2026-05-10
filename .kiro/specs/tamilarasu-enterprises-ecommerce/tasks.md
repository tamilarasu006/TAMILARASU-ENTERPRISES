# Implementation Plan: TAMILARASU ENTERPRISES E-Commerce Website

## Overview

Incremental implementation of the e-commerce platform using Java (Spring Boot backend), HTML/CSS/JS (frontend), SQL (MySQL/PostgreSQL), and Python (scripting/automation). Tasks are ordered to build foundational layers first, then feature layers, then automation. All 43 correctness properties from the design document are validated through property-based tests and unit tests.

## Tasks

- [-] 1. Set up project structure and database schema
  - Create Maven project with Spring Boot, Spring MVC, Spring Security, Spring Data JPA dependencies
  - Create SQL schema: `users`, `products`, `categories`, `product_images`, `inventory`, `carts`, `cart_items`, `orders`, `order_items`, `order_status_history`, `reports` tables
  - Configure `application.properties` for datasource, connection pool (min 10), and JPA
  - Set up HikariCP connection pool with minimum pool size of 10
  - _Requirements: 1.1, 14.4_

  - [ ]* 1.1 Write property test for database schema integrity
    - **Property 1: Registration round-trip creates account and queues welcome email**
    - **Validates: Requirements 1.2, 15.1**

- [ ] 2. Implement User Registration and Authentication
  - [x] 2.1 Create `User` JPA entity and `UserRepository`
    - Map to `users` table with fields: id, email, password_hash, name, phone, role, locked, failed_attempts, lock_time, created_at
    - _Requirements: 1.1, 1.4, 12.4_

  - [~] 2.2 Implement `UserService` with registration logic
    - Hash and salt passwords using BCrypt before persisting
    - Reject duplicate emails with descriptive error
    - Queue welcome email on successful registration
    - _Requirements: 1.2, 1.3, 1.4, 15.1_

  - [ ]* 2.3 Write property test for duplicate email rejection
    - **Property 2: Duplicate email registration is rejected**
    - **Validates: Requirements 1.3**

  - [ ]* 2.4 Write property test for password hashing
    - **Property 3: Passwords are never stored in plaintext**
    - **Validates: Requirements 1.4**

  - [~] 2.5 Implement Spring Security configuration
    - Configure session timeout to 30 minutes of inactivity
    - Enforce password complexity (min 8 chars, letters + numbers) at registration
    - Implement account lockout after 5 failed attempts within 15 minutes (lock for 30 min)
    - _Requirements: 1.5, 1.6, 1.7, 12.4, 12.7_

  - [ ]* 2.6 Write property test for authentication correctness
    - **Property 4: Authentication correctness - correct credentials grant session, incorrect deny access**
    - **Validates: Requirements 1.5, 1.6**

  - [ ]* 2.7 Write property test for account lockout
    - **Property 5: Account lockout after repeated failures**
    - **Validates: Requirements 12.7**

  - [ ]* 2.8 Write property test for password complexity
    - **Property 6: Password complexity enforcement**
    - **Validates: Requirements 12.4**

  - [~] 2.9 Implement role-based access control
    - Define `CUSTOMER` and `ADMIN` roles
    - Secure `/admin/**` endpoints to `ADMIN` role only
    - _Requirements: 12.6_

  - [ ]* 2.10 Write property test for admin endpoint access control
    - **Property 40: Admin endpoints require admin role**
    - **Validates: Requirements 12.6**

- [ ] 3. Implement Product Catalog backend
  - [x] 3.1 Create `Product`, `Category`, `ProductImage` JPA entities and repositories
    - Map to `products`, `categories`, `product_images` tables
    - _Requirements: 2.1, 7.1_

  - [~] 3.2 Implement `ProductService` with search, filter, sort, and pagination
    - Full-text search on name and description with partial word matching
    - Rank exact matches first
    - Pagination: 20 products per page
    - Filter by category; sort by price, name, date added
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 11.1, 11.2, 11.3_

  - [ ]* 3.3 Write property test for product catalog display
    - **Property 7: Product catalog displays required fields**
    - **Validates: Requirements 2.1, 2.6**

  - [ ]* 3.4 Write property test for pagination size
    - **Property 8: Pagination size invariant - exactly 20 products per page**
    - **Validates: Requirements 2.2**

  - [ ]* 3.5 Write property test for search matching
    - **Property 9: Search returns only matching products**
    - **Validates: Requirements 2.3, 11.2**

  - [ ]* 3.6 Write property test for category filtering
    - **Property 10: Category filter returns only matching products**
    - **Validates: Requirements 2.4**

  - [ ]* 3.7 Write property test for sort order
    - **Property 11: Sort order invariant**
    - **Validates: Requirements 2.5**

  - [ ]* 3.8 Write property test for search ranking
    - **Property 12: Exact matches rank before partial matches**
    - **Validates: Requirements 11.3**

  - [~] 3.9 Implement search suggestions endpoint
    - Return top popular queries matching the prefix
    - _Requirements: 11.5_

  - [ ]* 3.10 Write property test for search suggestions
    - **Property 43: Search suggestions match query prefix**
    - **Validates: Requirements 11.5**

  - [~] 3.11 Create `ProductController` REST endpoints
    - `GET /api/products` (paginated, filterable, sortable)
    - `GET /api/products/{id}` (detail with availability)
    - `GET /api/products/search?q=` (with suggestions)
    - Enforce 500ms response time via query optimization and indexing
    - _Requirements: 2.1, 2.6, 11.1, 11.4_

- [ ] 4. Implement Inventory System
  - [x] 4.1 Create `Inventory` JPA entity and `InventoryRepository`
    - Track stock quantity per product
    - _Requirements: 6.1_

  - [~] 4.2 Implement `InventoryService`
    - Mark product out-of-stock when quantity reaches zero
    - Restore quantities on order cancellation
    - Decrement quantities on order creation
    - _Requirements: 4.8, 6.2, 6.6_

  - [x]* 4.3 Write property test for inventory consistency
    - **Property 19: Inventory decrements match order quantities**
    - **Validates: Requirements 4.8, 6.1**

  - [x]* 4.4 Write property test for out-of-stock marking
    - **Property 24: Out-of-stock products are hidden from add-to-cart**
    - **Validates: Requirements 6.2, 6.3**

  - [x]* 4.5 Write property test for low-stock report
    - **Property 25: Low stock report contains only qualifying products**
    - **Validates: Requirements 6.5**

  - [x]* 4.6 Write property test for inventory restoration
    - **Property 26: Order cancellation restores inventory**
    - **Validates: Requirements 6.6**

- [~] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement Shopping Cart
  - [~] 6.1 Create `Cart` and `CartItem` JPA entities and repositories
    - Support both authenticated users (user_id) and guests (session_id)
    - _Requirements: 3.6, 3.7_

  - [~] 6.2 Implement `CartService`
    - Add product (quantity 1); increment if already present
    - Update quantity; remove item; calculate subtotal, tax, total
    - Persist to DB for authenticated users; use session storage for guests
    - Merge guest cart to DB on login
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 6.3 Write property test for cart add increment
    - **Property 13: Cart add increments quantity correctly**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 6.4 Write property test for cart total calculation
    - **Property 14: Cart total calculation invariant**
    - **Validates: Requirements 3.5**

  - [ ]* 6.5 Write property test for authenticated cart persistence
    - **Property 15: Authenticated cart persists to database**
    - **Validates: Requirements 3.7**

  - [~] 6.6 Create `CartController` REST endpoints
    - `POST /api/cart/items`, `PUT /api/cart/items/{id}`, `DELETE /api/cart/items/{id}`, `GET /api/cart`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 7. Implement Order Placement and Checkout
  - [~] 7.1 Create `Order`, `OrderItem`, `OrderStatusHistory` JPA entities and repositories
    - Store product_name and unit_price as snapshots in OrderItem
    - _Requirements: 4.5, 5.4_

  - [~] 7.2 Implement `OrderService` checkout logic
    - Validate inventory before checkout; block and notify if insufficient
    - Generate unique order number on successful payment
    - Decrement inventory on order creation
    - Queue order confirmation email
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.8, 15.2_

  - [ ]* 7.3 Write property test for checkout inventory validation
    - **Property 16: Checkout blocked on insufficient inventory**
    - **Validates: Requirements 4.2, 4.3**

  - [ ]* 7.4 Write property test for successful payment
    - **Property 17: Successful payment creates unique order and queues confirmation email**
    - **Validates: Requirements 4.5, 4.6, 15.2**

  - [~] 7.5 Implement Payment Gateway integration
    - Integrate with payment provider API for credit/debit card processing
    - Do not store card numbers in the database
    - Handle payment failure with retry-friendly error response
    - _Requirements: 4.4, 4.7, 12.5_

  - [ ]* 7.6 Write property test for payment failure atomicity
    - **Property 18: Failed payment leaves no order and no inventory change**
    - **Validates: Requirements 4.7, 4.8**

  - [ ]* 7.7 Write property test for credit card data protection
    - **Property 41: Credit card data never persisted**
    - **Validates: Requirements 12.5**

  - [~] 7.8 Create `OrderController` REST endpoints
    - `POST /api/orders/checkout`, `GET /api/orders`, `GET /api/orders/{id}`
    - _Requirements: 4.1, 5.1, 5.3_

- [ ] 8. Implement Order Tracking and History
  - [~] 8.1 Implement order status update logic in `OrderService`
    - Support status transitions: Pending → Processing → Shipped → Delivered / Cancelled
    - Trigger email notification on status change
    - _Requirements: 5.4, 5.5, 15.3_

  - [ ]* 8.2 Write property test for order history completeness
    - **Property 20: Order history completeness**
    - **Validates: Requirements 5.1**

  - [ ]* 8.3 Write property test for order display fields
    - **Property 21: Order display contains required fields**
    - **Validates: Requirements 5.2, 5.3**

  - [ ]* 8.4 Write property test for order status validity
    - **Property 22: Order status is always a valid value**
    - **Validates: Requirements 5.4**

  - [ ]* 8.5 Write property test for status change notification
    - **Property 23: Status change triggers notification email**
    - **Validates: Requirements 5.5, 15.3**

- [ ] 9. Implement Admin Panel — Product Management
  - [~] 9.1 Create `AdminProductController` secured endpoints
    - `POST /admin/products` — create with name, description, price, category, images (max 5)
    - `PUT /admin/products/{id}` — edit
    - `DELETE /admin/products/{id}` — deactivate (soft delete)
    - Validate positive price and required fields
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 9.2 Write property test for product CRUD round-trip
    - **Property 27: Product CRUD round-trip**
    - **Validates: Requirements 7.1, 7.2**

  - [ ]* 9.3 Write property test for deactivated products
    - **Property 28: Deactivated products excluded from customer catalog**
    - **Validates: Requirements 7.3**

  - [ ]* 9.4 Write property test for invalid product data
    - **Property 29: Invalid product data is rejected**
    - **Validates: Requirements 7.4, 7.6**

  - [ ]* 9.5 Write property test for image upload limit
    - **Property 30: Image upload limit enforced**
    - **Validates: Requirements 7.5**

- [ ] 10. Implement Admin Panel — Inventory and Order Management
  - [~] 10.1 Create `AdminInventoryController`
    - `PUT /admin/inventory/{productId}` — update stock quantity
    - `GET /admin/inventory/low-stock` — products with quantity < 10
    - _Requirements: 6.4, 6.5_

  - [~] 10.2 Create `AdminOrderController`
    - `GET /admin/orders` — list with filters (status, date range, customer)
    - `PUT /admin/orders/{id}/status` — update status
    - `POST /admin/orders/{id}/cancel` — cancel with reason, trigger refund, notify customer
    - `GET /admin/orders/export` — generate CSV
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 10.3 Write property test for admin order filtering
    - **Property 31: Admin order filter returns only matching orders**
    - **Validates: Requirements 8.1**

  - [ ]* 10.4 Write property test for admin order cancellation
    - **Property 32: Admin cancellation triggers refund and notification**
    - **Validates: Requirements 8.4, 8.5**

  - [ ]* 10.5 Write property test for order CSV export
    - **Property 33: Order CSV export contains all order data**
    - **Validates: Requirements 8.6**

- [~] 11. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement Python automation scripts
  - [~] 12.1 Write `daily_report.py`
    - Query DB for total sales, order count, top-selling products for the previous day
    - Store report record in `reports` table
    - Send report email to configured admin addresses with retry logic
    - Schedule via cron at midnight
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 12.2 Write property test for daily report generation
    - **Property 34: Daily report generation round-trip**
    - **Validates: Requirements 9.1, 9.4**

  - [ ]* 12.3 Write property test for report email distribution
    - **Property 35: Daily report is sent to all configured admin addresses**
    - **Validates: Requirements 9.2**

  - [~] 12.4 Write `csv_import.py`
    - Accept CSV file path as argument
    - Validate format and data types; output row-level error report on failure
    - On valid file, call Java REST API to create/update products
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6_

  - [ ]* 12.5 Write property test for CSV validation
    - **Property 36: CSV validation identifies all invalid rows**
    - **Validates: Requirements 10.2, 10.3**

  - [ ]* 12.6 Write property test for CSV import success
    - **Property 37: Valid CSV import creates or updates all products**
    - **Validates: Requirements 10.4**

  - [~] 12.7 Write `csv_export.py`
    - Query all products from DB and write to CSV
    - Expose via `GET /admin/products/export` endpoint (Java calls script or replicates logic)
    - _Requirements: 10.5, 10.6_

  - [ ]* 12.8 Write property test for CSV export round-trip
    - **Property 38: Product CSV export round-trip**
    - **Validates: Requirements 10.5**

  - [~] 12.9 Write `email_notifier.py`
    - Reusable module for sending transactional emails with retry logic
    - Used by daily_report.py and called from Java via process or REST
    - _Requirements: 15.4_

- [ ] 13. Implement Security hardening
  - [~] 13.1 Enforce HTTPS and input sanitization
    - Configure HTTPS in Spring Boot (or reverse proxy)
    - Add input validation/sanitization on all controllers to prevent SQL injection and XSS
    - Use parameterized queries / JPA throughout (no string-concatenated SQL)
    - _Requirements: 12.1, 12.2, 12.3_

  - [ ]* 13.2 Write property test for input sanitization
    - **Property 39: Input sanitization rejects injection payloads**
    - **Validates: Requirements 12.2, 12.3**

- [ ] 14. Implement HTML Frontend
  - [~] 14.1 Create base HTML layout with responsive CSS
    - Responsive grid from 320px to 1920px
    - Hamburger menu for mobile navigation
    - Touch targets minimum 44px on mobile
    - _Requirements: 13.1, 13.2, 13.3_

  - [~] 14.2 Build product catalog page (`catalog.html`)
    - Responsive product grid (adjusts columns by screen width)
    - Search bar with suggestions, category filter, sort controls, pagination (20/page)
    - Out-of-stock indicator; disabled add-to-cart for out-of-stock items
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.3, 11.4, 13.4_

  - [~] 14.3 Build product detail page (`product.html`)
    - Display name, images, price, description, specifications, availability
    - Add to cart button; image caching via browser cache headers
    - _Requirements: 2.6, 14.5_

  - [~] 14.4 Build shopping cart page (`cart.html`)
    - List cart items with quantity controls and remove buttons
    - Display subtotal, tax, total; proceed to checkout button
    - Use sessionStorage for guest cart; sync to server for authenticated users
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [~] 14.5 Build checkout and registration/login pages
    - `checkout.html`: delivery address form, payment form (no card storage)
    - `register.html` / `login.html`: forms with client-side validation
    - _Requirements: 1.1, 4.1, 12.4_

  - [~] 14.6 Build order history and tracking page (`orders.html`)
    - List orders with number, date, total, status
    - Order detail view with products, quantities, delivery address
    - _Requirements: 5.1, 5.2, 5.3_

  - [~] 14.7 Build admin panel pages
    - `admin/products.html`: product list, create/edit form, image upload (max 5)
    - `admin/inventory.html`: stock update form, low-stock report
    - `admin/orders.html`: order list with filters, status update, cancel, CSV export
    - `admin/reports.html`: view and download past daily reports
    - _Requirements: 6.4, 6.5, 7.1, 7.2, 7.5, 8.1, 8.6, 9.5_

- [ ] 15. Performance optimization
  - [~] 15.1 Add database indexes for search and filter queries
    - Index on `products.name`, `products.description` (full-text), `products.category_id`, `orders.status`, `orders.created_at`
    - _Requirements: 11.1, 14.1, 14.2_

  - [~] 15.2 Configure product image caching
    - Set `Cache-Control` headers for static product images
    - _Requirements: 14.5_

  - [ ]* 15.3 Write property test for notification email content
    - **Property 42: Notification emails contain order details**
    - **Validates: Requirements 15.5**

- [~] 16. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Python scripts in `/scripts/` directory; Java backend in `/src/main/java/`; HTML frontend in `/src/main/resources/static/`
- Property tests validate universal correctness invariants; unit tests validate specific examples and edge cases
- Do not store credit card data at any point — delegate entirely to the Payment Gateway
- All 43 correctness properties from the design document are covered by property-based tests
- Property tests must run a minimum of 100 iterations each
- Tag format for each property test: `// Feature: tamilarasu-enterprises-ecommerce, Property {N}: {property_text}`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1", "4.1"] },
    { "id": 1, "tasks": ["2.2", "2.5", "2.9", "3.2", "3.9", "4.2"] },
    { "id": 2, "tasks": ["2.3", "2.4", "2.6", "2.7", "2.8", "2.10", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8", "3.10", "4.3", "4.4", "4.5", "4.6"] },
    { "id": 3, "tasks": ["6.1", "6.2", "3.11"] },
    { "id": 4, "tasks": ["6.3", "6.4", "6.5", "6.6", "7.1", "7.2", "7.5"] },
    { "id": 5, "tasks": ["7.3", "7.4", "7.6", "7.7", "7.8", "8.1"] },
    { "id": 6, "tasks": ["8.2", "8.3", "8.4", "8.5", "9.1", "10.1", "10.2"] },
    { "id": 7, "tasks": ["9.2", "9.3", "9.4", "9.5", "10.3", "10.4", "10.5"] },
    { "id": 8, "tasks": ["12.1", "12.4", "12.7", "12.9"] },
    { "id": 9, "tasks": ["12.2", "12.3", "12.5", "12.6", "12.8"] },
    { "id": 10, "tasks": ["13.1", "13.2"] },
    { "id": 11, "tasks": ["14.1", "14.2", "14.3", "14.4", "14.5", "14.6", "14.7"] },
    { "id": 12, "tasks": ["15.1", "15.2", "15.3"] }
  ]
}
```
