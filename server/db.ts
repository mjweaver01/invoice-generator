import { Database } from "bun:sqlite";
import type { SQLQueryBindings } from "bun:sqlite";
import type { Client, Invoice, LineItem, Settings } from "../client/types";

export interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at?: string;
}

// Initialize database
const db = new Database("invoices.db");

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

// Create users table
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create tables
db.run(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    your_name TEXT NOT NULL DEFAULT '',
    business_name TEXT NOT NULL DEFAULT '',
    business_address TEXT NOT NULL DEFAULT '',
    default_hourly_rate REAL NOT NULL DEFAULT 150.0,
    ach_account TEXT NOT NULL DEFAULT '',
    ach_routing TEXT NOT NULL DEFAULT '',
    zelle_contact TEXT NOT NULL DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migrate existing tables to add user_id if they don't exist
const checkColumn = (tableName: string, columnName: string) => {
  const result = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{
    name: string;
  }>;
  return result.some((col) => col.name === columnName);
};

// Add user_id to clients table if it doesn't exist
if (!checkColumn("clients", "user_id")) {
  // For existing data, we'll need to create a default user first if there's any data
  const clientCount = (
    db.prepare("SELECT COUNT(*) as count FROM clients").get() as any
  ).count;
  if (clientCount > 0) {
    // Create a default user for existing data
    const defaultUsername = "admin";
    const bcrypt = require("bcryptjs");
    const defaultPassword = bcrypt.hashSync("changeme", 10);

    db.run(
      `INSERT OR IGNORE INTO users (id, username, password_hash) VALUES (1, ?, ?)`,
      [defaultUsername, defaultPassword],
    );

    // Add column with default value
    db.run(`ALTER TABLE clients ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1`);
    db.run(`ALTER TABLE clients ADD COLUMN temp_name TEXT`);
    db.run(`UPDATE clients SET temp_name = name`);

    // Recreate unique constraint
    db.run(
      `CREATE UNIQUE INDEX idx_clients_user_name ON clients(user_id, name)`,
    );
  } else {
    db.run(`ALTER TABLE clients ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1`);
  }
}

// Add user_id to invoices table if it doesn't exist
if (!checkColumn("invoices", "user_id")) {
  const invoiceCount = (
    db.prepare("SELECT COUNT(*) as count FROM invoices").get() as any
  ).count;
  if (invoiceCount > 0) {
    // Ensure default user exists
    const defaultUsername = "admin";
    const bcrypt = require("bcryptjs");
    const defaultPassword = bcrypt.hashSync("changeme", 10);

    db.run(
      `INSERT OR IGNORE INTO users (id, username, password_hash) VALUES (1, ?, ?)`,
      [defaultUsername, defaultPassword],
    );

    // Add column with default value
    db.run(
      `ALTER TABLE invoices ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1`,
    );

    // Recreate unique constraint for invoice_number per user
    db.run(
      `CREATE UNIQUE INDEX idx_invoices_user_number ON invoices(user_id, invoice_number)`,
    );
  } else {
    db.run(
      `ALTER TABLE invoices ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1`,
    );
  }
}

if (!checkColumn("settings", "ach_account")) {
  db.run(
    `ALTER TABLE settings ADD COLUMN ach_account TEXT NOT NULL DEFAULT ''`,
  );
}
if (!checkColumn("settings", "ach_routing")) {
  db.run(
    `ALTER TABLE settings ADD COLUMN ach_routing TEXT NOT NULL DEFAULT ''`,
  );
}
if (!checkColumn("settings", "zelle_contact")) {
  // Check for old column name and migrate if exists
  if (checkColumn("settings", "zelle_phone")) {
    db.run(`ALTER TABLE settings RENAME COLUMN zelle_phone TO zelle_contact`);
  } else {
    db.run(
      `ALTER TABLE settings ADD COLUMN zelle_contact TEXT NOT NULL DEFAULT ''`,
    );
  }
}

// Insert default settings if not exists
db.run(`
  INSERT OR IGNORE INTO settings (id, your_name, business_name, business_address) 
  VALUES (1, '', '', '')
`);

db.run(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    invoice_number TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_address TEXT,
    invoice_date TEXT NOT NULL,
    hourly_rate REAL NOT NULL DEFAULT 150.0,
    status TEXT DEFAULT 'draft',
    total REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, invoice_number)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS line_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    hours REAL NOT NULL,
    order_index INTEGER NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
  )
`);

// Prepared statements
const queries = {
  // User queries
  getUserByUsername: db.prepare<User, SQLQueryBindings[]>(
    `SELECT * FROM users WHERE username = ?`,
  ),

  getUserById: db.prepare<User, SQLQueryBindings[]>(
    `SELECT * FROM users WHERE id = ?`,
  ),

  createUser: db.prepare<User, SQLQueryBindings[]>(`
    INSERT INTO users (username, password_hash) VALUES (?, ?)
  `),

  // Settings queries
  getSettings: db.prepare<Settings, SQLQueryBindings[]>(
    `SELECT * FROM settings WHERE id = 1`,
  ),

  updateSettings: db.prepare<Settings, SQLQueryBindings[]>(`
    UPDATE settings 
    SET your_name = ?, business_name = ?, business_address = ?, 
        default_hourly_rate = ?, ach_account = ?, ach_routing = ?, 
        zelle_contact = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `),

  // Client queries
  getAllClients: db.prepare<Client[], SQLQueryBindings[]>(
    `SELECT * FROM clients WHERE user_id = ? ORDER BY name`,
  ),

  getClient: db.prepare<Client, SQLQueryBindings[]>(
    `SELECT * FROM clients WHERE id = ? AND user_id = ?`,
  ),

  getClientByName: db.prepare<Client, SQLQueryBindings[]>(
    `SELECT * FROM clients WHERE name = ? AND user_id = ?`,
  ),

  createClient: db.prepare<Client, SQLQueryBindings[]>(`
    INSERT INTO clients (user_id, name, address) VALUES (?, ?, ?)
  `),

  updateClient: db.prepare<Client, SQLQueryBindings[]>(`
    UPDATE clients SET name = ?, address = ? WHERE id = ? AND user_id = ?
  `),

  deleteClient: db.prepare<Client, SQLQueryBindings[]>(`
    DELETE FROM clients WHERE id = ? AND user_id = ?
  `),

  // Invoice queries
  getAllInvoices: db.prepare<Invoice[], SQLQueryBindings[]>(`
    SELECT * FROM invoices 
    WHERE user_id = ?
    ORDER BY created_at DESC
  `),

  getInvoice: db.prepare<Invoice, SQLQueryBindings[]>(`
    SELECT * FROM invoices 
    WHERE id = ? AND user_id = ?
  `),

  createInvoice: db.prepare<Invoice, SQLQueryBindings[]>(`
    INSERT INTO invoices (
      user_id, invoice_number, client_name, client_address, invoice_date,
      hourly_rate, status, total
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),

  updateInvoice: db.prepare<Invoice, SQLQueryBindings[]>(`
    UPDATE invoices 
    SET invoice_number = ?, client_name = ?, client_address = ?, 
        invoice_date = ?, hourly_rate = ?, status = ?, total = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `),

  deleteInvoice: db.prepare<Invoice, SQLQueryBindings[]>(`
    DELETE FROM invoices WHERE id = ? AND user_id = ?
  `),

  // Line item queries
  getLineItems: db.prepare<LineItem[], SQLQueryBindings[]>(`
    SELECT * FROM line_items 
    WHERE invoice_id = ? 
    ORDER BY order_index
  `),

  createLineItem: db.prepare<LineItem, SQLQueryBindings[]>(`
    INSERT INTO line_items (invoice_id, description, hours, order_index)
    VALUES (?, ?, ?, ?)
  `),

  deleteLineItemsByInvoice: db.prepare<LineItem, SQLQueryBindings[]>(`
    DELETE FROM line_items WHERE invoice_id = ?
  `),
};

// Database operations
export const dbOperations = {
  // User operations
  getUserByUsername(username: string) {
    return queries.getUserByUsername.get(username);
  },

  getUserById(id: number) {
    return queries.getUserById.get(id);
  },

  createUser(username: string, passwordHash: string) {
    const result = queries.createUser.run(username, passwordHash);
    return this.getUserById(result.lastInsertRowid as number);
  },

  // Settings operations
  getSettings() {
    return queries.getSettings.get();
  },

  updateSettings(settings) {
    queries.updateSettings.run(
      settings.your_name,
      settings.business_name,
      settings.business_address,
      settings.default_hourly_rate,
      settings.ach_account,
      settings.ach_routing,
      settings.zelle_contact,
    );
    return this.getSettings();
  },

  // Client operations
  getAllClients(userId: number) {
    return queries.getAllClients.all(userId);
  },

  getClient(id: number, userId: number) {
    return queries.getClient.get(id, userId);
  },

  getOrCreateClient(name: string, address: string | undefined, userId: number) {
    let client = queries.getClientByName.get(name, userId);
    if (!client) {
      const result = queries.createClient.run(userId, name, address || null);
      client = this.getClient(result.lastInsertRowid as number, userId);
    } else if (address && address !== client.address) {
      // Update address if provided and different
      queries.updateClient.run(name, address, client.id, userId);
      client = this.getClient(client.id, userId);
    }
    return client;
  },

  updateClient(id: number, clientData: any, userId: number) {
    queries.updateClient.run(
      clientData.name,
      clientData.address || null,
      id,
      userId,
    );
    return this.getClient(id, userId);
  },

  deleteClient(id: number, userId: number) {
    const result = queries.deleteClient.run(id, userId);
    return result.changes > 0;
  },

  // Invoice operations
  getAllInvoices(userId: number) {
    return queries.getAllInvoices.all(userId);
  },

  getInvoice(id: number, userId: number) {
    const invoice = queries.getInvoice.get(id, userId);
    if (!invoice) return null;

    const lineItems = queries.getLineItems.all(id);
    const settings = this.getSettings();
    return { ...invoice, line_items: lineItems, settings };
  },

  createInvoice(invoiceData: any, userId: number) {
    const { line_items, ...invoiceFields } = invoiceData;

    // Save client for dropdown
    this.getOrCreateClient(
      invoiceFields.client_name,
      invoiceFields.client_address,
      userId,
    );

    const result = queries.createInvoice.run(
      userId,
      invoiceFields.invoice_number,
      invoiceFields.client_name,
      invoiceFields.client_address || null,
      invoiceFields.invoice_date,
      invoiceFields.hourly_rate,
      invoiceFields.status || "draft",
      invoiceFields.total || 0,
    );

    const invoiceId = result.lastInsertRowid as number;

    // Insert line items
    if (line_items && line_items.length > 0) {
      line_items.forEach((item: any, index: number) => {
        if (item.description && item.hours) {
          queries.createLineItem.run(
            invoiceId,
            item.description,
            parseFloat(item.hours),
            index,
          );
        }
      });
    }

    return this.getInvoice(invoiceId, userId);
  },

  updateInvoice(id: number, invoiceData: any, userId: number) {
    const { line_items, ...invoiceFields } = invoiceData;

    // Save client for dropdown
    this.getOrCreateClient(
      invoiceFields.client_name,
      invoiceFields.client_address,
      userId,
    );

    queries.updateInvoice.run(
      invoiceFields.invoice_number,
      invoiceFields.client_name,
      invoiceFields.client_address || null,
      invoiceFields.invoice_date,
      invoiceFields.hourly_rate,
      invoiceFields.status || "draft",
      invoiceFields.total || 0,
      id,
      userId,
    );

    // Delete existing line items and insert new ones
    queries.deleteLineItemsByInvoice.run(id);

    if (line_items && line_items.length > 0) {
      line_items.forEach((item: any, index: number) => {
        if (item.description && item.hours) {
          queries.createLineItem.run(
            id,
            item.description,
            parseFloat(item.hours),
            index,
          );
        }
      });
    }

    return this.getInvoice(id, userId);
  },

  deleteInvoice(id: number, userId: number) {
    const result = queries.deleteInvoice.run(id, userId);
    return result.changes > 0;
  },
};

export default db;
