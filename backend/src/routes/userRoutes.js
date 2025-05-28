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

// -------- AUTHENTICATED USER --------

// GET /users/me - Lấy thông tin người dùng hiện tại
router.get('/me', authenticateToken, getCurrentUser);

// PUT /users/me - Cập nhật thông tin cá nhân
router.put('/me', authenticateToken, updateUser);

// -------- ADMIN ONLY --------

// GET /users/search - Tìm kiếm người dùng
router.get('/search', authenticateToken, isAdmin, searchUser);

// GET /users - Lấy tất cả user
router.get('/', authenticateToken, isAdmin, getAllUsers);

// PUT /users/:MaKH - Admin cập nhật user
router.put('/:MaKH', authenticateToken, isAdmin, updateUserByAdmin);

// DELETE /users/:MaKH - Admin xóa user
router.delete('/:MaKH', authenticateToken, isAdmin, deleteUser);

module.exports = router;