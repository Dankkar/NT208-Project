const express = require('express');
const router = express.Router();
const { 
    getRevenueOverview,
    getRevenueByPeriod,
    getRevenueByRoomType,
    getRevenueByService,
    getRevenueByHotel,
    getRevenueAnalytics
} = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

/**
 * @route   GET /api/admin/revenue/overview
 * @desc    Get revenue overview dashboard with key metrics
 * @access  Private (Admin only)
 * @returns {Object} Monthly revenue, yearly revenue, total bookings, average booking value, cancellation rate, and occupancy rate
 */
router.get('/revenue/overview', authenticateToken, isAdmin, getRevenueOverview);

/**
 * @route   GET /api/admin/revenue/period
 * @desc    Get revenue analysis by time period (day/month/year)
 * @access  Private (Admin only)
 * @query   {string} startDate - Start date for analysis
 * @query   {string} endDate - End date for analysis
 * @query   {string} groupBy - Grouping period ('day', 'month', 'year')
 * @returns {Array} Revenue data grouped by specified time period
 */
router.get('/revenue/period', authenticateToken, isAdmin, getRevenueByPeriod);

/**
 * @route   GET /api/admin/revenue/room-types
 * @desc    Get revenue analysis by room type
 * @access  Private (Admin only)
 * @query   {string} startDate - Start date for analysis
 * @query   {string} endDate - End date for analysis
 * @returns {Array} Revenue data grouped by room type including bookings, revenue, and occupancy metrics
 */
router.get('/revenue/room-types', authenticateToken, isAdmin, getRevenueByRoomType);

/**
 * @route   GET /api/admin/revenue/services
 * @desc    Get revenue analysis by service type
 * @access  Private (Admin only)
 * @query   {string} startDate - Start date for analysis
 * @query   {string} endDate - End date for analysis
 * @returns {Array} Revenue data grouped by service including usage count, revenue, and average price
 */
router.get('/revenue/services', authenticateToken, isAdmin, getRevenueByService);

/**
 * @route   GET /api/admin/revenue/hotels
 * @desc    Get revenue analysis by hotel
 * @access  Private (Admin only)
 * @query   {string} startDate - Start date for analysis
 * @query   {string} endDate - End date for analysis
 * @returns {Array} Revenue data grouped by hotel including bookings, revenue, and occupancy metrics
 */
router.get('/revenue/hotels', authenticateToken, isAdmin, getRevenueByHotel);

/**
 * @route   GET /api/admin/revenue/analytics
 * @desc    Get detailed revenue analytics including trends, peak times, and cancellation analysis
 * @access  Private (Admin only)
 * @query   {string} startDate - Start date for analysis
 * @query   {string} endDate - End date for analysis
 * @returns {Object} Detailed analytics including revenue trends, peak booking times, and cancellation patterns
 */
router.get('/revenue/analytics', authenticateToken, isAdmin, getRevenueAnalytics);

module.exports = router; 