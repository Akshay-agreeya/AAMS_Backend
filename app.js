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
const miscRoutes = require('./routes/miscRoutes');
const manualRoutes = require('./routes/manualRoutes');
const { GlobalErrorHandler } = require("./middlewares/errorHandler");
const setupSwagger = require("./swagger");
const accessibilityRoutes = require('./routes/accessibilityRoutes');
const domainRoutes = require("./routes/domainRoutes");
const reportSummaryRoutes = require("./routes/reportSummaryRoutes");
const notificationRoutes = require('./routes/notificationRoutes');
const pdfRoutes = require('./PDF/route/pdfRoutes');
const excelRoutes = require("./routes/excel.routes");
const pdfScanRoute = require('./routes/pdfScanRoute');
// Add these after your existing requires
const { ConfidentialClientApplication } = require("@azure/msal-node");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Fix 1: CORS must be FIRST, before all other middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use("/api/misc", miscRoutes);
app.use("/api/manual", manualRoutes);
app.use("/api/notifications", notificationRoutes);
app.use('/api', pdfRoutes);
app.use('/api/accessibility', accessibilityRoutes);
app.use("/api/assessment", reportSummaryRoutes);
app.use("/api/excel", excelRoutes);
app.use('/api/domain', domainRoutes);
app.use('/api/pdfs', pdfScanRoute);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Serve frontend files
// app.use(express.static(path.join(__dirname, "build")));
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "build", "index.html"));
// });

// Global Error Handler
app.use(GlobalErrorHandler);

// ✅ Fix 2: Restored app.listen() + kept detailed error logging
const startServer = async () => {
  try {
    await getConnectionPool();
    console.log("✅ Database connected successfully.");
    require('./scheduler/scheduler');
    app.listen(PORT, () => {
      console.log(`🚀 Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ DB ERROR CODE:", error.code);
    console.error("❌ DB ERROR MESSAGE:", error.message);
    console.error("❌ DB ERROR DETAILS:", error.originalError?.message);
    console.error("❌ Full error:", error);
  }
};


// ─── SharePoint PDF Dashboard ─────────────────────────────────────────────────
const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
  },
};

const cca = new ConfidentialClientApplication(msalConfig);

async function getAccessToken() {
  const result = await cca.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  });
  return result.accessToken;
}

async function getFilesInFolder(token, siteId, driveId, folderId) {
  const url = folderId
    ? `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/items/${folderId}/children`
    : `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/root/children`;
  const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.data.value || [];
}

async function countPdfPages(token, downloadUrl) {
  try {
    const pdfParse = require("pdf-parse");
    const response = await axios.get(downloadUrl, {
      responseType: "arraybuffer",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await pdfParse(Buffer.from(response.data));
    return data.numpages || 0;
  } catch {
    return 0;
  }
}

async function walkFolder(token, siteId, driveId, folderId, folderName) {
  const items = await getFilesInFolder(token, siteId, driveId, folderId);
  let pdfFiles = [];
  for (const item of items) {
    if (item.folder) {
      const sub = await walkFolder(token, siteId, driveId, item.id, item.name);
      pdfFiles = pdfFiles.concat(sub);
    } else if (item.name?.toLowerCase().endsWith(".pdf") || item.file?.mimeType === "application/pdf") {
      pdfFiles.push({
        id: item.id, name: item.name, folder: folderName,
        size: item.size, lastModified: item.lastModifiedDateTime,
        downloadUrl: item["@microsoft.graph.downloadUrl"],
      });
    }
  }
  return pdfFiles;
}

app.get("/api/sharepoint/folders", (req, res) => {
  const folders = (process.env.SHAREPOINT_FOLDER_IDS || "")
    .split(",")
    .map((f, i) => {
      const [id, name] = f.trim().split(":");
      return { id: id || f.trim(), name: name || `Folder ${i + 1}` };
    })
    .filter((f) => f.id);
  res.json(folders);
});

app.get("/api/sharepoint/dashboard", async (req, res) => {
  try {
    const token = await getAccessToken();
    const siteId = process.env.SHAREPOINT_SITE_ID;
    const driveId = process.env.SHAREPOINT_DRIVE_ID;
    const folderDefs = (process.env.SHAREPOINT_FOLDER_IDS || "")
      .split(",")
      .map((f) => {
        const [id, name] = f.trim().split(":");
        return { id: id?.trim(), name: name?.trim() || id?.trim() };
      })
      .filter((f) => f.id);

    const folderStats = [];
    let allPdfs = [];

    for (const folder of folderDefs) {
      const pdfs = await walkFolder(token, siteId, driveId, folder.id, folder.name);
      let totalPages = 0;
      const detailedPdfs = [];
      for (const pdf of pdfs) {
        const pages = pdf.downloadUrl ? await countPdfPages(token, pdf.downloadUrl) : 0;
        detailedPdfs.push({ ...pdf, pages });
        totalPages += pages;
      }
      folderStats.push({ id: folder.id, name: folder.name, pdfCount: pdfs.length, totalPages, pdfs: detailedPdfs });
      allPdfs = allPdfs.concat(detailedPdfs);
    }

    res.json({
      totalFolders: folderStats.length,
      totalPdfs: allPdfs.length,
      totalPages: allPdfs.reduce((s, p) => s + p.pages, 0),
      lastUpdated: new Date().toISOString(),
      folders: folderStats,
    });
  } catch (err) {
    console.error("SharePoint Dashboard error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/sharepoint/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// ─── End SharePoint PDF Dashboard ─────────────────────────────────────────────

app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});








startServer();