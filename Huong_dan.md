# Café Mèo — Coffee Cat Shop (bản SQL Server)

Chào mọi người, đây là hướng dẫn để chạy thử project trên máy. Tụi mình làm 2 website riêng nhưng dùng chung 1 database SQL Server:

- Trang khách hàng đặt món, đặt bàn: http://localhost:3000
- Trang quản lý/nhân viên: http://localhost:4000

Làm theo đúng thứ tự 5 bước dưới đây là chạy được, mình có ghi chú thêm mấy chỗ hay bị vướng lúc tự cài trên máy mình.

## Bước 1: Tạo database

Mở file `schema.sql` bằng SQL Server Management Studio (SSMS), rồi bấm Execute (hoặc nhấn F5) là xong. File này tự làm hết mọi thứ: tạo database `coffee_cat_shop`, tạo 8 bảng (`staff`, `customer`, `reservation`, `order`, `menu`, `order_item`, `breed`, `cat`), và chèn sẵn dữ liệu mẫu để test — kể cả tài khoản đăng nhập trang quản lý luôn: `admin` / `admin123`.

Lỡ chạy 2 lần mà SSMS báo database đã tồn tại thì đừng lo, chỉ cần xóa dòng `CREATE DATABASE coffee_cat_shop; GO` ở đầu file rồi chạy lại là được, hoặc gõ `DROP DATABASE coffee_cat_shop;` để xóa sạch làm lại từ đầu.

## Bước 2: Cho phép đăng nhập bằng tài khoản SQL

Chỗ này quan trọng nè, vì code Node.js tụi mình viết đang kết nối SQL Server bằng username/password (SQL login), không phải kiểu đăng nhập Windows mặc định. Nên máy nào chưa từng bật cái này thì cần làm:

1. Vào SSMS, chuột phải vào tên server → Properties → Security → chọn "SQL Server and Windows Authentication mode"
2. Khởi động lại SQL Server (restart service) thì mới có hiệu lực
3. Tạo 1 tài khoản mới: chuột phải Security → Logins → New Login, đặt username/password tùy ý, rồi qua tab User Mapping tick vào database `coffee_cat_shop` và cho quyền `db_owner`

(Nếu ai quen dùng Windows Authentication hơn thì trong file `db.js` tụi mình có để sẵn đoạn code cho cách này, đang bị comment lại thôi, mở comment ra và cài thêm gói `msnodesqlv8` là dùng được.)

## Bước 3: Bật TCP/IP

Bước này để Node.js "nói chuyện" được với SQL Server qua mạng local:

1. Mở SQL Server Configuration Manager → SQL Server Network Configuration → Protocols for [tên instance của máy mình] → bật TCP/IP lên
2. Restart lại SQL Server service
3. Nhớ tên instance của máy (thấy trong ô đăng nhập SSMS, kiểu `DWASE\CE201135`) để dùng ở bước sau

## Bước 4: Sửa thông tin kết nối

Mở file `db.js`, sửa lại đúng với thông tin máy mình đang chạy:

```js
const config = {
  server: 'localhost',        // hoặc 'DWASE\\CE201135' nếu máy dùng named instance
  database: 'coffee_cat_shop',
  user: 'sa',
  password: 'YourPassword',
  options: { encrypt: false, trustServerCertificate: true },
  port: 1433
};
```

## Bước 5: Chạy project

Mở terminal ngay tại thư mục gốc project, gõ:

```
npm install
```

Chờ cài xong thì mở thêm 1 terminal nữa — tổng cộng 2 terminal chạy song song vì mỗi trang web là 1 server riêng:

```
Terminal 1:
npm run customer
→ vào trình duyệt gõ http://localhost:3000

Terminal 2:
npm run manager
→ vào trình duyệt gõ http://localhost:4000
```

Thấy cả 2 terminal hiện dòng "Connected to SQL Server" với "... running at http://localhost:..." là ngon lành rồi đó.

## Sơ đồ project cho ai muốn xem code

```
coffee-cat-shop-mssql/
├── schema.sql               → chạy trong SSMS để tạo database
├── db.js                    → nơi 2 web dùng chung để kết nối database
├── customer-server.js       → server web khách hàng, cổng 3000
├── manager-server.js        → server web quản lý, cổng 4000
├── routes/
│   ├── customerRoutes.js
│   └── managerRoutes.js
├── customer-public/         → HTML/CSS/JS trang khách hàng
└── manager-public/          → HTML/CSS/JS trang quản lý
```

Phần giao diện tụi mình giữ y nguyên như hồi làm bản MySQL, chỉ đổi mỗi phần backend kết nối qua SQL Server thôi.

## Mấy lỗi hay gặp lúc setup

Liệt kê mấy lỗi tụi mình từng dính phải để mọi người đỡ mất công tìm:

- Báo `Login failed for user`: thường là gõ sai username/password trong `db.js`, hoặc quên bật SQL Server Authentication ở Bước 2.
- Báo `Failed to connect` hoặc bị treo lâu không kết nối được: chắc chắn 90% là quên bật TCP/IP ở Bước 3, hoặc gõ sai tên instance.
- Báo database đã tồn tại: do chạy `schema.sql` từ trước rồi, quay lại Bước 1 xóa dòng CREATE DATABASE hoặc drop database làm lại.
- Web chạy được nhưng mở lên trống trơn không có món/mèo gì hết: khả năng cao là chưa chạy `schema.sql`, hoặc `db.js` đang trỏ nhầm sang database khác.

Có gì thắc mắc lúc setup cứ nhắn tụi mình nha.
