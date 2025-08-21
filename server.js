const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require('morgan');  // Logging requests
const helmet = require('helmet');  // Security headers
const connectDB = require("./config/db");
const { protect } = require('./middlewares/authMiddleware'); // Import protect (tạo nếu chưa)

// Load biến môi trường
dotenv.config();

// Kết nối MongoDB
connectDB();

const app = express();

// Middleware clean & secure
app.use(helmet());  // Bảo vệ headers (CSP, XSS...)
app.use(morgan('dev'));  // Log requests (dev mode: colored)
app.use(cors({ origin: 'http://localhost:5173' }));  // Frontend Vite port
app.use(express.json({ limit: '1mb' }));  // Parse JSON, giới hạn size tránh DDoS

app.get("/", (req, res) => {
  res.send("Hello from API");
});

app.use('/api/auth', require('./routes/auth.routes')); 
app.use('/api/subscribers', protect, require('./routes/subscriber.routes'));
app.use('/api/stats', protect, require('./routes/stat.routes'));
app.use('/api/packages', protect, require('./routes/package.routes'));

// Global error handler (merge, chỉ 1, an toàn không leak stack in production)
app.use((err, req, res, next) => {
  console.error(err.message);  // Log message only
  res.status(500).json({
    message: 'Server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined  // Chỉ show details dev
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));