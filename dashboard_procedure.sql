
USE coffee_cat_shop;
GO

IF OBJECT_ID('sp_GetDashboardStats', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetDashboardStats;
GO

CREATE PROCEDURE sp_GetDashboardStats
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

-- Test thử procedure:
EXEC sp_GetDashboardStats;
