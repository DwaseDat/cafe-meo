-- miragtion2.sql
-- Sửa lỗi hiển thị tiếng Việt ("B?c X?u", "Cà Phê Tr?ng"...) cho DATABASE
-- ĐANG CHẠY SẴN (không cần chạy lại schema.sql từ đầu).
--
-- Nguyên nhân: cột name/... đang là VARCHAR + seed script cũ chèn chuỗi
-- tiếng Việt KHÔNG có tiền tố N'...' -> các ký tự có dấu (ạ, ỉ, ố, ứ...)
-- đã bị mất và thay bằng '?' NGAY LÚC GHI VÀO DB, không thể khôi phục lại
-- bằng cách đổi font hay đổi kiểu cột suông. Vì vậy migration này gồm 2 bước:
--   BƯỚC 1: đổi kiểu cột sang NVARCHAR (để từ nay về sau không còn bị mất chữ)
--   BƯỚC 2: ghi đè lại đúng tên (bằng N'...') cho các dòng đã seed sẵn theo
--            đúng thứ tự trong menu_and_cats_seed.sql / schema.sql.
--
-- ⚠️ BƯỚC 2 dựa trên giả định database được cài mới, seed đúng thứ tự
-- (schema.sql chạy trước, rồi menu_and_cats_seed.sql), chưa có ai xoá/thêm
-- món hay mèo thủ công. Hãy chạy đoạn SELECT kiểm tra bên dưới trước, nếu
-- thứ tự/item_id khác thì chỉnh lại điều kiện WHERE cho đúng dữ liệu của bạn.
USE coffee_cat_shop;
GO

------------------------------------------------------------
-- KIỂM TRA TRƯỚC KHI SỬA (chạy thử, xem có đúng thứ tự như seed không)
------------------------------------------------------------
-- SELECT item_id, name, category FROM menu ORDER BY item_id;
-- SELECT cat_id, name FROM cat ORDER BY cat_id;
GO

------------------------------------------------------------
-- BƯỚC 1: Đổi cột sang NVARCHAR
------------------------------------------------------------
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

------------------------------------------------------------
-- BƯỚC 2: Ghi đè lại đúng tên món (theo thứ tự insert trong
-- menu_and_cats_seed.sql — 5 món đầu là từ schema.sql, ID 1-5)
------------------------------------------------------------
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

------------------------------------------------------------
-- Ghi đè lại tên mèo bị lỗi dấu (Bơ, Đậu)
------------------------------------------------------------
UPDATE cat SET name = N'Bơ'   WHERE cat_id = 7;
UPDATE cat SET name = N'Đậu'  WHERE cat_id = 8;
GO
   SELECT item_id, name, category FROM menu ORDER BY item_id;
   SELECT cat_id, name FROM cat ORDER BY cat_id;