//backend/src/database/db.js
require('dotenv').config();

const sql = require('mssql');

const config = {
    user: process.env.DB_USER,     // ví dụ sa hoặc user bạn tạo
    password: process.env.DB_PASS,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true 
    }
};


const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Kết nối SQL Server thành công đến database', config.database);
        return pool;
    })
    .catch(err => console.log('Lỗi kết nối SQL Server: ', err));

module.exports = {
    sql, poolPromise
}