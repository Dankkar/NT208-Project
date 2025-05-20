// src/controllers/promotionController.js
const { poolPromise, sql } = require('../database/db');

exports.getAllPromotions = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT * FROM KhuyenMai
            `);
    
        res.status(200).json({
            success: true,
            data: result.recordset
        })
    }
    catch (error)
    {
        console.error('Lỗi getAllPromotions:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

