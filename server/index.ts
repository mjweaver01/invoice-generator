import path from "path";
import { existsSync, statSync } from "fs";
import indexPageHtml from "../src/index.html";
import { handleApiRoutes } from "./routes";

console.log(
  `🚀 Starting invoice server in ${process.env.NODE_ENV || "development"} mode`,
);

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 9000;
const hostname = process.env.PORT
  ? "0.0.0.0"
  : (process.env.HOSTNAME ??
    (process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost"));

const server = Bun.serve({
  port,
  hostname,
  routes: {
    // SPA routes - serve index.html for client-side routing
    "/": indexPageHtml,
    "/new": indexPageHtml,
    "/edit/:id": indexPageHtml,
    "/print/:id": indexPageHtml,
    "/settings": indexPageHtml,
    "/clients": indexPageHtml,

    // API routes
    "/api/settings": {
      GET: async (req) => handleApiRoutes(req, new URL(req.url)),
      PUT: async (req) => handleApiRoutes(req, new URL(req.url)),
    },
    "/api/clients": {
      GET: async (req) => handleApiRoutes(req, new URL(req.url)),
    },
    "/api/clients/:id": {
      PUT: async (req) => handleApiRoutes(req, new URL(req.url)),
      DELETE: async (req) => handleApiRoutes(req, new URL(req.url)),
    },
    "/api/invoices": {
      GET: async (req) => handleApiRoutes(req, new URL(req.url)),
      POST: async (req) => handleApiRoutes(req, new URL(req.url)),
    },
    "/api/invoices/:id": {
      GET: async (req) => handleApiRoutes(req, new URL(req.url)),
      PUT: async (req) => handleApiRoutes(req, new URL(req.url)),
      DELETE: async (req) => handleApiRoutes(req, new URL(req.url)),
    },

    // Catch-all route - handles static files and client-side routing
    "/*": async (req: Request) => {
      const url = new URL(req.url);
      const cleanPathname = url.pathname.replace(/^\//, "");

      // Check for static files in src directory
      const srcPath = path.join(import.meta.dir, "..", "src", cleanPathname);

      // Try to find and serve the file
      let filePath: string | null = null;
      if (existsSync(srcPath)) {
        const stats = statSync(srcPath);
        if (stats.isFile()) {
          filePath = srcPath;
        }
      }

      // If we found a static file, serve it
      if (filePath) {
        const file = Bun.file(filePath);
        const ext = filePath.split(".").pop()?.toLowerCase();

        const contentTypeMap: Record<string, string> = {
          svg: "image/svg+xml",
          png: "image/png",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          gif: "image/gif",
          webp: "image/webp",
          json: "application/json",
          js: "application/javascript",
          ts: "application/javascript",
          tsx: "application/javascript",
          jsx: "application/javascript",
          html: "text/html",
          css: "text/css",
          txt: "text/plain",
          md: "text/markdown",
        };

        const contentType =
          contentTypeMap[ext || ""] || "application/octet-stream";
        const headers: Record<string, string> = { "Content-Type": contentType };

        // Add cache control for static assets
        if (["svg", "png", "jpg", "jpeg", "gif", "webp"].includes(ext || "")) {
          headers["Cache-Control"] = "public, max-age=31536000, immutable";
        }

        return new Response(file, { headers });
      }

      // Check if this looks like a static file request (has file extension)
      // If so and file doesn't exist, return 404 instead of serving the SPA
      const hasFileExtension = /\.\w+$/.test(url.pathname);
      if (hasFileExtension) {
        return new Response("Not Found", { status: 404 });
      }

      // Otherwise, serve the SPA for client-side routing
      return indexPageHtml;
    },
  },

  async fetch(req: Request) {
    const url = new URL(req.url);

    // Handle CORS preflight for API routes
    if (req.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods":
            "POST, OPTIONS, GET, PUT, DELETE, PATCH",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Return undefined to let Bun's router handle all other routes
    return undefined;
  },
  ...(process.env.NODE_ENV === "production"
    ? {}
    : {
        development: {
          hmr: true,
        },
      }),
} as any);
console.log(`📊 Database: invoices.db`);
console.log(`🎨 Frontend: React 19 + Tailwind CSS v4`);
console.log(`⚡ Bun native TypeScript transpilation - no build step!`);
if (process.env.NODE_ENV !== "production") {
  console.log(`🔥 Hot Module Replacement (HMR) enabled`);
}
console.log(`🚀 Server running at http://${server.hostname}:${server.port}`);
