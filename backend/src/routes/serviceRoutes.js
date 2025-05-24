const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin, isStaff } = require('../middlewares/auth');
const {
    getAllServices,
    getServiceById,
    getServicesByHotel,
    createService,
    updateService,
    deleteService,
    addServiceToBooking,
    removeServiceFromBooking,
    getBookingServices
} = require('../controllers/serviceController');

//GET /api/services
router.get('/', getAllServices);

//GET /api/services/:MaDV
router.get('/:MaDV', getServiceById);

//GET /api/services/hotel/:MaKS
router.get('/hotel/:MaKS', getServicesByHotel);

//POST /api/services/booking/:MaDat
router.post('/booking/:MaDat', authenticateToken, addServiceToBooking);

//DELETE /api/services/booking/:MaDat/:MaDV
router.delete('/booking/:MaDat/:MaDV', authenticateToken, removeServiceFromBooking);

//GET /api/services/booking/:MaDat
router.get('/booking/:MaDat', authenticateToken, getBookingServices);

//POST /api/services
router.post('/', authenticateToken, isStaff, createService);

//PUT /api/services/:MaDV
router.put('/:MaDV', authenticateToken, isStaff, updateService);

//DELETE /api/services/:MaDV
router.delete('/:MaDV', authenticateToken, isStaff, deleteService);



module.exports = router;
