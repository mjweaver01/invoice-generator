import { Database } from "bun:sqlite";
import type { SQLQueryBindings } from "bun:sqlite";
import type { Client, Invoice, LineItem, Settings } from "../client/types";

export interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at?: string;
}

const db = new Database("invoices.db");
db.run("PRAGMA foreign_keys = ON");

// Tables (create once, correct schema)
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

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

db.run(`
  INSERT OR IGNORE INTO settings (id, your_name, business_name, business_address)
  VALUES (1, '', '', '')
`);

// Prepared statements
const queries = {
  getUserByUsername: db.prepare<User, SQLQueryBindings[]>(
    `SELECT * FROM users WHERE username = ?`,
  ),
  getUserById: db.prepare<User, SQLQueryBindings[]>(
    `SELECT * FROM users WHERE id = ?`,
  ),
  createUser: db.prepare<User, SQLQueryBindings[]>(`
    INSERT INTO users (username, password_hash) VALUES (?, ?)
  `),

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

  getAllInvoices: db.prepare<Invoice[], SQLQueryBindings[]>(`
    SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC
  `),
  getInvoice: db.prepare<Invoice, SQLQueryBindings[]>(`
    SELECT * FROM invoices WHERE id = ? AND user_id = ?
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

  getLineItems: db.prepare<LineItem[], SQLQueryBindings[]>(`
    SELECT * FROM line_items WHERE invoice_id = ? ORDER BY order_index
  `),
  createLineItem: db.prepare<LineItem, SQLQueryBindings[]>(`
    INSERT INTO line_items (invoice_id, description, hours, order_index)
    VALUES (?, ?, ?, ?)
  `),
  deleteLineItemsByInvoice: db.prepare<LineItem, SQLQueryBindings[]>(`
    DELETE FROM line_items WHERE invoice_id = ?
  `),
};

export const dbOperations = {
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

  getSettings() {
    return queries.getSettings.get();
  },
  updateSettings(settings: Settings) {
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

  getAllClients(userId: number) {
    return queries.getAllClients.all(userId);
  },
  getClient(id: number, userId: number) {
    return queries.getClient.get(id, userId);
  },
  getOrCreateClient(name: string, address: string | undefined, userId: number) {
    let client = queries.getClientByName.get(name, userId);
    if (!client) {
      const result = queries.createClient.run(userId, name, address ?? null);
      client = this.getClient(result.lastInsertRowid as number, userId);
    } else if (address !== undefined && address !== client.address) {
      queries.updateClient.run(name, address ?? null, client.id, userId);
      client = this.getClient(client.id, userId);
    }
    return client;
  },
  updateClient(
    id: number,
    clientData: { name: string; address?: string | null },
    userId: number,
  ) {
    queries.updateClient.run(
      clientData.name,
      clientData.address ?? null,
      id,
      userId,
    );
    return this.getClient(id, userId);
  },
  deleteClient(id: number, userId: number) {
    const result = queries.deleteClient.run(id, userId);
    return result.changes > 0;
  },

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
  createInvoice(
    invoiceData: {
      line_items?: Array<{ description: string; hours: number | string }>;
      [key: string]: unknown;
    },
    userId: number,
  ) {
    const { line_items, ...invoiceFields } = invoiceData;
    const fields = invoiceFields as Record<string, unknown>;

    this.getOrCreateClient(
      fields.client_name as string,
      fields.client_address as string | undefined,
      userId,
    );

    const result = queries.createInvoice.run(
      userId,
      fields.invoice_number as string,
      fields.client_name as string,
      (fields.client_address as string) ?? null,
      fields.invoice_date as string,
      (fields.hourly_rate as number) ?? 150,
      (fields.status as string) ?? "draft",
      (fields.total as number) ?? 0,
    );
    const invoiceId = result.lastInsertRowid as number;

    if (line_items?.length) {
      line_items.forEach((item, index) => {
        if (item.description && item.hours != null) {
          queries.createLineItem.run(
            invoiceId,
            item.description,
            parseFloat(String(item.hours)),
            index,
          );
        }
      });
    }
    return this.getInvoice(invoiceId, userId);
  },
  updateInvoice(
    id: number,
    invoiceData: {
      line_items?: Array<{ description: string; hours: number | string }>;
      [key: string]: unknown;
    },
    userId: number,
  ) {
    const { line_items, ...invoiceFields } = invoiceData;
    const fields = invoiceFields as Record<string, unknown>;

    this.getOrCreateClient(
      fields.client_name as string,
      fields.client_address as string | undefined,
      userId,
    );

    queries.updateInvoice.run(
      fields.invoice_number as string,
      fields.client_name as string,
      (fields.client_address as string) ?? null,
      fields.invoice_date as string,
      (fields.hourly_rate as number) ?? 150,
      (fields.status as string) ?? "draft",
      (fields.total as number) ?? 0,
      id,
      userId,
    );
    queries.deleteLineItemsByInvoice.run(id);

    if (line_items?.length) {
      line_items.forEach((item, index) => {
        if (item.description && item.hours != null) {
          queries.createLineItem.run(
            id,
            item.description,
            parseFloat(String(item.hours)),
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
