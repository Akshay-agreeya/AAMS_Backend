const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const { getConnectionPool } = require("./config/db");
const loginRoutes = require('./routes/loginRoutes');
const orgRoutes = require('./routes/orgRoutes');
const userRoutes = require('./routes/userRoutes')
const roleRoutes = require('./routes/roleRoutes');
const productRoutes = require('./routes/productRoutes');
const lookupRoutes = require('./routes/lookupRoutes');
const { GlobalErrorHandler } = require("./middlewares/errorHandler");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Routes
app.use("/api", loginRoutes);
app.use("/api/org",orgRoutes);
app.use("/api/user", userRoutes);
app.use("/api/role", roleRoutes);
app.use("/api/lookup",lookupRoutes);
app.use("/api/product", productRoutes);

// Serve frontend files
// app.use(express.static(path.join(__dirname, "build")));
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "build", "index.html"));
// });

// Global Error Handler
app.use(GlobalErrorHandler);

// Initialize Database and Start Server
const startServer = async () => {
  try {
    await getConnectionPool();
    console.log("Database connected successfully.");

    app.listen(PORT, () => {
      console.log(
        `Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`
      );
    });
  } catch (error) {
    console.error("Failed to start the server due to database issues:", error);
  }
};

startServer();
