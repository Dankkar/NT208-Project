const express = require('express');
const { authenticateToken, isAdmin } = require('../middlewares/auth');
const { 
    getCurrentUser,
    //getAllUsers,
    updateUser,
    updateUserByAdmin,
    //deleteUser,
    searchUser,
    getUserByIdForAdmin
} = require('../controllers/userController');

const router = express.Router();

// -------- AUTHENTICATED USER --------

// GET /users/me - Lấy thông tin người dùng hiện tại
router.get('/me', authenticateToken, getCurrentUser);

// PUT /users/me - Cập nhật thông tin cá nhân
router.put('/me', authenticateToken, updateUser);

// -------- ADMIN ONLY --------

//PUT /api/users/:MaKH
router.put('/:MaKH', authenticateToken, isAdmin, updateUserByAdmin);

//DELETE /api/users/:MaKH
// router.delete('/:MaKH', authenticateToken, isAdmin, deleteUser);

//GET /api/users/search
router.get('/search', authenticateToken, isAdmin, searchUser);

//GET /api/admin-view/:userId
router.get('/admin-view/:userId', authenticateToken, isAdmin, getUserByIdForAdmin);

module.exports = router;