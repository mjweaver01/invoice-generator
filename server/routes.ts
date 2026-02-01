import { dbOperations } from "./db";

export async function handleApiRoutes(req, url) {
  const path = url.pathname;
  const method = req.method;

  // CORS headers for development
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle OPTIONS for CORS
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    // GET /api/settings - Get settings
    if (path === "/api/settings" && method === "GET") {
      const settings = dbOperations.getSettings();
      return new Response(JSON.stringify(settings), { headers });
    }

    // PUT /api/settings - Update settings
    if (path === "/api/settings" && method === "PUT") {
      const body = await req.json();
      const settings = dbOperations.updateSettings(body);
      return new Response(JSON.stringify(settings), { headers });
    }

    // GET /api/clients - Get all clients
    if (path === "/api/clients" && method === "GET") {
      const clients = dbOperations.getAllClients();
      return new Response(JSON.stringify(clients), { headers });
    }

    // GET /api/invoices - Get all invoices
    if (path === "/api/invoices" && method === "GET") {
      const invoices = dbOperations.getAllInvoices();
      return new Response(JSON.stringify(invoices), { headers });
    }

    // GET /api/invoices/:id - Get single invoice
    if (path.match(/^\/api\/invoices\/\d+$/) && method === "GET") {
      const id = parseInt(path.split("/").pop());
      const invoice = dbOperations.getInvoice(id);

      if (!invoice) {
        return new Response(JSON.stringify({ error: "Invoice not found" }), {
          status: 404,
          headers,
        });
      }

      return new Response(JSON.stringify(invoice), { headers });
    }

    // POST /api/invoices - Create new invoice
    if (path === "/api/invoices" && method === "POST") {
      const body = await req.json();
      const invoice = dbOperations.createInvoice(body);
      return new Response(JSON.stringify(invoice), {
        status: 201,
        headers,
      });
    }

    // PUT /api/invoices/:id - Update invoice
    if (path.match(/^\/api\/invoices\/\d+$/) && method === "PUT") {
      const id = parseInt(path.split("/").pop());
      const body = await req.json();
      const invoice = dbOperations.updateInvoice(id, body);

      if (!invoice) {
        return new Response(JSON.stringify({ error: "Invoice not found" }), {
          status: 404,
          headers,
        });
      }

      return new Response(JSON.stringify(invoice), { headers });
    }

    // DELETE /api/invoices/:id - Delete invoice
    if (path.match(/^\/api\/invoices\/\d+$/) && method === "DELETE") {
      const id = parseInt(path.split("/").pop());
      const deleted = dbOperations.deleteInvoice(id);

      if (!deleted) {
        return new Response(JSON.stringify({ error: "Invoice not found" }), {
          status: 404,
          headers,
        });
      }

      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // Route not found
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers,
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers,
    });
  }
}
