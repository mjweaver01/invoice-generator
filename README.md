# Invoice Generator

A modern invoice generation application built with Bun, React, Tailwind CSS, and SQLite.

## Features

- ✨ Create and manage invoices
- 💰 Automatic price calculation based on hourly rate
- 👥 Client management with autocomplete and addresses
- 📄 Print to PDF using browser's native print dialog
- ⚙️ Global settings for business info and payment methods
- 🔐 User authentication with JWT (username/password)
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

3. Open your browser to `http://localhost:9000`

4. Create an account or sign in (if you have existing data, use `admin`/`changeme`)

No build step required! Bun transpiles TypeScript and JSX on the fly.

## Production

To run in production:

```bash
bun start
```

The server will start on port `9000` by default. Visit `http://localhost:9000` to use the app.

## Database

The SQLite database file will be created automatically in `./invoices.db` on first run (no setup needed).

## Authentication

Users are authenticated using JWT tokens with username/password credentials. Each user's invoices and clients are isolated and scoped to their account. For existing databases, a default admin user is created with username `admin` and password `changeme` - be sure to change this after first login.

## License

MIT
