const express = require('express');
const router = express.Router();

const {
    createRoomType,
    getRoomTypesByHotel,
    updateRoomType,
    // deleteRoomType,
    compareRoomTypes,
} = require('../controllers/roomTypeController');

const { authenticateToken, isAdmin, isStaff } = require('../middlewares/auth');

//POST /roomTypes
router.post('/', authenticateToken, isAdmin, createRoomType);

//GET /roomTypes/hotel/:MaKS
router.get('/hotel/:MaKS', authenticateToken, getRoomTypesByHotel);

//PUT /roomTypes/:MaLoaiPhong
router.put('/:MaLoaiPhong', authenticateToken, isStaff, updateRoomType);

//DELETE /roomTypes/:MaLoaiPhong
// router.delete('/:MaLoaiPhong', authenticateToken, isAdmin, deleteRoomType);

// Support both URL formats:
// 1. /roomTypes/compare/1/2 (route params)
// 2. /roomTypes/compare?type1=1&type2=2 (query params)
router.get('/compare/:typeId1/:typeId2', authenticateToken, compareRoomTypes);
router.get('/compare', authenticateToken, compareRoomTypes);

module.exports = router;
