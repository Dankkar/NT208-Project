const express = require('express');
const router = express.Router();
const { updateHotelCoordinates, getNearbyHotels, getMapsApiKeyClientSide } = require('../controllers/mapController');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

// Get Google Maps API Key for client-side
router.get('/client-maps-api-key', getMapsApiKeyClientSide);

// Update hotel coordinates (admin only)
router.put('/hotels/:MaKS/coordinates', authenticateToken, isAdmin, updateHotelCoordinates);

// Get nearby hotels (public)
router.get('/hotels/nearby', getNearbyHotels);

module.exports = router; 