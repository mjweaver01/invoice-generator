# Invoice Generator

A modern invoice generation application built with Bun v1.3, React, Tailwind CSS, and SQLite.

## Features

- ✨ Create and manage invoices with line items
- 💰 Automatic total calculation based on hourly rate (default: $150/hr)
- 🗄️ SQLite database for persistent storage
- 📄 Print to PDF using browser's native print dialog
- 🎨 Modern, responsive UI with Tailwind CSS
- 🔍 Search and filter invoices by client
- 📊 Track invoice status (draft, sent, paid)

## Tech Stack

- **Runtime:** Bun v1.3
- **Frontend:** React 18 + Tailwind CSS
- **Database:** Native `bun:sqlite` (no dependencies)
- **PDF Generation:** Browser native print (`window.print()`)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.3 or later

### Installation

1. Install dependencies:
```bash
bun install
```

2. Build the application:
```bash
bun run build
```

3. Start the server:
```bash
bun run dev
```

4. Open your browser to `http://localhost:3000`

## Scripts

- `bun run dev` - Build and start development server with hot reload
- `bun run build` - Build production assets
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

### Invoices Table
- `id` - Primary key
- `invoice_number` - Unique invoice number (e.g., INV-001)
- `client_name` - Client name
- `client_address` - Client address
- `invoice_date` - Date of invoice
- `due_date` - Payment due date
- `hourly_rate` - Hourly billing rate
- `payment_terms` - Payment terms (e.g., Net 30)
- `your_business_name` - Your business name
- `your_business_address` - Your business address
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

### Creating an Invoice

1. Click "New Invoice" button
2. Fill in client information
3. Set your hourly rate (defaults to $150/hr)
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
