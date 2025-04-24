//backend/src/index.js
require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
    console.log(`→ ${req.method} ${req.url}`);
    next();
  });
  

//Mount routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})