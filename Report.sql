    -- Đây là file sql hoàn thiện đã chứa đầy đủ và toàn bộ procedure và trigger và những thay đổi
    CREATE DATABASE coffee_cat_shop_test;
    GO

    USE coffee_cat_shop_test;
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

    -- Thêm cột cat_id vào bảng reservation (cho phép nhận giá trị NULL nếu khách không chọn mèo)
    ALTER TABLE reservation 
    ADD cat_id INT NULL;
    GO
    -- Thêm khóa ngoại FK_reservation_cat liên kết cat_id sang cột cat_id của bảng cat
    ALTER TABLE reservation 
    ADD CONSTRAINT FK_reservation_cat 
    FOREIGN KEY (cat_id) REFERENCES cat(cat_id);
    GO
    -----Thêm Trigger cập nhật Order total
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


    -- SỬA LẠI CATEGORY CỦA 5 MÓN CŨ (trước đó bị mặc định 'drink')
    UPDATE menu SET category = 'coffee'   WHERE name IN (N'Cappuccino', N'Latte');
    UPDATE menu SET category = 'coldbrew' WHERE name = N'Cold Brew';
    UPDATE menu SET category = 'food'     WHERE name IN (N'Cat Paw Cookie', N'Cheesecake Slice');
    GO
    -- THÊM MÓN THỰC ĐƠN (đa dạng theo nhiều category)
    -- CÀ PHÊ (coffee)
    INSERT INTO menu (name, base_price, stock_quantity, category) VALUES
    (N'Cà Phê Trứng', 55000, 30, 'coffee'),
    (N'Cà Phê Đen', 35000, 50, 'coffee'),
    (N'Cà Phê Muối', 50000, 30, 'coffee'),
    (N'Espresso', 35000, 40, 'coffee'),
    (N'Americano', 40000, 40, 'coffee'),
    (N'Bạc Xỉu', 45000, 40, 'coffee');

    -- TRÀ (tea)
    INSERT INTO menu (name, base_price, stock_quantity, category) VALUES
    (N'Trà Cam Quế', 55000, 25, 'tea'),
    (N'Trà Táo Xanh', 55000, 25, 'tea'),
    (N'Trà Hibiscus', 55000, 25, 'tea'),
    (N'Trà Đào', 55000, 25, 'tea'),
    (N'Trà Vải Hoa Hồng', 55000, 25, 'tea'),
    (N'Trà Sữa Nhà Mèo', 50000, 30, 'tea');

    -- ẤM TRÀ NÓNG (tea_pot)
    INSERT INTO menu (name, base_price, stock_quantity, category) VALUES
    (N'Trà Hoa Đậu Biếc', 55000, 20, 'tea_pot'),
    (N'Trà Gừng', 55000, 20, 'tea_pot'),
    (N'Trà Táo Đỏ Long Nhãn', 55000, 20, 'tea_pot');

    -- NƯỚC ÉP (juice)
    INSERT INTO menu (name, base_price, stock_quantity, category) VALUES
    (N'Nước Ép Lên Men Theo Mùa', 59000, 15, 'juice'),
    (N'Nước Cam Tươi', 50000, 25, 'juice'),
    (N'Nước Dừa Tươi', 50000, 25, 'juice'),
    (N'Nước Ép Dưa Hấu', 50000, 25, 'juice');

    --  SINH TỐ (smoothie)
    INSERT INTO menu (name, base_price, stock_quantity, category) VALUES
    (N'Cà Phê Cốt Dừa', 55000, 25, 'smoothie'),
    (N'Phô Mai Đá Xay', 59000, 25, 'smoothie'),
    (N'Sinh Tố Dâu Tằm', 59000, 25, 'smoothie'),
    (N'Sinh Tố Việt Quất', 59000, 25, 'smoothie'),
    (N'Sinh Tố Xoài', 59000, 25, 'smoothie');

    --  COLD BREW (coldbrew)
    INSERT INTO menu (name, base_price, stock_quantity, category) VALUES
    (N'Cold Brew Chanh', 55000, 25, 'coldbrew'),
    (N'Cold Brew Vải', 55000, 25, 'coldbrew'),
    (N'Cold Brew Truyền Thống', 50000, 25, 'coldbrew');

    --  ĐỒ ĂN (food)
    INSERT INTO menu (name, base_price, stock_quantity, category) VALUES
    (N'Bánh Brownie', 45000, 20, 'food'),
    (N'Bánh Tiramisu', 55000, 20, 'food'),
    (N'Muffin Việt Quất', 40000, 20, 'food'),
    (N'Bánh Croissant Bơ', 38000, 20, 'food');
    GO

    -- THÊM GIỐNG MÈO & MÈO MỚI
    INSERT INTO breed (name, country_of_origin, temperament_description) VALUES
    (N'Persian', N'Iran', N'Quiet, dignified, and loves to be pampered'),
    (N'Maine Coon', N'United States', N'Friendly giant, playful and very social'),
    (N'Siamese', N'Thailand', N'Vocal, curious, and highly affectionate'),
    (N'Sphynx', N'Canada', N'Energetic, warm, and loves attention'),
    (N'Munchkin', N'United States', N'Playful, sociable, with short charming legs'),
    (N'Bengal', N'United States', N'Active, athletic, and full of curiosity');
    GO

    -- Lấy breed_id vừa thêm để insert mèo (dùng subquery theo tên breed cho chắc)
    INSERT INTO cat (breed_id, name, date_of_birth, care_level, current_health_status, dietary_restriction, gender)
    VALUES
    ((SELECT breed_id FROM breed WHERE name = N'Persian'), N'Kem', '2022-05-02', N'Medium', N'Healthy', N'None', 'Female'),
    ((SELECT breed_id FROM breed WHERE name = N'Maine Coon'), N'Simba', '2021-11-18', N'Medium', N'Healthy', N'None', 'Male'),
    ((SELECT breed_id FROM breed WHERE name = N'Siamese'), N'Miu', '2023-02-09', N'Low', N'Healthy', N'None', 'Female'),
    ((SELECT breed_id FROM breed WHERE name = N'Sphynx'), N'Bơ', '2022-08-14', N'High', N'Healthy', N'Sensitive skin', 'Male'),
    ((SELECT breed_id FROM breed WHERE name = N'Munchkin'), N'Đậu', '2023-06-01', N'Low', N'Healthy', N'None', 'Female'),
    ((SELECT breed_id FROM breed WHERE name = N'Bengal'), N'Tiger', '2022-01-27', N'Medium', N'Healthy', N'None', 'Male');
    GO

    -- Đổi cột sang NVARCHAR
    ALTER TABLE menu   ALTER COLUMN name NVARCHAR(100) NOT NULL;
    ALTER TABLE customer ALTER COLUMN name NVARCHAR(100) NOT NULL;
    ALTER TABLE staff  ALTER COLUMN name NVARCHAR(100) NOT NULL;
    ALTER TABLE staff  ALTER COLUMN role NVARCHAR(50);
    ALTER TABLE breed  ALTER COLUMN name NVARCHAR(100) NOT NULL;
    ALTER TABLE breed  ALTER COLUMN country_of_origin NVARCHAR(100);
    ALTER TABLE breed  ALTER COLUMN temperament_description NVARCHAR(MAX);
    ALTER TABLE cat    ALTER COLUMN name NVARCHAR(100);
    ALTER TABLE cat    ALTER COLUMN care_level NVARCHAR(50);
    ALTER TABLE cat    ALTER COLUMN current_health_status NVARCHAR(100);
    ALTER TABLE cat    ALTER COLUMN dietary_restriction NVARCHAR(100);
    GO
    -- Ghi đè lại đúng tên món (theo thứ tự insert trong menu_and_cats_seed.sql — 5 món đầu là từ schema.sql, ID 1-5)
    UPDATE menu SET name = N'Cappuccino'        WHERE item_id = 1;
    UPDATE menu SET name = N'Latte'             WHERE item_id = 2;
    UPDATE menu SET name = N'Cold Brew'         WHERE item_id = 3;
    UPDATE menu SET name = N'Cat Paw Cookie'    WHERE item_id = 4;
    UPDATE menu SET name = N'Cheesecake Slice'  WHERE item_id = 5;

    UPDATE menu SET name = N'Cà Phê Trứng'            WHERE item_id = 6;
    UPDATE menu SET name = N'Cà Phê Đen'              WHERE item_id = 7;
    UPDATE menu SET name = N'Cà Phê Muối'             WHERE item_id = 8;
    UPDATE menu SET name = N'Espresso'                WHERE item_id = 9;
    UPDATE menu SET name = N'Americano'               WHERE item_id = 10;
    UPDATE menu SET name = N'Bạc Xỉu'                 WHERE item_id = 11;

    UPDATE menu SET name = N'Trà Cam Quế'             WHERE item_id = 12;
    UPDATE menu SET name = N'Trà Táo Xanh'            WHERE item_id = 13;
    UPDATE menu SET name = N'Trà Hibiscus'            WHERE item_id = 14;
    UPDATE menu SET name = N'Trà Đào'                 WHERE item_id = 15;
    UPDATE menu SET name = N'Trà Vải Hoa Hồng'        WHERE item_id = 16;
    UPDATE menu SET name = N'Trà Sữa Nhà Mèo'         WHERE item_id = 17;

    UPDATE menu SET name = N'Trà Hoa Đậu Biếc'        WHERE item_id = 18;
    UPDATE menu SET name = N'Trà Gừng'                WHERE item_id = 19;
    UPDATE menu SET name = N'Trà Táo Đỏ Long Nhãn'    WHERE item_id = 20;

    UPDATE menu SET name = N'Nước Ép Lên Men Theo Mùa' WHERE item_id = 21;
    UPDATE menu SET name = N'Nước Cam Tươi'            WHERE item_id = 22;
    UPDATE menu SET name = N'Nước Dừa Tươi'            WHERE item_id = 23;
    UPDATE menu SET name = N'Nước Ép Dưa Hấu'          WHERE item_id = 24;

    UPDATE menu SET name = N'Cà Phê Cốt Dừa'          WHERE item_id = 25;
    UPDATE menu SET name = N'Phô Mai Đá Xay'          WHERE item_id = 26;
    UPDATE menu SET name = N'Sinh Tố Dâu Tằm'         WHERE item_id = 27;
    UPDATE menu SET name = N'Sinh Tố Việt Quất'       WHERE item_id = 28;
    UPDATE menu SET name = N'Sinh Tố Xoài'            WHERE item_id = 29;

    UPDATE menu SET name = N'Cold Brew Chanh'         WHERE item_id = 30;
    UPDATE menu SET name = N'Cold Brew Vải'           WHERE item_id = 31;
    UPDATE menu SET name = N'Cold Brew Truyền Thống'  WHERE item_id = 32;

    UPDATE menu SET name = N'Bánh Brownie'            WHERE item_id = 33;
    UPDATE menu SET name = N'Bánh Tiramisu'           WHERE item_id = 34;
    UPDATE menu SET name = N'Muffin Việt Quất'        WHERE item_id = 35;
    UPDATE menu SET name = N'Bánh Croissant Bơ'       WHERE item_id = 36;
    GO
    -- Ghi đè lại tên mèo bị lỗi dấu (Bơ, Đậu)
    UPDATE cat SET name = N'Bơ'   WHERE cat_id = 7;
    UPDATE cat SET name = N'Đậu'  WHERE cat_id = 8;
    GO
       SELECT item_id, name, category FROM menu ORDER BY item_id;
       SELECT cat_id, name FROM cat ORDER BY cat_id;

   -- Procedure Tính dashboard
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[sp_GetDashboardStats]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        -- Tổng số đơn hàng đã hoàn thành thành công
        (SELECT COUNT(*) FROM [order] WHERE status = 'completed') AS completedOrders,

        -- Tổng số bàn đã được xác nhận
        (SELECT COUNT(*) FROM reservation WHERE status = 'confirmed') AS confirmedReservations,

        -- Tổng doanh thu, chỉ tính trên các đơn hàng đã hoàn thành
        (SELECT ISNULL(SUM(total_amount), 0) FROM [order] WHERE status = 'completed') AS totalRevenue,

        -- Giữ thêm vài số liệu phụ hữu ích cho phần thuyết trình
        (SELECT COUNT(*) FROM [order]) AS totalOrders,
        (SELECT COUNT(*) FROM cat) AS totalCats,
        (SELECT COUNT(*) FROM reservation
            WHERE reservation_date_time >= CAST(GETDATE() AS DATE)) AS upcomingReservations;
END;
GO
    -- Procedure cập nhật trạng thái sức khỏe mèo 
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_UpdateCatStatus]
    @cat_id INT,
    @new_status NVARCHAR(100)
AS
BEGIN
    -- 1. Kiểm tra xem bé mèo có tồn tại trong bảng cat không
    IF NOT EXISTS (SELECT 1 FROM cat WHERE cat_id = @cat_id)
    BEGIN
        PRINT N'Lỗi: Không tìm thấy bé mèo với ID này!';
        RETURN;
    END

    -- 2. Nếu tồn tại thì mới tiến hành cập nhật
    UPDATE cat
    SET current_health_status = @new_status
    WHERE cat_id = @cat_id;

    PRINT N'Cập nhật trạng thái sức khỏe thành công!';
END;
GO