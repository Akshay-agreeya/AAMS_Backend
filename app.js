const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, process.env.NODE_ENV === 'production' ? 'production.env' : '.env') });

const express = require('express');
const cors = require('cors');
const { getConnectionPool } = require("./config/db");
const loginRoutes = require('./routes/loginRoutes');
const orgRoutes = require('./routes/orgRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const productRoutes = require('./routes/productRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const lookupRoutes = require('./routes/lookupRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { GlobalErrorHandler } = require("./middlewares/errorHandler");
const setupSwagger = require("./swagger");




const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Setup Swagger UI
setupSwagger(app);

// Mount routes
app.use("/api", loginRoutes);
app.use("/api/org", orgRoutes);
app.use("/api/user", userRoutes);
app.use("/api/role", roleRoutes);
app.use("/api/lookup", lookupRoutes);
app.use("/api/product", productRoutes);
app.use("/api/permission", permissionRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
 // Serve frontend files 
  app.use(express.static(path.join(__dirname, "build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
  });

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
