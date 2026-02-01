import { Database } from "bun:sqlite";

// Initialize database
const db = new Database("invoices.db");

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

// Create tables
db.run(`
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    client_name TEXT NOT NULL,
    client_address TEXT,
    invoice_date TEXT NOT NULL,
    due_date TEXT,
    hourly_rate REAL NOT NULL DEFAULT 150.0,
    payment_terms TEXT,
    your_business_name TEXT,
    your_business_address TEXT,
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

// Prepared statements for invoices
const queries = {
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
      invoice_number, client_name, client_address, invoice_date, due_date,
      hourly_rate, payment_terms, your_business_name, your_business_address,
      status, total
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  updateInvoice: db.prepare(`
    UPDATE invoices 
    SET invoice_number = ?, client_name = ?, client_address = ?, 
        invoice_date = ?, due_date = ?, hourly_rate = ?, payment_terms = ?,
        your_business_name = ?, your_business_address = ?, status = ?, total = ?,
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
  // Get all invoices
  getAllInvoices() {
    return queries.getAllInvoices.all();
  },

  // Get single invoice with line items
  getInvoice(id) {
    const invoice = queries.getInvoice.get(id);
    if (!invoice) return null;

    const lineItems = queries.getLineItems.all(id);
    return { ...invoice, line_items: lineItems };
  },

  // Create invoice with line items
  createInvoice(invoiceData) {
    const { line_items, ...invoiceFields } = invoiceData;

    const result = queries.createInvoice.run(
      invoiceFields.invoice_number,
      invoiceFields.client_name,
      invoiceFields.client_address || null,
      invoiceFields.invoice_date,
      invoiceFields.due_date || null,
      invoiceFields.hourly_rate,
      invoiceFields.payment_terms || null,
      invoiceFields.your_business_name || null,
      invoiceFields.your_business_address || null,
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

  // Update invoice with line items
  updateInvoice(id, invoiceData) {
    const { line_items, ...invoiceFields } = invoiceData;

    queries.updateInvoice.run(
      invoiceFields.invoice_number,
      invoiceFields.client_name,
      invoiceFields.client_address || null,
      invoiceFields.invoice_date,
      invoiceFields.due_date || null,
      invoiceFields.hourly_rate,
      invoiceFields.payment_terms || null,
      invoiceFields.your_business_name || null,
      invoiceFields.your_business_address || null,
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

  // Delete invoice (line items cascade)
  deleteInvoice(id) {
    const result = queries.deleteInvoice.run(id);
    return result.changes > 0;
  },
};

export default db;
