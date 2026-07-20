-- menu_and_cats_seed.sql
-- Chạy file này SAU khi đã có schema.sql, để thêm nhiều món & nhiều mèo hơn.
USE coffee_cat_shop;
GO

------------------------------------------------------------
-- 0. SỬA LẠI CATEGORY CỦA 5 MÓN CŨ (trước đó bị mặc định 'drink')
------------------------------------------------------------
UPDATE menu SET category = 'coffee'   WHERE name IN ('Cappuccino', 'Latte');
UPDATE menu SET category = 'coldbrew' WHERE name = 'Cold Brew';
UPDATE menu SET category = 'food'     WHERE name IN ('Cat Paw Cookie', 'Cheesecake Slice');
GO

------------------------------------------------------------
-- 1. THÊM MÓN THỰC ĐƠN (đa dạng theo nhiều category)
------------------------------------------------------------

-- ☕ CÀ PHÊ (coffee)
INSERT INTO menu (name, base_price, stock_quantity, category) VALUES
('Cà Phê Trứng', 55000, 30, 'coffee'),
('Cà Phê Đen', 35000, 50, 'coffee'),
('Cà Phê Muối', 50000, 30, 'coffee'),
('Espresso', 35000, 40, 'coffee'),
('Americano', 40000, 40, 'coffee'),
('Bạc Xỉu', 45000, 40, 'coffee');

-- 🍵 TRÀ (tea)
INSERT INTO menu (name, base_price, stock_quantity, category) VALUES
('Trà Cam Quế', 55000, 25, 'tea'),
('Trà Táo Xanh', 55000, 25, 'tea'),
('Trà Hibiscus', 55000, 25, 'tea'),
('Trà Đào', 55000, 25, 'tea'),
('Trà Vải Hoa Hồng', 55000, 25, 'tea'),
('Trà Sữa Nhà Mèo', 50000, 30, 'tea');

-- 🫖 ẤM TRÀ NÓNG (tea_pot)
INSERT INTO menu (name, base_price, stock_quantity, category) VALUES
('Trà Hoa Đậu Biếc', 55000, 20, 'tea_pot'),
('Trà Gừng', 55000, 20, 'tea_pot'),
('Trà Táo Đỏ Long Nhãn', 55000, 20, 'tea_pot');

-- 🍊 NƯỚC ÉP (juice)
INSERT INTO menu (name, base_price, stock_quantity, category) VALUES
('Nước Ép Lên Men Theo Mùa', 59000, 15, 'juice'),
('Nước Cam Tươi', 50000, 25, 'juice'),
('Nước Dừa Tươi', 50000, 25, 'juice'),
('Nước Ép Dưa Hấu', 50000, 25, 'juice');

-- 🥤 SINH TỐ (smoothie)
INSERT INTO menu (name, base_price, stock_quantity, category) VALUES
('Cà Phê Cốt Dừa', 55000, 25, 'smoothie'),
('Phô Mai Đá Xay', 59000, 25, 'smoothie'),
('Sinh Tố Dâu Tằm', 59000, 25, 'smoothie'),
('Sinh Tố Việt Quất', 59000, 25, 'smoothie'),
('Sinh Tố Xoài', 59000, 25, 'smoothie');

-- 🧊 COLD BREW (coldbrew)
INSERT INTO menu (name, base_price, stock_quantity, category) VALUES
('Cold Brew Chanh', 55000, 25, 'coldbrew'),
('Cold Brew Vải', 55000, 25, 'coldbrew'),
('Cold Brew Truyền Thống', 50000, 25, 'coldbrew');

-- 🍰 ĐỒ ĂN (food)
INSERT INTO menu (name, base_price, stock_quantity, category) VALUES
('Bánh Brownie', 45000, 20, 'food'),
('Bánh Tiramisu', 55000, 20, 'food'),
('Muffin Việt Quất', 40000, 20, 'food'),
('Bánh Croissant Bơ', 38000, 20, 'food');
GO

------------------------------------------------------------
-- 2. THÊM GIỐNG MÈO & MÈO MỚI
------------------------------------------------------------

INSERT INTO breed (name, country_of_origin, temperament_description) VALUES
('Persian', 'Iran', 'Quiet, dignified, and loves to be pampered'),
('Maine Coon', 'United States', 'Friendly giant, playful and very social'),
('Siamese', 'Thailand', 'Vocal, curious, and highly affectionate'),
('Sphynx', 'Canada', 'Energetic, warm, and loves attention'),
('Munchkin', 'United States', 'Playful, sociable, with short charming legs'),
('Bengal', 'United States', 'Active, athletic, and full of curiosity');
GO

-- Lấy breed_id vừa thêm để insert mèo (dùng subquery theo tên breed cho chắc)
INSERT INTO cat (breed_id, name, date_of_birth, care_level, current_health_status, dietary_restriction, gender)
VALUES
((SELECT breed_id FROM breed WHERE name = 'Persian'), 'Kem', '2022-05-02', 'Medium', 'Healthy', 'None', 'Female'),
((SELECT breed_id FROM breed WHERE name = 'Maine Coon'), 'Simba', '2021-11-18', 'Medium', 'Healthy', 'None', 'Male'),
((SELECT breed_id FROM breed WHERE name = 'Siamese'), 'Miu', '2023-02-09', 'Low', 'Healthy', 'None', 'Female'),
((SELECT breed_id FROM breed WHERE name = 'Sphynx'), 'Bơ', '2022-08-14', 'High', 'Healthy', 'Sensitive skin', 'Male'),
((SELECT breed_id FROM breed WHERE name = 'Munchkin'), 'Đậu', '2023-06-01', 'Low', 'Healthy', 'None', 'Female'),
((SELECT breed_id FROM breed WHERE name = 'Bengal'), 'Tiger', '2022-01-27', 'Medium', 'Healthy', 'None', 'Male');
GO
