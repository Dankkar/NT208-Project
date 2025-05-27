const express = require('express');
const { check } = require('express-validator');
const { 
    createHotel,
    updateHotel,
    deleteHotel,
    getHotelsByNguoiQuanLy,
    getHotelById,
    getAllHotels,
    getFeaturedHotels,
    suggestLocations,
    searchAvailableHotels
} = require('../controllers/hotelController');
const {authenticateToken, isAdmin} = require('../middlewares/auth');
const { LocationSuggestLimiter } = require('../middlewares/rateLimiter')

const router = express.Router();
//GET /featured
router.get('/featured', getFeaturedHotels);

//POST /search
router.post('/search', searchAvailableHotels);

//POST /hotels
router.post('/', authenticateToken, isAdmin,
    [
        check('TenKS', 'Tên khách sạn không được để trống').notEmpty(),
        check('DiaChi', 'Địa chỉ không được để trống').notEmpty(),
        check('HangSao', 'Hạng sao không được để trống').notEmpty(),
        check('LoaiHinh', 'Loại hình không được để trống').notEmpty(),
        check('MoTaCoSoVatChat', 'Mô tả cơ sở vật chất không được để trống').notEmpty(),
        check('QuyDinh', 'Quy định không được để trống').notEmpty(),    
    ], createHotel);
 //GET /hotels/nguoi-quan-ly/:MaKH
router.get('/nguoi-quan-ly/:MaKH', authenticateToken, isAdmin, getHotelsByNguoiQuanLy);
    
//GET /hotels
router.get('/', getAllHotels);
    
//GET /hotels/suggest-locations
router.get('/suggest-locations', LocationSuggestLimiter, suggestLocations);
    
//PUT /hotels/:MaKS
router.put('/:MaKS', authenticateToken, isAdmin, updateHotel);

//DELETE /hotels/:MaKS
router.delete('/:MaKS', authenticateToken, isAdmin, deleteHotel);

//GET /hotels/:MaKS
router.get('/:MaKS', authenticateToken, getHotelById);

module.exports = router;