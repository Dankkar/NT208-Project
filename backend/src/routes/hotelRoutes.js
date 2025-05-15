const express = require('express');
const { 
    createHotel,
    updateHotel,
    deleteHotel,
    getHotelsByNguoiQuanLy,
    getHotelById,
    getAllHotels
} = require('../controllers/hotelController');
const {authenticateToken, isAdmin} = require('../middlewares/auth');

const router = express.Router();
//POST /hotels
router.post('/hotels', authenticateToken, isAdmin,
    [
        check('TenKS', 'Tên khách sạn không được để trống').notEmpty(),
        check('DiaChi', 'Địa chỉ không được để trống').notEmpty(),
        check('HangSao', 'Hạng sao không được để trống').notEmpty(),
        check('LoaiHinh', 'Loại hình không được để trống').notEmpty(),
        check('MoTaCoSoVatChat', 'Mô tả cơ sở vật chất không được để trống').notEmpty(),
        check('QuyDinh', 'Quy định không được để trống').notEmpty(),    
    ], createHotel);

//PUT /hotels/:MaKS
router.put('/hotels/:MaKS', authenticateToken, isAdmin, updateHotel);

//DELETE /hotels/:MaKS
router.delete('/hotels/:MaKS', authenticateToken, isAdmin, deleteHotel);

//GET /hotels/:MaKS
router.get('/hotels/:MaKS', authenticateToken, getHotelById);

//GET /hotels/nguoi-quan-ly/:MaKH
router.get('/hotels/nguoi-quan-ly/:MaKH', authenticateToken, isAdmin, getHotelsByNguoiQuanLy);

//GET /hotels
router.get('/hotels', authenticateToken, getAllHotels);
module.exports = router;