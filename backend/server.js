import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cron from "node-cron";

// Import routes
import authRoutes from "./routes/auth.js";
import clientRoutes from "./routes/clients.js";
import serviceRoutes from "./routes/services.js";
import toolRoutes from "./routes/tools.js";
import settingsRoutes from "./routes/settings.js";
import dashboardRoutes from "./routes/dashboard.js";
import expensesRoutes from "./routes/expenses.js";
import reportsRoutes from "./routes/reports.js";
import notificationRoutes from "./routes/notifications.js";
import auditRoutes from "./routes/audit.js";
import financialRoutes from "./routes/financial.js";
import marketingRoutes from "./routes/marketing.js";
import chargesRoutes from "./routes/charges.js";
import taskRoutes from "./routes/tasks.js";
import backupRoutes from "./routes/backup.js";
import invoiceRoutes from "./routes/invoices.js";
import upgradeRoutes from "./routes/upgrade.js";
import adsRoutes from "./routes/ads.js";
import receiptRoutes from "./routes/receipts.js";
import { performBackup } from "./controllers/backupController.js";

const app = express();

// Middleware
app.use(cors());

// Increase payload limit for image uploads (base64)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/tools", toolRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/financial", financialRoutes);
app.use("/api/marketing", marketingRoutes);
app.use("/api/charges", chargesRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/backup", backupRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/upgrade", upgradeRoutes);
app.use("/api/ads", adsRoutes);
app.use("/api/receipts", receiptRoutes);

// Schedule automatic backup every 24 hours at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("⏰ Running scheduled daily backup...");
  try {
    const result = await performBackup("Scheduled (Daily)");
    console.log("✅ Scheduled backup completed successfully");
    // Log scheduled backup to audit history
    const { logAudit } = await import("./utils/auditLogger.js");
    await logAudit({
      action: "backup_triggered",
      entityType: "Backup",
      details: {
        triggeredBy: "Scheduled (Daily)",
        method: "scheduled",
        ...result,
      },
    });
  } catch (error) {
    console.error("❌ Scheduled backup failed:", error.message);
    const { logAudit } = await import("./utils/auditLogger.js");
    await logAudit({
      action: "backup_triggered",
      entityType: "Backup",
      details: {
        triggeredBy: "Scheduled (Daily)",
        method: "scheduled",
        status: "failed",
        error: error.message,
      },
    }).catch(() => {});
  }
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/redix-agency")
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Redix Agency API Server" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
