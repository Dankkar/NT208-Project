const {poolPromise, sql} = require('../database/db');

exports.createHotel = async (req, res) => {
    const {
        TenKS,
        DiaChi,
        HangSao,
        LoaiHinh,
        MoTaCoSoVatChat,
        QuyDinh,
        MotaChung
    } = req.body;
    try
    {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('TenKS', sql.VarChar, TenKS)
            .input('DiaChi', sql.VarChar, DiaChi)
            .input('HangSao', sql.VarChar, HangSao)
            .input('LoaiHinh', sql.VarChar, LoaiHinh)
            .input('MoTaCoSoVatChat', sql.Text, MoTaCoSoVatChat)
            .input('QuyDinh', sql.Text, QuyDinh)
            .input('MotaChung', sql.Text, MotaChung)
            .input('MaNguoiQuanLy', sql.Int, req.Int, req.user.MaKH)
            .query(`
                INSERT INTO KhachSan (TenKS, DiaChi, HangSao, LoaiHinh, MoTaCoSoVatChat, QuyDinh, MotaChung, MaNguoiQuanLy)
                VALUES (@TenKS, @DiaChi, @HangSao, @LoaiHinh, @MoTaCoSoVatChat, @QuyDinh, @MotaChung, @MaNguoiQuanLy)
                `)
        
        res.status(201).json({message: 'Khách sạn đã được tạo thành công'});
    }
    catch (err)
    {
        console.error('Lỗi createHotel:', err);
        res.status(500).json({error: 'Lỗi server'});
    }
};

exports.updateHotel = async (req, res) => {
    const {MaKS} = req.params;
    const {
        TenKS,
        DiaChi,
        HangSao,
        LoaiHinh,
        MoTaCoSoVatChat,
        QuyDinh,
        MotaChung
    } = req.body;

    if(!MaKS || isNaN(MaKS))
        return res.status(400).json({error: 'Mã khách sạn không hợp lệ'});

    try
    {
        const pool = await poolPromise;
        const result = await pool.request()
        .input('MaKS', sql.Int, parseInt(MaKS))
        .input('TenKS', sql.VarChar, TenKS)
        .input('DiaChi', sql.VarChar, DiaChi)
        .input('HangSao', sql.VarChar, HangSao)
        .input('LoaiHinh', sql.VarChar, LoaiHinh)
        .input('MoTaCoSoVatChat', sql.Text, MoTaCoSoVatChat)
        .input('QuyDinh', sql.Text, QuyDinh)
        .input('MotaChung', sql.Text, MotaChung)
        .query(`
            UPDATE KhachSan
            SET TenKS = @TenKS, DiaChi = @DiaChi, HangSao = @HangSao, LoaiHinh = @LoaiHinh, MoTaCoSoVatChat = @MoTaCoSoVatChat, QuyDinh = @QuyDinh, MotaChung = @MotaChung
            WHERE MaKS = @MaKS
        `);

    res.json({message: 'Thông tin khách sạn đã được cập nhật thành công'});
    }
    catch (err)
    {
        console.error('Lỗi updateHotel:', err);
        res.status(500).json({error: 'Lỗi server'});
    }
};

// exports.deleteHotel = async (req, res) => {
//     const { MaKS } = req.params;
    
//     if(!MaKS || isNaN(MaKS))
//         return res.status(400).json({error: 'Mã khách sạn không hợp lệ'});

//     try
//     {
//         const pool = await poolPromise;

//         const result = await pool.request()
//             .input('MaKS', sql.Int, parseInt(MaKS))
//             .query(`DELETE FROM KhachSan WHERE MaKS = @MaKS`);
            
//         if (result.rowsAffected[0] === 0) 
//             return res.status(404).json({error: 'Không tìm thấy khách sạn để xoá'});

//         res.json({message: 'Khách sạn đã được xóa thành công'});
//     }
//     catch (err)
//     {
//         console.error('Lỗi deleteHotel:', err);
//         res.status(500).json({error: 'Lỗi server'});
//     }
// };

exports.getAllHotels = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const pool = await poolPromise;
        const isAdmin = req.user && req.user.Role === 'admin';

        const countResult = await pool.request().query(`
            SELECT COUNT(*) as total
            FROM KhachSan
        `);

        // Base query without NguoiQuanLy
        let query = `
            SELECT ks.MaKS, ks.TenKS, ks.DiaChi, ks.HangSao, ks.LoaiHinh,
                   MIN(lp.GiaCoSo) as GiaThapNhat
            FROM KhachSan ks
            LEFT JOIN Phong p ON ks.MaKS = p.MaKS
            LEFT JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
        `;

        // Add NguoiQuanLy to query if user is admin
        if (isAdmin) {
            query = `
                SELECT ks.MaKS, ks.TenKS, ks.DiaChi, ks.HangSao, ks.LoaiHinh,
                       nd.HoTen AS NguoiQuanLy,
                       MIN(lp.GiaCoSo) as GiaThapNhat
                FROM KhachSan ks
                LEFT JOIN NguoiDung nd ON ks.MaNguoiQuanLy = nd.MaKH
                LEFT JOIN Phong p ON ks.MaKS = p.MaKS
                LEFT JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
            `;
        }

        // Add GROUP BY, ORDER BY and pagination
        query += `
            GROUP BY ks.MaKS, ks.TenKS, ks.DiaChi, ks.HangSao, ks.LoaiHinh
            ${isAdmin ? ', nd.HoTen' : ''}
            ORDER BY ks.HangSao DESC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `;

        const result = await pool.request()
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limit)
            .query(query);

        res.json({
            success: true,
            data: result.recordset,
            pagination: {
                total: countResult.recordset[0].total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countResult.recordset[0].total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error('Lỗi getAllHotels:', err);
        res.status(500).json({ error: 'Lỗi hệ thống' });
    }
};

exports.getHotelById = async (req, res) => {
    const { MaKS } = req.params;

    if (!MaKS || isNaN(Number(MaKS))) {
        return res.status(400).json({
            success: false,
            message: 'Mã khách sạn không hợp lệ'
        });
    }

    try {
        const pool = await poolPromise;

        // Get hotel basic information
        const hotelResult = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query(`
                SELECT ks.MaKS, ks.TenKS, ks.DiaChi, ks.HangSao, ks.LoaiHinh,
                       ks.MoTaCoSoVatChat, ks.QuyDinh, ks.MotaChung
                FROM KhachSan ks
                WHERE ks.MaKS = @MaKS
            `);

        if (hotelResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khách sạn'
            });
        }

        // Get room types and pricing information
        const roomTypesResult = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query(`
                SELECT lp.MaLoaiPhong, lp.TenLoaiPhong, lp.GiaCoSo, lp.SoNguoiToiDa,
                       lp.DienTich, lp.MoTa, lp.TienNghi,
                       COUNT(p.MaPhong) as SoPhongTrong
                FROM LoaiPhong lp
                LEFT JOIN Phong p ON lp.MaLoaiPhong = p.MaLoaiPhong 
                    AND p.TrangThai = N'Trống'
                WHERE lp.MaKS = @MaKS
                GROUP BY lp.MaLoaiPhong, lp.TenLoaiPhong, lp.GiaCoSo, lp.SoNguoiToiDa,
                         lp.DienTich, lp.MoTa, lp.TienNghi
                ORDER BY lp.GiaCoSo ASC
            `);

        // Get hotel amenities/services
        const servicesResult = await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .query(`
                SELECT dv.MaDichVu, dv.TenDichVu, dv.MoTa, dv.Gia
                FROM DichVu dv
                WHERE dv.MaKS = @MaKS
                ORDER BY dv.TenDichVu
            `);

        // Calculate price range
        const priceRange = roomTypesResult.recordset.length > 0 ? {
            min: Math.min(...roomTypesResult.recordset.map(room => room.GiaCoSo)),
            max: Math.max(...roomTypesResult.recordset.map(room => room.GiaCoSo))
        } : { min: 0, max: 0 };

        const hotelData = {
            ...hotelResult.recordset[0],
            roomTypes: roomTypesResult.recordset,
            services: servicesResult.recordset,
            priceRange: priceRange,
            totalRoomTypes: roomTypesResult.recordset.length
        };

        res.json({
            success: true,
            data: hotelData
        });
    } catch (err) {
        console.error('Lỗi getHotelById:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

exports.getHotelsByNguoiQuanLy = async (req, res) => {
    const {MaKH} = req.params;

    if(!MaKH || isNaN(MaKH))
        return res.status(400).json({error: 'Mã người quản lý không hợp lệ'});

    try
    {
        const pool = await poolPromise;
        const result = await pool.request()
        .input('MaKH', sql.Int, parseInt(MaKH))
        .query(`
            SELECT * FROM KhachSan
            WHERE MaNguoiQuanLy = @MaKH
        `);

        res.json(result.recordset);
    }
    catch (err)
    {
        console.error('Lỗi getHotelByNguoiQuanLy:', err);
        res.status(500).json({error: 'Lỗi server'});
    }
};

// Lấy danh sách khách sạn nổi bật
exports.getFeaturedHotels = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT TOP 6
                ks.MaKS,
                ks.TenKS,
                ks.DiaChi,
                ks.HangSao,
                MIN(lp.GiaCoSo) as GiaThapNhat
            FROM KhachSan ks
            LEFT JOIN Phong p ON ks.MaKS = p.MaKS
            LEFT JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
            GROUP BY ks.MaKS, ks.TenKS, ks.DiaChi, ks.HangSao
            ORDER BY ks.HangSao DESC
        `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Lỗi getFeaturedHotels:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách khách sạn nổi bật'
        });
    }
};

exports.suggestLocations = async (req, res) => {
    try {
        const keyword = req.query.keyword; //từ khóa tìm kiếm
        const pool = await poolPromise;
        const result = await pool.request()
            .input('keyword', sql.VarChar, keyword)
            .query(`
                SELECT DISTINCT DiaChi
                FROM KhachSan
                WHERE DiaChi  COLLATE Latin1_General_CI_AI LIKE '%' + @keyword + '%'
            `);
        
        res.json({
            success: true,
            data: result.recordset.map(r => r.DiaChi)
        });
    }
    catch (err)
    {
        console.error('Lỗi suggestLocations:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
}

/**
 * Tìm kiếm khách sạn và phòng trống
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.searchAvailableHotels = async (req, res) => {
    try {
        const { location, startDate, endDate, numberOfGuests } = req.body;

        // Validate required parameters
        if (!startDate || !endDate || !numberOfGuests) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin: ngày nhận phòng, ngày trả phòng và số lượng khách'
            });
        }

        // Validate dates and guests
        const checkIn = new Date(startDate);
        const checkOut = new Date(endDate);
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Định dạng ngày không hợp lệ'
            });
        }

        if (checkIn >= checkOut) {
            return res.status(400).json({
                success: false,
                message: 'Ngày trả phòng phải sau ngày nhận phòng'
            });
        }

        const guests = parseInt(numberOfGuests);
        if (isNaN(guests) || guests < 1) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng khách không hợp lệ'
            });
        }

        const pool = await poolPromise;

        // First, get all hotels and their room types that match the location
        const hotelsResult = await pool.request()
            .input('numberOfGuests', sql.Int, guests)
            .input('location', sql.NVarChar, location ? `%${location}%` : '%')
            .query(`
                SELECT DISTINCT
                    ks.MaKS,
                    ks.TenKS,
                    ks.DiaChi,
                    ks.HangSao,
                    ks.LoaiHinh,
                    ks.MoTaChung,
                    ks.Latitude,
                    ks.Longitude,
                    lp.MaLoaiPhong,
                    lp.TenLoaiPhong,
                    lp.GiaCoSo,
                    lp.DienTich,
                    lp.TienNghi,
                    chg.TenCauHinh as CauHinhGiuong,
                    chg.SoGiuongDoi,
                    chg.SoGiuongDon
                FROM KhachSan ks
                JOIN LoaiPhong lp ON ks.MaKS = lp.MaKS
                JOIN Phong p ON lp.MaLoaiPhong = p.MaLoaiPhong
                JOIN CauHinhGiuong chg ON p.MaCauHinhGiuong = chg.MaCauHinhGiuong
                WHERE (chg.SoGiuongDoi * 2 + chg.SoGiuongDon) >= @numberOfGuests
                AND (ks.DiaChi COLLATE Latin1_General_CI_AI LIKE @location OR ks.TenKS COLLATE Latin1_General_CI_AI LIKE @location)
                ORDER BY ks.HangSao DESC, lp.GiaCoSo ASC;
            `);

        // Then, check availability for each room type
        const availableRoomsResult = await pool.request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .input('numberOfGuests', sql.Int, guests)
            .query(`
                WITH AvailableRooms AS (
                    SELECT
                        p.MaKS,
                        p.MaLoaiPhong,
                        COUNT(*) as SoPhongTrong
                    FROM Phong p
                    JOIN CauHinhGiuong chg ON p.MaCauHinhGiuong = chg.MaCauHinhGiuong
                    WHERE p.TrangThaiPhong != N'Bảo trì'
                    AND (chg.SoGiuongDoi * 2 + chg.SoGiuongDon) >= @numberOfGuests
                    AND NOT EXISTS (
                        SELECT 1 FROM Booking b
                        WHERE b.MaPhong = p.MaPhong
                        AND b.TrangThaiBooking != N'Đã hủy'
                        AND (
                            b.NgayNhanPhong < @endDate
                            AND b.NgayTraPhong > @startDate
                        )
                        AND (
                            b.TrangThaiBooking != N'Tạm giữ'
                            OR (b.TrangThaiBooking = N'Tạm giữ' AND b.ThoiGianGiuCho IS NOT NULL AND DATEDIFF(MINUTE, b.ThoiGianGiuCho, GETDATE()) <= 15)
                        )
                    )
                    GROUP BY p.MaKS, p.MaLoaiPhong
                )
                SELECT * FROM AvailableRooms;
            `);

        // Create a map of available rooms
        const availableRoomsMap = new Map();
        availableRoomsResult.recordset.forEach(room => {
            availableRoomsMap.set(`${room.MaKS}-${room.MaLoaiPhong}`, room.SoPhongTrong);
        });

        // Format response
        const hotels = {};
        for (const record of hotelsResult.recordset) {
            if (!hotels[record.MaKS]) {
                hotels[record.MaKS] = {
                    MaKS: record.MaKS,
                    TenKS: record.TenKS,
                    DiaChi: record.DiaChi,
                    HangSao: record.HangSao,
                    LoaiHinh: record.LoaiHinh,
                    MoTaChung: record.MoTaChung,
                    Latitude: record.Latitude,
                    Longitude: record.Longitude,
                    roomTypes: []
                };
            }

            const roomKey = `${record.MaKS}-${record.MaLoaiPhong}`;
            const availableRooms = availableRoomsMap.get(roomKey) || 0;

            const roomType = {
                MaLoaiPhong: record.MaLoaiPhong,
                TenLoaiPhong: record.TenLoaiPhong,
                GiaCoSo: record.GiaCoSo,
                DienTich: record.DienTich,
                TienNghi: record.TienNghi,
                CauHinhGiuong: record.CauHinhGiuong,
                SoGiuongDoi: record.SoGiuongDoi,
                SoGiuongDon: record.SoGiuongDon,
                SoPhongTrong: availableRooms
            };

            // If no rooms available, get alternative dates
            if (availableRooms === 0) {
                try {
                    const alternativeDatesResult = await exports.suggestAlternativeDates({
                        body: {
                            NgayNhanPhong: startDate,
                            NgayTraPhong: endDate,
                            MaLoaiPhong: record.MaLoaiPhong
                        }
                    });

                    if (alternativeDatesResult && alternativeDatesResult.success) {
                        roomType.alternativeDates = alternativeDatesResult.data.suggestions;
                    }
                } catch (error) {
                    console.error('Error getting alternative dates:', error);
                }
            }

            hotels[record.MaKS].roomTypes.push(roomType);
        }

        // Return only the first matching hotel
        const matchingHotels = Object.values(hotels);
        const result = matchingHotels.length > 0 ? matchingHotels[0] : null;

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error searching hotels:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tìm kiếm khách sạn'
        });
    }
};

/**
 * Gợi ý các khoảng thời gian thay thế khi phòng không còn trống
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.suggestAlternativeDates = async (req, res) => {
    try {
        const { NgayNhanPhong, NgayTraPhong, MaLoaiPhong } = req.body;

        if (!NgayNhanPhong || !NgayTraPhong || !MaLoaiPhong) {
            const response = { 
                success: false, 
                message: 'Vui lòng cung cấp đầy đủ thông tin: NgayNhanPhong, NgayTraPhong, MaLoaiPhong' 
            };
            if (res && res.json) {
                return res.status(400).json(response);
            }
            return response;
        }

        const pool = await poolPromise;
        const originalDuration = Math.ceil((new Date(NgayTraPhong) - new Date(NgayNhanPhong)) / (1000 * 60 * 60 * 24));

        // Tìm các khoảng thời gian thay thế
        const result = await pool.request()
            .input('NgayNhanPhong', sql.Date, NgayNhanPhong)
            .input('NgayTraPhong', sql.Date, NgayTraPhong)
            .input('MaLoaiPhong', sql.Int, MaLoaiPhong)
            .input('originalDuration', sql.Int, originalDuration)
            .query(`
                WITH DateRange AS (
                    SELECT 
                        DATEADD(DAY, -7, @NgayNhanPhong) as StartDate,
                        DATEADD(DAY, 7, @NgayTraPhong) as EndDate
                ),
                BookedDates AS (
                    SELECT 
                        b.NgayNhanPhong,
                        b.NgayTraPhong
                    FROM Booking b
                    JOIN Phong p ON b.MaPhong = p.MaPhong
                    WHERE p.MaLoaiPhong = @MaLoaiPhong
                    AND b.TrangThaiBooking != N'Đã hủy'
                    AND p.TrangThaiPhong != N'Bảo trì'
                    AND (
                        b.TrangThaiBooking != N'Tạm giữ'
                        OR (b.TrangThaiBooking = N'Tạm giữ' AND b.ThoiGianGiuCho IS NOT NULL AND DATEDIFF(MINUTE, b.ThoiGianGiuCho, GETDATE()) <= 15)
                    )
                    AND b.NgayNhanPhong < (SELECT EndDate FROM DateRange)
                    AND b.NgayTraPhong > (SELECT StartDate FROM DateRange)
                ),
                AvailableRanges AS (
                    -- Khoảng trống trước booking đầu tiên
                    SELECT 
                        (SELECT StartDate FROM DateRange) as GapStart,
                        DATEADD(DAY, -1, MIN(NgayNhanPhong)) as GapEnd
                    FROM BookedDates
                    WHERE NOT EXISTS (
                        SELECT 1 FROM BookedDates b2 
                        WHERE b2.NgayNhanPhong < BookedDates.NgayNhanPhong
                    )
                    UNION ALL
                    -- Khoảng trống giữa các booking
                    SELECT 
                        DATEADD(DAY, 1, NgayTraPhong) as GapStart,
                        DATEADD(DAY, -1, NextCheckIn) as GapEnd
                    FROM (
                        SELECT 
                            NgayNhanPhong,
                            NgayTraPhong,
                            LEAD(NgayNhanPhong) OVER (ORDER BY NgayNhanPhong) as NextCheckIn
                        FROM BookedDates
                    ) AS BookedDatesWithNext
                    WHERE NextCheckIn IS NOT NULL
                    UNION ALL
                    -- Khoảng trống sau booking cuối cùng
                    SELECT 
                        DATEADD(DAY, 1, MAX(NgayTraPhong)) as GapStart,
                        (SELECT EndDate FROM DateRange) as GapEnd
                    FROM BookedDates
                    WHERE NOT EXISTS (
                        SELECT 1 FROM BookedDates b2 
                        WHERE b2.NgayNhanPhong > BookedDates.NgayNhanPhong
                    )
                    UNION ALL
                    -- Trường hợp không có booking nào
                    SELECT 
                        StartDate,
                        EndDate
                    FROM DateRange
                    WHERE NOT EXISTS (SELECT 1 FROM BookedDates)
                ),
                ValidRanges AS (
                    SELECT 
                        GapStart,
                        GapEnd,
                        DATEDIFF(DAY, GapStart, GapEnd) + 1 as AvailableDuration
                    FROM AvailableRanges
                    WHERE DATEDIFF(DAY, GapStart, GapEnd) + 1 >= @originalDuration
                ),
                SuggestedDates AS (
                    -- Before suggestions
                    SELECT 
                        DATEADD(DAY, -@originalDuration, GapEnd) as CheckInDate,
                        GapEnd as CheckOutDate,
                        'before' as Period,
                        @originalDuration as Duration,
                        ABS(DATEDIFF(DAY, DATEADD(DAY, -@originalDuration, GapEnd), @NgayNhanPhong)) as DaysFromOriginal
                    FROM ValidRanges
                    WHERE GapEnd <= @NgayNhanPhong
                    AND DATEDIFF(DAY, GapStart, GapEnd) >= @originalDuration
                    AND NOT EXISTS (
                        SELECT 1 FROM BookedDates b
                        WHERE b.NgayNhanPhong < GapEnd
                        AND b.NgayTraPhong > DATEADD(DAY, -@originalDuration, GapEnd)
                    )
                    UNION ALL
                    -- After suggestions
                    SELECT 
                        GapStart as CheckInDate,
                        DATEADD(DAY, @originalDuration, GapStart) as CheckOutDate,
                        'after' as Period,
                        @originalDuration as Duration,
                        ABS(DATEDIFF(DAY, GapStart, @NgayNhanPhong)) as DaysFromOriginal
                    FROM ValidRanges
                    WHERE DATEADD(DAY, @originalDuration, GapStart) <= GapEnd
                    AND GapStart > @NgayTraPhong
                    AND NOT EXISTS (
                        SELECT 1 FROM BookedDates b
                        WHERE b.NgayNhanPhong < DATEADD(DAY, @originalDuration, GapStart)
                        AND b.NgayTraPhong > GapStart
                    )
                )
                SELECT 
                    CheckInDate,
                    CheckOutDate,
                    Period,
                    Duration,
                    DaysFromOriginal
                FROM SuggestedDates
                ORDER BY 
                    CASE 
                        WHEN Period = 'after' THEN 1
                        ELSE 2
                    END,
                    DaysFromOriginal
            `);

        const suggestions = result.recordset.map(date => ({
            checkIn: date.CheckInDate,
            checkOut: date.CheckOutDate,
            period: date.Period,
            duration: date.Duration,
            daysFromOriginal: date.DaysFromOriginal
        }));

        const response = {
            success: true,
            data: {
                originalDates: {
                    checkIn: NgayNhanPhong,
                    checkOut: NgayTraPhong,
                    duration: originalDuration
                },
                suggestions
            }
        };

        if (res && res.json) {
            return res.json(response);
        }
        return response;
    } catch (err) {
        console.error('Lỗi suggestAlternativeDates:', err);
        const errorResponse = { 
            success: false, 
            message: 'Lỗi server khi tìm kiếm thời gian thay thế' 
        };
        if (res && res.json) {
            return res.status(500).json(errorResponse);
        }
        return errorResponse;
    }
};
// HÀM MỚI: Lấy danh sách khách sạn cơ bản cho Admin (MaKS, TenKS)
exports.getBasicHotelListForAdmin = async (req, res) => {
    try {
        // Middleware isAdmin đã kiểm tra quyền Admin rồi
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`SELECT MaKS, TenKS FROM KhachSan ORDER BY TenKS ASC`); // Lấy MaKS và TenKS

        if (result.recordset.length === 0) {
            return res.status(200).json({
                success: true,
                data: [] // Trả về mảng rỗng nếu không có khách sạn nào
            });
        }

        res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error("Lỗi trong hotelController.getBasicHotelListForAdmin:", error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách khách sạn cho admin.'
        });
    }
};
