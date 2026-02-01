# Invoice Generator

A modern invoice generation application built with Bun v1.3, React, Tailwind CSS, and SQLite.

## Features

- ✨ Create and manage invoices with line items
- 💰 Automatic total calculation based on hourly rate (default: $150/hr)
- ⚙️ Global settings for your name, business info, and defaults
- 👥 Client dropdown with autocomplete (remembers past clients)
- 🗄️ SQLite database for persistent storage
- 📄 Print to PDF using browser's native print dialog
- 🎨 Modern, responsive UI with Tailwind CSS v4
- 🔍 Search and filter invoices by client
- 📊 Track invoice status (draft, sent, paid)

## Tech Stack

- **Runtime:** Bun v1.3
- **Frontend:** React 18 + Tailwind CSS v4
- **Database:** Native `bun:sqlite` (no dependencies)
- **PDF Generation:** Browser native print (`window.print()`)
- **TypeScript:** Native TypeScript support via Bun

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.3 or later

### Installation

1. Install dependencies:

```bash
bun install
```

2. Start the development server:

```bash
bun run dev
```

3. Open your browser to `http://localhost:5173`

No build step required! Bun transpiles TypeScript and JSX on the fly.

## Scripts

- `bun run dev` - Start development server with hot reload
- `bun run start` - Start production server

## Project Structure

```
mw-invoices/
├── src/
│   ├── App.jsx              # Main React component
│   ├── index.jsx            # React entry point
│   ├── components/
│   │   ├── InvoiceForm.jsx  # Invoice creation/editing form
│   │   ├── InvoiceList.jsx  # List of past invoices
│   │   ├── LineItem.jsx     # Individual line item component
│   │   └── PrintableInvoice.jsx # Print-optimized invoice view
│   ├── styles.css           # Tailwind + custom print styles
│   └── api.js               # Frontend API client
├── server/
│   ├── index.js             # Bun server entry point
│   ├── db.js                # SQLite database setup and queries
│   └── routes.js            # API route handlers
├── public/
│   └── index.html           # HTML template
├── build.js                 # Build script
├── package.json
└── tailwind.config.js
```

## Database Schema

### Settings Table (Global)

- `your_name` - Your name (appears on invoices)
- `business_name` - Your business name
- `business_address` - Your business address
- `default_hourly_rate` - Default hourly rate
- `default_payment_terms` - Default payment terms

### Clients Table

- `id` - Primary key
- `name` - Client name (unique)
- `address` - Client address

### Invoices Table

- `id` - Primary key
- `invoice_number` - Unique invoice number (e.g., INV-001)
- `client_name` - Client name
- `client_address` - Client address
- `invoice_date` - Date of invoice
- `hourly_rate` - Hourly billing rate
- `payment_terms` - Payment terms (e.g., Net 30)
- `status` - Invoice status (draft/sent/paid)
- `total` - Total invoice amount
- `created_at` / `updated_at` - Timestamps

### Line Items Table

- `id` - Primary key
- `invoice_id` - Foreign key to invoices
- `description` - Work description
- `hours` - Number of hours
- `order_index` - Display order

## Usage

### First Time Setup

1. Click "Settings" button
2. Enter your name, business name, and address
3. Set your default hourly rate and payment terms
4. Click "Save Settings"

### Creating an Invoice

1. Click "New Invoice" button
2. Select a client from dropdown or enter a new client name
3. Add client address if needed
4. Add line items with descriptions and hours
5. Totals are calculated automatically
6. Click "Save Invoice"

### Editing an Invoice

1. Click "Edit" on any invoice in the list
2. Make your changes
3. Click "Save Invoice"

### Printing/Exporting to PDF

1. Click "Print" on any invoice
2. Click "Print / Save as PDF"
3. Use your browser's print dialog to save as PDF or print

### Searching Invoices

Use the search bar to filter invoices by client name or invoice number, and filter by status (draft/sent/paid).

## Migration to PostgreSQL

The application is designed for easy migration to PostgreSQL. Simply:

1. Replace `server/db.js` with PostgreSQL client
2. Update connection string
3. Schema uses standard SQL types compatible with PostgreSQL

## License

MIT
