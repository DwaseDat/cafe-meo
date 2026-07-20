CREATE PROCEDURE sp_UpdateCatStatus
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