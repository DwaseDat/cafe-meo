-- Đây là file ban đầu 
CREATE DATABASE coffee_cat_shop;
GO

USE coffee_cat_shop;
GO

CREATE TABLE staff (
    staff_id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    role NVARCHAR(50),
    username VARCHAR(50) UNIQUE,
    password VARCHAR(255)
);

CREATE TABLE customer (
    customer_id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(100)
);

CREATE TABLE reservation (
    reservation_id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,
    table_number INT,
    reservation_date_time DATETIME,
    number_of_guests INT,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);

CREATE TABLE [order] (
    order_id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,
    staff_id INT NULL,
    order_date_time DATETIME DEFAULT GETDATE(),
    total_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'pending',
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id)
);
CREATE TABLE menu (
    item_id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    base_price DECIMAL(10,2),
    stock_quantity INT,
    category VARCHAR(50) DEFAULT 'drink',
    image_url VARCHAR(255)
);

CREATE TABLE order_item (
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    subtotal DECIMAL(10,2),
    PRIMARY KEY (order_id, item_id),
    FOREIGN KEY (order_id) REFERENCES [order](order_id),
    FOREIGN KEY (item_id) REFERENCES menu(item_id)
);

CREATE TABLE breed (
    breed_id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    country_of_origin NVARCHAR(100),
    temperament_description NVARCHAR(MAX)
);

CREATE TABLE cat (
    cat_id INT IDENTITY(1,1) PRIMARY KEY,
    breed_id INT NOT NULL,
    name NVARCHAR(100),
    date_of_birth DATE,
    care_level NVARCHAR(50),
    current_health_status NVARCHAR(100),
    dietary_restriction NVARCHAR(100),
    image_url VARCHAR(255),
    FOREIGN KEY (breed_id) REFERENCES breed(breed_id)

);
GO

INSERT INTO staff (name, phone_number, role, username, password) VALUES
(N'Linh Nguyen', '0901234567', N'Manager', 'admin', 'admin123'),
(N'Minh Tran', '0907654321', N'Barista', 'minh', 'minh123');

INSERT INTO menu (name, base_price, stock_quantity, category) VALUES
(N'Cappuccino', 45000, 50, 'drink'),
(N'Latte', 48000, 50, 'drink'),
(N'Cold Brew', 50000, 40, 'drink'),
(N'Cat Paw Cookie', 25000, 30, 'food'),
(N'Cheesecake Slice', 55000, 20, 'food');

INSERT INTO breed (name, country_of_origin, temperament_description) VALUES
(N'British Shorthair', N'United Kingdom', N'Calm, easygoing, and affectionate'),
(N'Ragdoll', N'United States', N'Gentle, relaxed, and very friendly'),
(N'Scottish Fold', N'Scotland', N'Sweet-tempered and quiet');

INSERT INTO cat (breed_id, name, date_of_birth, care_level, current_health_status, dietary_restriction) VALUES
(1, N'Mochi', '2022-03-10', N'Low', N'Healthy', N'None'),
(2, N'Coco', '2021-07-22', N'Medium', N'Healthy', N'Grain-free'),
(3, N'Bean', '2023-01-15', N'Low', N'Healthy', N'None');
GO
----Thêm gender cho mèo
USE coffee_cat_shop;
ALTER TABLE reservation ADD status VARCHAR(20) DEFAULT 'pending';
GO
ALTER TABLE cat ADD gender VARCHAR(10);
GO
UPDATE cat SET gender = 'Female' WHERE name = N'Mochi';
UPDATE cat SET gender = 'Male' WHERE name = N'Coco';
UPDATE cat SET gender = 'Male' WHERE name = N'Bean';
GO

-----Thêm Trigger
USE coffee_cat_shop;
GO

CREATE TRIGGER trg_UpdateOrderTotal
ON order_item
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- Lấy order_id bị ảnh hưởng (cả INSERT lẫn DELETE)
    DECLARE @order_id INT;

    SELECT @order_id = COALESCE(
        (SELECT TOP 1 order_id FROM inserted),
        (SELECT TOP 1 order_id FROM deleted)
    );

    -- Tính lại tổng và cập nhật vào bảng order
    UPDATE [order]
    SET total_amount = (
        SELECT ISNULL(SUM(subtotal), 0)
        FROM order_item
        WHERE order_id = @order_id
    )
    WHERE order_id = @order_id;
END;
GO
---- Test Trigger
-- Thêm item vào order có sẵn → total tự cập nhật
INSERT INTO order_item (order_id, item_id, quantity, subtotal)
VALUES (1, 2, 1, 48000);

-- Kiểm tra total đã thay đổi chưa
SELECT order_id, total_amount FROM [order] WHERE order_id = 1;
