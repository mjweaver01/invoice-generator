import { dbOperations } from "./db";
import {
  authenticateRequest,
  hashPassword,
  verifyPassword,
  generateToken,
} from "./auth";

export async function handleApiRoutes(req, url) {
  const path = url.pathname;
  const method = req.method;

  // CORS headers for development
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle OPTIONS for CORS
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    // Auth routes (public)
    // POST /api/auth/signup - Register new user
    if (path === "/api/auth/signup" && method === "POST") {
      const body = await req.json();
      const { username, password } = body;

      if (!username || !password) {
        return new Response(
          JSON.stringify({ error: "Username and password are required" }),
          { status: 400, headers },
        );
      }

      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 6 characters" }),
          { status: 400, headers },
        );
      }

      // Check if user already exists
      const existingUser = dbOperations.getUserByUsername(username);
      if (existingUser) {
        return new Response(
          JSON.stringify({ error: "Username already exists" }),
          { status: 409, headers },
        );
      }

      // Create user
      const passwordHash = await hashPassword(password);
      const user = dbOperations.createUser(username, passwordHash);

      if (!user) {
        return new Response(
          JSON.stringify({ error: "Failed to create user" }),
          { status: 500, headers },
        );
      }

      // Generate token
      const token = generateToken({ userId: user.id, username: user.username });

      return new Response(
        JSON.stringify({
          token,
          user: { id: user.id, username: user.username },
        }),
        { status: 201, headers },
      );
    }

    // POST /api/auth/login - Login
    if (path === "/api/auth/login" && method === "POST") {
      const body = await req.json();
      const { username, password } = body;

      if (!username || !password) {
        return new Response(
          JSON.stringify({ error: "Username and password are required" }),
          { status: 400, headers },
        );
      }

      // Find user
      const user = dbOperations.getUserByUsername(username);
      if (!user) {
        return new Response(
          JSON.stringify({ error: "Invalid username or password" }),
          { status: 401, headers },
        );
      }

      // Verify password
      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        return new Response(
          JSON.stringify({ error: "Invalid username or password" }),
          { status: 401, headers },
        );
      }

      // Generate token
      const token = generateToken({ userId: user.id, username: user.username });

      return new Response(
        JSON.stringify({
          token,
          user: { id: user.id, username: user.username },
        }),
        { headers },
      );
    }

    // GET /api/auth/me - Get current user
    if (path === "/api/auth/me" && method === "GET") {
      const authPayload = await authenticateRequest(req);
      const user = dbOperations.getUserById(authPayload.userId);

      if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers,
        });
      }

      return new Response(
        JSON.stringify({ id: user.id, username: user.username }),
        { headers },
      );
    }

    // All routes below require authentication
    const auth = await authenticateRequest(req);
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
      const clients = dbOperations.getAllClients(auth.userId);
      return new Response(JSON.stringify(clients), { headers });
    }

    // PUT /api/clients/:id - Update client
    if (path.match(/^\/api\/clients\/\d+$/) && method === "PUT") {
      const id = parseInt(path.split("/").pop()!);
      const body = await req.json();
      const client = dbOperations.updateClient(id, body, auth.userId);

      if (!client) {
        return new Response(JSON.stringify({ error: "Client not found" }), {
          status: 404,
          headers,
        });
      }

      return new Response(JSON.stringify(client), { headers });
    }

    // DELETE /api/clients/:id - Delete client
    if (path.match(/^\/api\/clients\/\d+$/) && method === "DELETE") {
      const id = parseInt(path.split("/").pop()!);
      const deleted = dbOperations.deleteClient(id, auth.userId);

      if (!deleted) {
        return new Response(JSON.stringify({ error: "Client not found" }), {
          status: 404,
          headers,
        });
      }

      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // GET /api/invoices - Get all invoices
    if (path === "/api/invoices" && method === "GET") {
      const invoices = dbOperations.getAllInvoices(auth.userId);
      return new Response(JSON.stringify(invoices), { headers });
    }

    // GET /api/invoices/:id - Get single invoice
    if (path.match(/^\/api\/invoices\/\d+$/) && method === "GET") {
      const id = parseInt(path.split("/").pop()!);
      const invoice = dbOperations.getInvoice(id, auth.userId);

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
      const invoice = dbOperations.createInvoice(body, auth.userId);
      return new Response(JSON.stringify(invoice), {
        status: 201,
        headers,
      });
    }

    // PUT /api/invoices/:id - Update invoice
    if (path.match(/^\/api\/invoices\/\d+$/) && method === "PUT") {
      const id = parseInt(path.split("/").pop()!);
      const body = await req.json();
      const invoice = dbOperations.updateInvoice(id, body, auth.userId);

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
      const id = parseInt(path.split("/").pop()!);
      const deleted = dbOperations.deleteInvoice(id, auth.userId);

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
    const message = (error as Error).message;

    // Handle authentication errors
    if (message.includes("token") || message.includes("User not found")) {
      return new Response(JSON.stringify({ error: message }), {
        status: 401,
        headers,
      });
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers,
    });
  }
}
