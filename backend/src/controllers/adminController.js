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
                -- Monthly Revenue
                SUM(CASE 
                    WHEN NgayDat >= @startOfMonth AND TrangThaiBooking != 'Đã hủy' 
                    THEN TongTienDuKien ELSE 0 
                END) as MonthlyRevenue,
                
                -- Yearly Revenue
                SUM(CASE 
                    WHEN NgayDat >= @startOfYear AND TrangThaiBooking != 'Đã hủy' 
                    THEN TongTienDuKien ELSE 0 
                END) as YearlyRevenue,
                
                -- Total Bookings
                COUNT(CASE WHEN TrangThaiBooking != 'Đã hủy' THEN 1 END) as TotalBookings,
                
                -- Average Booking Value
                AVG(CASE 
                    WHEN TrangThaiBooking != 'Đã hủy' 
                    THEN TongTienDuKien ELSE NULL 
                END) as AverageBookingValue,
                
                -- Cancellation Rate
                CAST(COUNT(CASE WHEN TrangThaiBooking = 'Đã hủy' THEN 1 END) * 100.0 / 
                    NULLIF(COUNT(*), 0) as DECIMAL(5,2)) as CancellationRate,
                
                -- Occupancy Rate
                (SELECT CAST(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM Phong), 0) as DECIMAL(5,2))
                FROM Booking
                WHERE TrangThaiBooking != 'Đã hủy'
                AND GETDATE() BETWEEN NgayNhanPhong AND NgayTraPhong) as CurrentOccupancyRate
            FROM Booking
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
exports.getRevenueByPeriod = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;
        const pool = await poolPromise;

        const query = `
            SELECT 
                CASE 
                    WHEN @groupBy = 'day' THEN CONVERT(DATE, NgayDat)
                    WHEN @groupBy = 'month' THEN DATEFROMPARTS(YEAR(NgayDat), MONTH(NgayDat), 1)
                    WHEN @groupBy = 'year' THEN DATEFROMPARTS(YEAR(NgayDat), 1, 1)
                END as Period,
                SUM(CASE WHEN TrangThaiBooking != 'Đã hủy' THEN TongTienDuKien ELSE 0 END) as Revenue,
                COUNT(CASE WHEN TrangThaiBooking != 'Đã hủy' THEN 1 END) as BookingCount,
                COUNT(CASE WHEN TrangThaiBooking = 'Đã hủy' THEN 1 END) as CancelledCount,
                AVG(CASE WHEN TrangThaiBooking != 'Đã hủy' THEN TongTienDuKien ELSE NULL END) as AverageRevenue
            FROM Booking
            WHERE NgayDat BETWEEN @startDate AND @endDate
            GROUP BY 
                CASE 
                    WHEN @groupBy = 'day' THEN CONVERT(DATE, NgayDat)
                    WHEN @groupBy = 'month' THEN DATEFROMPARTS(YEAR(NgayDat), MONTH(NgayDat), 1)
                    WHEN @groupBy = 'year' THEN DATEFROMPARTS(YEAR(NgayDat), 1, 1)
                END
            ORDER BY Period
        `;

        const result = await pool.request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .input('groupBy', sql.NVarChar, groupBy)
            .query(query);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error in getRevenueByPeriod:', error);
        res.status(500).json({ error: 'Lỗi server' });
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

        const query = `
            SELECT 
                ks.TenKS,
                COUNT(b.MaDat) as TotalBookings,
                SUM(CASE WHEN b.TrangThaiBooking != 'Đã hủy' THEN b.TongTienDuKien ELSE 0 END) as Revenue,
                AVG(CASE WHEN b.TrangThaiBooking != 'Đã hủy' THEN b.TongTienDuKien ELSE NULL END) as AverageRevenue,
                COUNT(CASE WHEN b.TrangThaiBooking = 'Đã hủy' THEN 1 END) as CancelledBookings,
                (SELECT COUNT(*) FROM Phong p2 
                 WHERE p2.MaKS = ks.MaKS) as TotalRooms,
                (SELECT COUNT(*) FROM Phong p2 
                 JOIN Booking b2 ON p2.MaPhong = b2.MaPhong
                 WHERE p2.MaKS = ks.MaKS
                 AND b2.TrangThaiBooking != 'Đã hủy'
                 AND GETDATE() BETWEEN b2.NgayNhanPhong AND b2.NgayTraPhong) as OccupiedRooms
            FROM Booking b
            JOIN KhachSan ks ON b.MaKS = ks.MaKS
            WHERE b.NgayDat BETWEEN @startDate AND @endDate
            GROUP BY ks.TenKS, ks.MaKS
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
        console.error('Error in getRevenueByHotel:', error);
        res.status(500).json({ error: 'Lỗi server' });
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