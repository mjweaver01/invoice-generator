import { handleApiRoutes } from './routes';

// Cache for built assets
let appJsCache: Response | null = null;
let cssCache: Response | null = null;

const server = Bun.serve({
  port: 9000,
  async fetch(req) {
    const url = new URL(req.url);
    
    // Handle API routes
    if (url.pathname.startsWith('/api')) {
      return handleApiRoutes(req, url);
    }
    
    // Serve index.html for root
    if (url.pathname === '/' || !url.pathname.includes('.')) {
      return new Response(Bun.file('public/index.html'), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Serve app.js - transpile React/TypeScript on the fly
    if (url.pathname === '/app.js') {
      if (!appJsCache || process.env.NODE_ENV !== 'production') {
        const result = await Bun.build({
          entrypoints: ['./src/index.tsx'],
          target: 'browser',
          minify: process.env.NODE_ENV === 'production',
        });
        
        if (result.success && result.outputs[0]) {
          appJsCache = new Response(result.outputs[0], {
            headers: { 
              'Content-Type': 'application/javascript',
              'Cache-Control': process.env.NODE_ENV === 'production' ? 'max-age=31536000' : 'no-cache'
            },
          });
        } else {
          console.error('Build failed:', result.logs);
          return new Response('Build failed', { status: 500 });
        }
      }
      return appJsCache!;
    }

    // Serve CSS with Tailwind v4 processing
    if (url.pathname === '/styles.css') {
      if (!cssCache || process.env.NODE_ENV !== 'production') {
        // Use Tailwind v4 CLI to process CSS
        const proc = Bun.spawn(['bunx', '@tailwindcss/cli', '-i', './src/styles.css', '-o', '/dev/stdout'], {
          stdout: 'pipe',
        });
        
        const output = await new Response(proc.stdout).text();
        await proc.exited;
        
        cssCache = new Response(output, {
          headers: { 
            'Content-Type': 'text/css',
            'Cache-Control': process.env.NODE_ENV === 'production' ? 'max-age=31536000' : 'no-cache'
          },
        });
      }
      return cssCache!;
    }

    return new Response('Not Found', { status: 404 });
  },
});

console.log(`🚀 Server running at http://localhost:${server.port}`);
console.log(`📊 Database: invoices.db`);
console.log(`🎨 Frontend: React + Tailwind CSS v4`);
console.log(`⚡ Bun native TypeScript transpilation - no build step!`);
console.log(`\nReady to create invoices!`);
