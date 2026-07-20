-- menu_and_cats_seed.sql
-- Chạy file này SAU khi đã có schema.sql, để thêm nhiều món & nhiều mèo hơn.
--
-- QUAN TRỌNG: mọi chuỗi tiếng Việt phải có tiền tố N'...' (Unicode string
-- literal). Nếu chỉ dùng '...' thường, SQL Server sẽ quy đổi chuỗi về mã
-- trang mặc định của kết nối TRƯỚC KHI ghi vào bảng, làm mất các ký tự có
-- dấu như ạ, ỉ, ố, ứ... và thay bằng '?'. Đây là nguyên nhân gốc gây lỗi
-- hiển thị "B?c X?u", "Cà Phê Tr?ng"... chứ không phải do font.
USE coffee_cat_shop;
GO

------------------------------------------------------------
-- 0. SỬA LẠI CATEGORY CỦA 5 MÓN CŨ (trước đó bị mặc định 'drink')
------------------------------------------------------------
UPDATE menu SET category = 'coffee'   WHERE name IN (N'Cappuccino', N'Latte');
UPDATE menu SET category = 'coldbrew' WHERE name = N'Cold Brew';
UPDATE menu SET category = 'food'     WHERE name IN (N'Cat Paw Cookie', N'Cheesecake Slice');
GO

------------------------------------------------------------
-- 1. THÊM MÓN THỰC ĐƠN (đa dạng theo nhiều category)
------------------------------------------------------------

-- ☕ CÀ PHÊ (coffee)
INSERT INTO menu (name, base_price, stock_quantity, category) VALUES
(N'Cà Phê Trứng', 55000, 30, 'coffee'),
(N'Cà Phê Đen', 35000, 50, 'coffee'),
(N'Cà Phê Muối', 50000, 30, 'coffee'),
(N'Espresso', 35000, 40, 'coffee'),
(N'Americano', 40000, 40, 'coffee'),
(N'Bạc Xỉu', 45000, 40, 'coffee');

-- 🍵 TRÀ (tea)
INSERT INTO menu (name, base_price, stock_quantity, category) VALUES
(N'Trà Cam Quế', 55000, 25, 'tea'),
(N'Trà Táo Xanh', 55000, 25, 'tea'),
(N'Trà Hibiscus', 55000, 25, 'tea'),
(N'Trà Đào', 55000, 25, 'tea'),
(N'Trà Vải Hoa Hồng', 55000, 25, 'tea'),
(N'Trà Sữa Nhà Mèo', 50000, 30, 'tea');

-- 🫖 ẤM TRÀ NÓNG (tea_pot)
INSERT INTO menu (name, base_price, stock_quantity, category) VALUES
(N'Trà Hoa Đậu Biếc', 55000, 20, 'tea_pot'),
(N'Trà Gừng', 55000, 20, 'tea_pot'),
(N'Trà Táo Đỏ Long Nhãn', 55000, 20, 'tea_pot');

-- 🍊 NƯỚC ÉP (juice)
INSERT INTO menu (name, base_price, stock_quantity, category) VALUES
(N'Nước Ép Lên Men Theo Mùa', 59000, 15, 'juice'),
(N'Nước Cam Tươi', 50000, 25, 'juice'),
(N'Nước Dừa Tươi', 50000, 25, 'juice'),
(N'Nước Ép Dưa Hấu', 50000, 25, 'juice');

-- 🥤 SINH TỐ (smoothie)
INSERT INTO menu (name, base_price, stock_quantity, category) VALUES
(N'Cà Phê Cốt Dừa', 55000, 25, 'smoothie'),
(N'Phô Mai Đá Xay', 59000, 25, 'smoothie'),
(N'Sinh Tố Dâu Tằm', 59000, 25, 'smoothie'),
(N'Sinh Tố Việt Quất', 59000, 25, 'smoothie'),
(N'Sinh Tố Xoài', 59000, 25, 'smoothie');

-- 🧊 COLD BREW (coldbrew)
INSERT INTO menu (name, base_price, stock_quantity, category) VALUES
(N'Cold Brew Chanh', 55000, 25, 'coldbrew'),
(N'Cold Brew Vải', 55000, 25, 'coldbrew'),
(N'Cold Brew Truyền Thống', 50000, 25, 'coldbrew');

-- 🍰 ĐỒ ĂN (food)
INSERT INTO menu (name, base_price, stock_quantity, category) VALUES
(N'Bánh Brownie', 45000, 20, 'food'),
(N'Bánh Tiramisu', 55000, 20, 'food'),
(N'Muffin Việt Quất', 40000, 20, 'food'),
(N'Bánh Croissant Bơ', 38000, 20, 'food');
GO

------------------------------------------------------------
-- 2. THÊM GIỐNG MÈO & MÈO MỚI
------------------------------------------------------------

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
