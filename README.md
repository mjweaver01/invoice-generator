# Invoice Generator

A modern invoice generation application built with Bun, React, Tailwind CSS, and SQLite.

## Features

- ✨ Create and manage invoices
- 💰 Automatic price calculation based on hourly rate
- 👥 Client management with autocomplete and addresses
- 📄 Print to PDF using browser's native print dialog
- ⚙️ Global settings for business info and payment methods
- 🗄️ SQLite database for persistent storage
- 🎨 Modern, responsive UI with Tailwind CSS v4

## Tech Stack

- **Runtime:** Bun v1.3
- **Frontend:** React 19 + Tailwind CSS v4
- **Database:** Native `bun:sqlite` (no dependencies)
- **PDF Generation:** Browser native print with React-to-Print
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

## Production

To run in production:

```bash
bun start
```

The server will start on port `9000` by default. Visit `http://localhost:9000` to use the app.

**Database**
The SQLite database file will be created automatically in `./data/invoicer.sqlite` on first run (no setup needed).

## License

MIT
