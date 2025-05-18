const express = require('express');
const router = express.Router();
const { updateHotelCoordinates, getNearbyHotels } = require('../controllers/mapController');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

// Update hotel coordinates (admin only)
router.put('/hotels/:MaKS/coordinates', authenticateToken, isAdmin, updateHotelCoordinates);

// Get nearby hotels (public)
router.get('/hotels/nearby', getNearbyHotels);

module.exports = router; 