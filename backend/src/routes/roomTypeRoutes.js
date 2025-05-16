const express = require('express');
const router = express.Router();
const {
    createRoomType,
    getRoomTypesByHotel,
    updateRoomType,
    deleteRoomType
} = require('../controllers/roomTypeController');

const { authenticateToken, isAdmin, isStaff } = require('../middlewares/auth');

//POST /roomTypes
router.post('/', authenticateToken, isAdmin, createRoomType);

//GET /roomTypes/hotel/:MaKS
router.get('/hotel/:MaKS', authenticateToken, getRoomTypesByHotel);

//PUT /roomTypes/:MaLoaiPhong
router.put('/:MaLoaiPhong', authenticateToken, isStaff, updateRoomType);

//DELETE /roomTypes/:MaLoaiPhong
router.delete('/:MaLoaiPhong', authenticateToken, isAdmin, deleteRoomType);

module.exports = router;
