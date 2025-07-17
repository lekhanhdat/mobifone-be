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

const subscriberRoutes = require("./routes/subscriber.routes");
app.use("/api/subscribers", subscriberRoutes);

const statsRoutes = require("./routes/stat.routes");
app.use("/api/stats", statsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));



