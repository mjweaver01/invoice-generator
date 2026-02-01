import { Database } from "bun:sqlite";

// Initialize database
const db = new Database("invoices.db");

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

// Create tables
db.run(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    your_name TEXT NOT NULL DEFAULT '',
    business_name TEXT NOT NULL DEFAULT '',
    business_address TEXT NOT NULL DEFAULT '',
    default_hourly_rate REAL NOT NULL DEFAULT 150.0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert default settings if not exists
db.run(`
  INSERT OR IGNORE INTO settings (id, your_name, business_name, business_address) 
  VALUES (1, '', '', '')
`);

db.run(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    address TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    client_name TEXT NOT NULL,
    client_address TEXT,
    invoice_date TEXT NOT NULL,
    hourly_rate REAL NOT NULL DEFAULT 150.0,
    status TEXT DEFAULT 'draft',
    total REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
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
  // Settings queries
  getSettings: db.prepare(`SELECT * FROM settings WHERE id = 1`),

  updateSettings: db.prepare(`
    UPDATE settings 
    SET your_name = ?, business_name = ?, business_address = ?, 
        default_hourly_rate = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `),

  // Client queries
  getAllClients: db.prepare(`SELECT * FROM clients ORDER BY name`),

  getClient: db.prepare(`SELECT * FROM clients WHERE id = ?`),

  getClientByName: db.prepare(`SELECT * FROM clients WHERE name = ?`),

  createClient: db.prepare(`
    INSERT INTO clients (name, address) VALUES (?, ?)
  `),

  updateClient: db.prepare(`
    UPDATE clients SET name = ?, address = ? WHERE id = ?
  `),

  // Invoice queries
  getAllInvoices: db.prepare(`
    SELECT * FROM invoices 
    ORDER BY created_at DESC
  `),

  getInvoice: db.prepare(`
    SELECT * FROM invoices 
    WHERE id = ?
  `),

  createInvoice: db.prepare(`
    INSERT INTO invoices (
      invoice_number, client_name, client_address, invoice_date,
      hourly_rate, status, total
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `),

  updateInvoice: db.prepare(`
    UPDATE invoices 
    SET invoice_number = ?, client_name = ?, client_address = ?, 
        invoice_date = ?, hourly_rate = ?, status = ?, total = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  deleteInvoice: db.prepare(`
    DELETE FROM invoices WHERE id = ?
  `),

  // Line item queries
  getLineItems: db.prepare(`
    SELECT * FROM line_items 
    WHERE invoice_id = ? 
    ORDER BY order_index
  `),

  createLineItem: db.prepare(`
    INSERT INTO line_items (invoice_id, description, hours, order_index)
    VALUES (?, ?, ?, ?)
  `),

  deleteLineItemsByInvoice: db.prepare(`
    DELETE FROM line_items WHERE invoice_id = ?
  `),
};

// Database operations
export const dbOperations = {
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
    );
    return this.getSettings();
  },

  // Client operations
  getAllClients() {
    return queries.getAllClients.all();
  },

  getClient(id) {
    return queries.getClient.get(id);
  },

  getOrCreateClient(name, address) {
    let client = queries.getClientByName.get(name);
    if (!client) {
      const result = queries.createClient.run(name, address || null);
      client = this.getClient(result.lastInsertRowid);
    }
    return client;
  },

  // Invoice operations
  getAllInvoices() {
    return queries.getAllInvoices.all();
  },

  getInvoice(id) {
    const invoice = queries.getInvoice.get(id);
    if (!invoice) return null;

    const lineItems = queries.getLineItems.all(id);
    const settings = this.getSettings();
    return { ...invoice, line_items: lineItems, settings };
  },

  createInvoice(invoiceData) {
    const { line_items, ...invoiceFields } = invoiceData;

    // Save client for dropdown
    this.getOrCreateClient(
      invoiceFields.client_name,
      invoiceFields.client_address,
    );

    const result = queries.createInvoice.run(
      invoiceFields.invoice_number,
      invoiceFields.client_name,
      invoiceFields.client_address || null,
      invoiceFields.invoice_date,
      invoiceFields.hourly_rate,
      invoiceFields.status || "draft",
      invoiceFields.total || 0,
    );

    const invoiceId = result.lastInsertRowid;

    // Insert line items
    if (line_items && line_items.length > 0) {
      line_items.forEach((item, index) => {
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

    return this.getInvoice(invoiceId);
  },

  updateInvoice(id, invoiceData) {
    const { line_items, ...invoiceFields } = invoiceData;

    // Save client for dropdown
    this.getOrCreateClient(
      invoiceFields.client_name,
      invoiceFields.client_address,
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
    );

    // Delete existing line items and insert new ones
    queries.deleteLineItemsByInvoice.run(id);

    if (line_items && line_items.length > 0) {
      line_items.forEach((item, index) => {
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

    return this.getInvoice(id);
  },

  deleteInvoice(id) {
    const result = queries.deleteInvoice.run(id);
    return result.changes > 0;
  },
};

export default db;
