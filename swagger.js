// swagger.js
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AAMS",
      version: "1.0.0",
      description: "API Documentation for my Express app",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
      },
    ],
    security: [
      {
        bearerAuth: []
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        }
      }
    }
  },
  apis: [
    "./routes/loginRoutes.js",  // Add path to all your route files
    "./routes/orgRoutes.js", 
    "./routes/userRoutes.js", 
    "./routes/roleRoutes.js", 
    "./routes/lookupRoutes.js",
    "./routes/productRoutes.js",
    "./routes/permissionRoutes.js",
    "./routes/reportRoutes.js"
  ],
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;
