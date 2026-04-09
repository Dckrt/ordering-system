-- schema.sql

-- Users table
CREATE TABLE users (
    user_id     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name   VARCHAR2(100) NOT NULL,
    email       VARCHAR2(100) UNIQUE NOT NULL,
    phone       VARCHAR2(20),
    password    VARCHAR2(255) NOT NULL,  -- hashed
    role        VARCHAR2(10) DEFAULT 'customer' CHECK (role IN ('customer','admin')),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    category_id   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name          VARCHAR2(100) NOT NULL,
    description   VARCHAR2(255)
);

-- Products table
CREATE TABLE products (
    product_id    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id   NUMBER REFERENCES categories(category_id),
    name          VARCHAR2(150) NOT NULL,
    description   VARCHAR2(500),
    price         NUMBER(10,2) NOT NULL,
    image_url     VARCHAR2(500),
    in_stock      NUMBER(1) DEFAULT 1,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    order_id        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         NUMBER REFERENCES users(user_id),
    full_name       VARCHAR2(100) NOT NULL,
    phone           VARCHAR2(20) NOT NULL,
    email           VARCHAR2(100) NOT NULL,
    order_type      VARCHAR2(10) CHECK (order_type IN ('Delivery','Pick-up')),
    address         VARCHAR2(300),
    city            VARCHAR2(100),
    payment_method  VARCHAR2(50),
    notes           VARCHAR2(500),
    subtotal        NUMBER(10,2),
    delivery_fee    NUMBER(10,2) DEFAULT 50,
    total           NUMBER(10,2),
    status          VARCHAR2(20) DEFAULT 'Pending'
                    CHECK (status IN ('Pending','Confirmed','Preparing','Ready','Delivered','Cancelled')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
    item_id     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id    NUMBER REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id  NUMBER REFERENCES products(product_id),
    name        VARCHAR2(150),
    price       NUMBER(10,2),
    quantity    NUMBER NOT NULL
);