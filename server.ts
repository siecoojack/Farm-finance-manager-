import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "Farm Financial Management System" });
  });

  // Direct download route for the poultry farm app icon
  app.get("/api/icon-download", (_req, res) => {
    const iconPath = path.join(process.cwd(), "public", "icon-512.png");
    res.setHeader("Content-Disposition", 'attachment; filename="farm-poultry-icon.png"');
    res.setHeader("Content-Type", "image/png");
    res.sendFile(iconPath);
  });

  // Direct download route for offline HTML bundle (for WebIntoApp HTML Files tab)
  app.get("/api/download-zip", (_req, res) => {
    const zipPath = path.join(process.cwd(), "public", "farm-app-files.zip");
    res.setHeader("Content-Disposition", 'attachment; filename="farm-financial-offline.zip"');
    res.setHeader("Content-Type", "application/zip");
    res.sendFile(zipPath);
  });

  // Serve static assets or use Vite middleware depending on NODE_ENV
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
