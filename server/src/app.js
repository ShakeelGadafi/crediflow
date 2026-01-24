const express = require('express');
const cors = require('cors');
const path = require('path');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const creditRoutes = require('./routes/credit.routes');
const utilityRoutes = require('./routes/utility.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static files from "uploads" directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/credit', creditRoutes);
app.use('/api/utilities', utilityRoutes);

module.exports = app;
