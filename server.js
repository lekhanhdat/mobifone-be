const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load biến môi trường
dotenv.config();

// Kết nối MongoDB
connectDB();

const app = express();
app.use(cors());
app.use(express.json()); // dùng để parse body JSON

app.get("/", (req, res) => {
  res.send("Hello from API");
});

app.use('/api/subscribers', require('./routes/subscriber.routes'));
app.use('/api/stats', require('./routes/stat.routes'));
app.use('/api/auth', require('./routes/auth.routes'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

app.use((err, req, res, next) => {
  console.error(err.message); // Không stack để tránh leak
  res.status(500).json({ message: 'Server error', details: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

app.use(cors({ origin: 'http://localhost:5173' })); 

app.use('/api/packages', require('./routes/package.routes'));