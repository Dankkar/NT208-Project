const sql = require('mssql');
const { poolPromise } = require('../database/db');
const axios = require('axios');

// Get coordinates from address using Google Maps Geocoding API
const getCoordinatesFromAddress = async (address) => {
    try {
        // Format address for Vietnamese locations
        const formattedAddress = `${address}, Can Tho, Vietnam`;
        console.log('Formatted address:', formattedAddress);

        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(formattedAddress)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
        );

        console.log('Google Maps API Response:', response.data);

        if (response.data.status === 'OK') {
            const location = response.data.results[0].geometry.location;
            return {
                latitude: location.lat,
                longitude: location.lng
            };
        } else if (response.data.status === 'ZERO_RESULTS') {
            throw new Error('Không tìm thấy địa chỉ này trên Google Maps');
        } else if (response.data.status === 'OVER_QUERY_LIMIT') {
            throw new Error('Đã vượt quá giới hạn truy vấn Google Maps API');
        } else if (response.data.status === 'REQUEST_DENIED') {
            throw new Error('API Key không hợp lệ hoặc bị từ chối');
        } else {
            throw new Error(`Lỗi Google Maps API: ${response.data.status}`);
        }
    } catch (error) {
        console.error('Geocoding error details:', {
            message: error.message,
            response: error.response?.data,
            address: address
        });
        throw error;
    }
};

// Update hotel coordinates
exports.updateHotelCoordinates = async (req, res) => {
    const { MaKS } = req.params;
    const { DiaChi } = req.body;

    try {
        // Get coordinates from address
        const coordinates = await getCoordinatesFromAddress(DiaChi);

        // Update hotel coordinates in database
        const pool = await poolPromise;
        await pool.request()
            .input('MaKS', sql.Int, MaKS)
            .input('Latitude', sql.Decimal(10, 8), coordinates.latitude)
            .input('Longitude', sql.Decimal(11, 8), coordinates.longitude)
            .input('DiaChi', sql.NVarChar, DiaChi)
            .query(`
                UPDATE KhachSan 
                SET Latitude = @Latitude, 
                    Longitude = @Longitude,
                    DiaChi = @DiaChi
                WHERE MaKS = @MaKS
            `);

        res.json({
            success: true,
            message: 'Cập nhật tọa độ thành công',
            data: coordinates
        });
    } catch (error) {
        console.error('Update coordinates error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật tọa độ'
        });
    }
};

// Get nearby hotels
exports.getNearbyHotels = async (req, res) => {
    const { latitude, longitude, radius = 5 } = req.query; // radius in kilometers

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Latitude', sql.Decimal(10, 8), latitude)
            .input('Longitude', sql.Decimal(11, 8), longitude)
            .input('Radius', sql.Float, radius)
            .query(`
                SELECT 
                    ks.*,
                    (6371 * acos(cos(radians(@Latitude)) * cos(radians(Latitude)) * 
                    cos(radians(Longitude) - radians(@Longitude)) + 
                    sin(radians(@Latitude)) * sin(radians(Latitude)))) AS Distance
                FROM KhachSan ks
                WHERE Latitude IS NOT NULL 
                AND Longitude IS NOT NULL
                HAVING Distance <= @Radius
                ORDER BY Distance
            `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Get nearby hotels error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách khách sạn gần đây'
        });
    }
}; 