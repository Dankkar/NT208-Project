const express = require('express');
const { authenticateToken, isAdmin } = require('../middlewares/auth');
const { 
    getCurrentUser,
    getAllUsers,
    updateUser,
    updateUserByAdmin,
    deleteUser,
    searchUser
} = require('../controllers/userController');

const router = express.Router();

//GET /api/users/me
router.get('/me', authenticateToken, getCurrentUser);

//PUT /api/users/me
router.put('/me', authenticateToken, updateUser);

//GET /api/users
router.get('/', authenticateToken, isAdmin, getAllUsers);

//PUT /api/users/:MaKH
router.put('/:MaKH', authenticateToken, isAdmin, updateUserByAdmin);

//DELETE /api/users/:MaKH
router.delete('/:MaKH', authenticateToken, isAdmin, deleteUser);

//GET /api/users/search
router.get('/search', authenticateToken, isAdmin, searchUser);

module.exports = router;