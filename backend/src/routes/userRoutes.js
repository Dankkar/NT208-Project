const express = require('express');
const { authenticateToken, isAdmin } = require('../middlewares/auth');
const { 
    getCurrentUser,
    getAllUsers,
    updateUser,
    deleteUser
} = require('../controllers/userController');

const router = express.Router();

//GET /api/users/me
router.get('/me', authenticateToken, getCurrentUser);

//GET /api/users
router.get('/', authenticateToken, isAdmin, getAllUsers);

//PUT /api/users/me
router.put('/me', authenticateToken, updateUser);

//DELETE /api/users/:MaKH
router.delete('/:MaKH', authenticateToken, isAdmin, deleteUser);

module.exports = router;