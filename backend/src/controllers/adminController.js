const { poolPromise, sql } = require('../database/db');
const schema = 'dbo';

// Revenue Overview Dashboard
exports.getRevenueOverview = async (req, res) => {
try {
const pool = await poolPromise;
const today = new Date();
const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
const startOfYear = new Date(today.getFullYear(), 0, 1);
const query = `
        SELECT 
            -- Monthly Revenue (from actual PAID invoices)
            SUM(CASE 
                WHEN b.NgayDat >= @startOfMonth AND b.TrangThaiBooking != N'Đã hủy' AND hd.TrangThaiThanhToan = N'Đã thanh toán' -- THÊM ĐIỀU KIỆN NÀY
                THEN ISNULL(hd.TongTienThanhToan, 0) ELSE 0 
            END) as MonthlyRevenue,
            
            -- Yearly Revenue (from actual PAID invoices)
            SUM(CASE 
                WHEN b.NgayDat >= @startOfYear AND b.TrangThaiBooking != N'Đã hủy' AND hd.TrangThaiThanhToan = N'Đã thanh toán' -- THÊM ĐIỀU KIỆN NÀY
                THEN ISNULL(hd.TongTienThanhToan, 0) ELSE 0 
            END) as YearlyRevenue,
            
            -- Total Bookings (completed and PAID)
            COUNT(CASE WHEN b.TrangThaiBooking != N'Đã hủy' AND hd.TrangThaiThanhToan = N'Đã thanh toán' THEN b.MaDat END) as TotalBookings,
            
            -- Average Booking Value (from actual PAID invoices)
            AVG(CASE 
                WHEN b.TrangThaiBooking != N'Đã hủy' AND hd.TrangThaiThanhToan = N'Đã thanh toán'
                THEN hd.TongTienThanhToan ELSE NULL 
            END) as AverageBookingValue,
            
            -- Cancellation Rate
            CAST(
                SUM(CASE WHEN b.TrangThaiBooking = N'Đã hủy' THEN 1 ELSE 0 END) * 100.0 / 
                NULLIF(COUNT(b.MaDat), 0) 
            as DECIMAL(5,2)) as CancellationRate,
            
            -- Current Occupancy Rate
            (SELECT CAST(COUNT(DISTINCT b2.MaPhong) * 100.0 / -- SỬA: Đếm số phòng đang được chiếm dụng (DISTINCT MaPhong)
                         NULLIF((SELECT COUNT(p_total.MaPhong) FROM Phong p_total WHERE p_total.IsActive = 1), 0) -- SỬA: Đếm tổng số phòng active
                        as DECIMAL(5,2))
             FROM Booking b2
             JOIN Phong p_occupied ON b2.MaPhong = p_occupied.MaPhong -- Join để đảm bảo phòng tồn tại và active
             WHERE b2.TrangThaiBooking != N'Đã hủy'
               AND p_occupied.IsActive = 1 -- Chỉ tính phòng đang active
               AND GETDATE() BETWEEN b2.NgayNhanPhong AND b2.NgayTraPhong) as CurrentOccupancyRate
        FROM Booking b
        LEFT JOIN HoaDon hd ON b.MaDat = hd.MaDat 
        LEFT JOIN Phong p_booking ON b.MaPhong = p_booking.MaPhong 
        LEFT JOIN KhachSan ks ON p_booking.MaKS = ks.MaKS -- Để filter theo khách sạn nếu cần sau này
    `;

    const result = await pool.request()
        .input('startOfMonth', sql.Date, startOfMonth)
        .input('startOfYear', sql.Date, startOfYear)
        .query(query);

    res.json({
        success: true,
        data: result.recordset[0]
    });
} catch (error) {
    console.error('Error in getRevenueOverview:', error);
    res.status(500).json({ error: 'Lỗi server' });
}    
};

// Revenue by Time Period
// File: controllers/adminController.js (hoặc statisticsController.js)

exports.getRevenueByPeriod = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'month' } = req.query; // Mặc định là 'month'
        const pool = await poolPromise;

        // Validation cho groupBy
        const validGroupBys = ['month', 'year'];
        if (!validGroupBys.includes(groupBy)) {
            return res.status(400).json({ success: false, error: "Giá trị groupBy không hợp lệ. Chỉ chấp nhận 'month' hoặc 'year'." });
        }
        // Validation cho startDate, endDate
        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, error: "startDate và endDate là bắt buộc." });
        }
        // Optional: Further date validation (e.g., format, startDate <= endDate) can be added here if not handled by frontend/elsewhere

        // Xây dựng phần CASE cho SELECT và GROUP BY dựa trên groupBy hợp lệ
        let periodExpression;
        if (groupBy === 'month') {
            periodExpression = `DATEFROMPARTS(YEAR(b.NgayDat), MONTH(b.NgayDat), 1)`;
        } else { // Chỉ còn 'year'
            periodExpression = `DATEFROMPARTS(YEAR(b.NgayDat), 1, 1)`;
        }

        const query = `
            SELECT 
                ${periodExpression} as Period,
                SUM(CASE 
                    WHEN b.TrangThaiBooking != N'Đã hủy' AND hd.TrangThaiThanhToan = N'Đã thanh toán' 
                    THEN ISNULL(hd.TongTienThanhToan, 0) 
                    ELSE 0 
                END) as Revenue,
                COUNT(CASE WHEN b.TrangThaiBooking != N'Đã hủy' AND hd.TrangThaiThanhToan = N'Đã thanh toán' THEN b.MaDat END) as BookingCount,
                SUM(CASE WHEN b.TrangThaiBooking = N'Đã hủy' THEN 1 ELSE 0 END) as CancelledCount,
                AVG(CASE 
                    WHEN b.TrangThaiBooking != N'Đã hủy' AND hd.TrangThaiThanhToan = N'Đã thanh toán'
                    THEN hd.TongTienThanhToan 
                    ELSE NULL 
                END) as AverageRevenue
            FROM Booking b
            LEFT JOIN HoaDon hd ON b.MaDat = hd.MaDat -- Join với HoaDon
            WHERE b.NgayDat >= @startDate AND b.NgayDat < DATEADD(day, 1, @endDate) -- Corrected date range
            GROUP BY 
                ${periodExpression}
            ORDER BY Period ASC
        `;

        const result = await pool.request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate) 
            .query(query);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error in getRevenueByPeriod:', error.message, error.stack);
        // Provide more context from the error object if available for detailed logging
        res.status(500).json({ success: false, error: 'Lỗi server khi lấy doanh thu theo kỳ.', details: error.message });
    }
};

// Revenue by Room Type
exports.getRevenueByRoomType = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const pool = await poolPromise;

        const query = `
            SELECT 
                lp.TenLoaiPhong,
                COUNT(b.MaDat) as TotalBookings,
                SUM(CASE WHEN b.TrangThaiBooking != 'Đã hủy' THEN b.TongTienDuKien ELSE 0 END) as Revenue,
                AVG(CASE WHEN b.TrangThaiBooking != 'Đã hủy' THEN b.TongTienDuKien ELSE NULL END) as AverageRevenue,
                COUNT(CASE WHEN b.TrangThaiBooking = 'Đã hủy' THEN 1 END) as CancelledBookings,
                (SELECT COUNT(*) FROM Phong p2 
                 WHERE p2.MaLoaiPhong = lp.MaLoaiPhong) as TotalRooms,
                (SELECT COUNT(*) FROM Phong p2 
                 JOIN Booking b2 ON p2.MaPhong = b2.MaPhong
                 WHERE p2.MaLoaiPhong = lp.MaLoaiPhong
                 AND b2.TrangThaiBooking != 'Đã hủy'
                 AND GETDATE() BETWEEN b2.NgayNhanPhong AND b2.NgayTraPhong) as OccupiedRooms
            FROM Booking b
            JOIN Phong p ON b.MaPhong = p.MaPhong
            JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
            WHERE b.NgayDat BETWEEN @startDate AND @endDate
            GROUP BY lp.TenLoaiPhong, lp.MaLoaiPhong
            ORDER BY Revenue DESC
        `;

        const result = await pool.request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .query(query);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error in getRevenueByRoomType:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// Revenue by Service
exports.getRevenueByService = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const pool = await poolPromise;

        const query = `
            SELECT 
                ldv.TenLoaiDV,
                COUNT(sdv.MaDat) as UsageCount,
                SUM(sdv.GiaTaiThoiDiemSuDung * sdv.SoLuong) as Revenue,
                AVG(sdv.GiaTaiThoiDiemSuDung) as AveragePrice,
                COUNT(DISTINCT sdv.MaDat) as BookingCount
            FROM LoaiDichVu ldv
            JOIN SuDungDichVu sdv ON ldv.MaLoaiDV = sdv.MaLoaiDV
            JOIN Booking b ON sdv.MaDat = b.MaDat
            WHERE b.NgayDat BETWEEN @startDate AND @endDate
            AND b.TrangThaiBooking != 'Đã hủy'
            GROUP BY ldv.TenLoaiDV, ldv.MaLoaiDV
            ORDER BY Revenue DESC
        `;

        const result = await pool.request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .query(query);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error in getRevenueByService:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// Revenue by Hotel
exports.getRevenueByHotel = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const pool = await poolPromise;

        // Thêm validation cho startDate và endDate nếu cần
        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, error: "startDate và endDate là bắt buộc." });
        }

        const query = `
            SELECT 
                ks.TenKS,
                ks.MaKS, -- Lấy cả MaKS để có thể dùng làm key hoặc cho mục đích khác nếu cần

                -- Đếm tổng số booking hợp lệ (không hủy và đã thanh toán) cho từng khách sạn
                COUNT(CASE WHEN b.TrangThaiBooking != N'Đã hủy' AND hd.TrangThaiThanhToan = N'Đã thanh toán' THEN b.MaDat END) as TotalBookings,
                
                -- Tính tổng doanh thu thực tế từ các hóa đơn đã thanh toán
                ISNULL(SUM(CASE 
                    WHEN b.TrangThaiBooking != N'Đã hủy' AND hd.TrangThaiThanhToan = N'Đã thanh toán' 
                    THEN hd.TongTienThanhToan 
                    ELSE 0 
                END), 0) as Revenue,
                
                -- Tính doanh thu trung bình trên mỗi booking đã thanh toán
                AVG(CASE 
                    WHEN b.TrangThaiBooking != N'Đã hủy' AND hd.TrangThaiThanhToan = N'Đã thanh toán'
                    THEN hd.TongTienThanhToan 
                    ELSE NULL 
                END) as AverageRevenue,
                
                -- Đếm số booking đã bị hủy cho từng khách sạn
                SUM(CASE WHEN b.TrangThaiBooking = N'Đã hủy' THEN 1 ELSE 0 END) as CancelledBookings,
                
                -- (Các subquery TotalRooms, OccupiedRooms giữ nguyên logic nếu chúng đúng,
                -- hoặc điều chỉnh nếu chúng cũng cần dựa vào hóa đơn đã thanh toán)
                (SELECT COUNT(p2.MaPhong) FROM Phong p2 
                 WHERE p2.MaKS = ks.MaKS AND p2.IsActive = 1) as TotalRooms, -- Đảm bảo chỉ đếm phòng active
                
                (SELECT COUNT(DISTINCT b2.MaPhong) 
                 FROM Booking b2
                 JOIN Phong p_occupied ON b2.MaPhong = p_occupied.MaPhong
                 WHERE p_occupied.MaKS = ks.MaKS
                   AND b2.TrangThaiBooking != N'Đã hủy'
                   AND p_occupied.IsActive = 1
                   AND GETDATE() BETWEEN b2.NgayNhanPhong AND b2.NgayTraPhong
                ) as OccupiedRooms

            FROM KhachSan ks  -- Bắt đầu từ KhachSan để luôn có danh sách KS
            LEFT JOIN Booking b ON ks.MaKS = b.MaKS AND b.NgayDat BETWEEN @startDate AND @endDate -- Join Booking trong khoảng thời gian
            LEFT JOIN HoaDon hd ON b.MaDat = hd.MaDat -- Join với HoaDon để lấy trạng thái thanh toán và số tiền thực tế
            -- Không cần WHERE ở đây nữa nếu muốn hiển thị tất cả KS, kể cả KS không có booking/revenue trong khoảng tgian đó (revenue sẽ là 0)
            -- Nếu chỉ muốn KS có booking trong khoảng thời gian:
            -- WHERE EXISTS (SELECT 1 FROM Booking b_check WHERE b_check.MaKS = ks.MaKS AND b_check.NgayDat BETWEEN @startDate AND @endDate)
            GROUP BY ks.TenKS, ks.MaKS
            ORDER BY Revenue DESC
        `;

        const result = await pool.request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .query(query);
            
        // Chuyển đổi các giá trị NULL thành 0 cho Revenue và TotalBookings nếu cần cho biểu đồ
        const processedData = result.recordset.map(item => ({
            ...item,
            Revenue: item.Revenue === null ? 0 : item.Revenue,
            TotalBookings: item.TotalBookings === null ? 0 : item.TotalBookings,
            CancelledBookings: item.CancelledBookings === null ? 0 : item.CancelledBookings,
            AverageRevenue: item.AverageRevenue === null ? 0 : item.AverageRevenue
        }));

        res.json({
            success: true,
            // data: result.recordset
            data: processedData
        });
    } catch (error) {
        console.error('Error in getRevenueByHotel:', error.message, error.stack);
        res.status(500).json({ error: 'Lỗi server', details: error.message });
    }
};

// Revenue Analytics
exports.getRevenueAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const pool = await poolPromise;

        // Get revenue trends
        const trendsQuery = `
            SELECT 
                CONVERT(DATE, NgayDat) as Date,
                SUM(CASE WHEN TrangThaiBooking != 'Đã hủy' THEN TongTienDuKien ELSE 0 END) as DailyRevenue,
                COUNT(CASE WHEN TrangThaiBooking != 'Đã hủy' THEN 1 END) as DailyBookings,
                AVG(CASE WHEN TrangThaiBooking != 'Đã hủy' THEN TongTienDuKien ELSE NULL END) as AverageRevenue
            FROM Booking
            WHERE NgayDat BETWEEN @startDate AND @endDate
            GROUP BY CONVERT(DATE, NgayDat)
            ORDER BY Date
        `;

        // Get peak booking times
        const peakTimesQuery = `
            SELECT 
                DATEPART(HOUR, NgayDat) as Hour,
                COUNT(*) as BookingCount,
                AVG(TongTienDuKien) as AverageRevenue
            FROM Booking
            WHERE NgayDat BETWEEN @startDate AND @endDate
            AND TrangThaiBooking != 'Đã hủy'
            GROUP BY DATEPART(HOUR, NgayDat)
            ORDER BY BookingCount DESC
        `;

        // Get cancellation analysis
        const cancellationQuery = `
            SELECT 
                DATEDIFF(day, NgayDat, NgayHuy) as DaysBeforeCheckIn,
                COUNT(*) as CancellationCount,
                AVG(TongTienDuKien) as AverageBookingValue
            FROM Booking
            WHERE TrangThaiBooking = 'Đã hủy'
            AND NgayDat BETWEEN @startDate AND @endDate
            GROUP BY DATEDIFF(day, NgayDat, NgayHuy)
            ORDER BY DaysBeforeCheckIn
        `;

        const [trends, peakTimes, cancellations] = await Promise.all([
            pool.request()
                .input('startDate', sql.Date, startDate)
                .input('endDate', sql.Date, endDate)
                .query(trendsQuery),
            pool.request()
                .input('startDate', sql.Date, startDate)
                .input('endDate', sql.Date, endDate)
                .query(peakTimesQuery),
            pool.request()
                .input('startDate', sql.Date, startDate)
                .input('endDate', sql.Date, endDate)
                .query(cancellationQuery)
        ]);

        res.json({
            success: true,
            data: {
                trends: trends.recordset,
                peakTimes: peakTimes.recordset,
                cancellations: cancellations.recordset
            }
        });
    } catch (error) {
        console.error('Error in getRevenueAnalytics:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
}; 