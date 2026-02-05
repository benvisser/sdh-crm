# Agency CRM

A modern sales CRM built for design agencies. Track companies, contacts, deals, and activities through a clean pipeline-driven interface. Includes a HubSpot CSV import tool for migrating existing CRM data.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Database:** PostgreSQL 14+ with Prisma ORM 6
- **Auth:** JWT (jose) with HTTP-only cookies
- **State:** React Query (TanStack Query)
- **Forms:** React Hook Form + Zod 4 validation

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (with `pg_dump` and `psql` CLI tools for backup/restore)

### Setup

```bash
# Install dependencies
npm install

# Copy environment file and update with your database credentials
cp .env.example .env

# Push schema to database
npx prisma db push

# Seed the database with sample data
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### macOS (Homebrew) Setup

If PostgreSQL is not installed:

```bash
brew install postgresql@14
brew services start postgresql@14

# Create the database user and database
createuser -s postgres
psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'crm_dev_password';"
createdb -U postgres agency_crm
```

### Default Login Credentials

| Email | Password | Role |
|---|---|---|
| jordan@agency.com | password123 | Admin |
| alex@agency.com | password123 | Sales |
| sam@agency.com | password123 | Sales |

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:crm_dev_password@localhost:5432/agency_crm` |
| `JWT_SECRET` | Secret key for JWT signing | `your-secret-key-change-in-production` |
| `NEXT_PUBLIC_APP_NAME` | Display name in the app | `Agency CRM` |
| `PG_BIN_PATH` | Path to PostgreSQL CLI tools (for backup/restore) | `/usr/local/opt/postgresql@14/bin` |

## Features

### Dashboard
- Open pipeline value, deals closing this month, won this month, activities due today
- Pipeline breakdown by stage with visual bar chart
- Upcoming activities and recent deals tables

### Deals
- **Pipeline view:** Kanban columns grouped by deal stage (INQUIRY → DISCOVERY CALL → PROPOSAL NEEDED → PROPOSAL SENT → PROPOSAL REVIEWED → DECISION MAKER → NEGOTIATION → CONTRACT)
- **List view:** Sortable table with search and stage filtering
- **Detail page:** Inline editing, stage progression, contacts, notes, activities, history timeline
- Weighted value calculation (value x probability)
- Close deal with WON/LOST status and optional loss reason

### Companies
- List with search, type filtering (PROSPECT, LEAD, CUSTOMER, PARTNER, COMPETITOR)
- Detail page with tabs: Details, Contacts, Deals, Notes, Activities

### Contacts
- List with search, status filtering (ACTIVE, INACTIVE, DO_NOT_CONTACT, CHURNED)
- Detail page with tabs: Details, Deals, Notes, Activities

### Activities
- Filtered views: Upcoming, All, Overdue, Today, This Week, Completed
- Quick-complete from list
- Types: CALL, EMAIL, MEETING, TASK, FOLLOW_UP, PRESENTATION, OTHER

### Global Search
- `Cmd+K` / `Ctrl+K` to search across companies, contacts, and deals
- Debounced search with instant navigation

### Quick Add
- Header dropdown to quickly create companies, contacts, deals, and activities from anywhere

### HubSpot Import
- Upload HubSpot CSV exports (companies, contacts, deals) through a web interface at `/import`
- Automatic database backup before each import
- CSV parsing with support for quoted fields and HubSpot's export format
- Field mapping from HubSpot columns to CRM schema (lifecycle stages, deal stages, company sizes, etc.)
- Preserves company-contact relationships via HubSpot record IDs and name matching
- Manual backup creation and one-click restore from any previous backup
- Import progress indicator with step-by-step status

## Project Structure

```
app/
  (auth)/login/             # Login page
  (dashboard)/              # Protected dashboard layout
    page.tsx                # Dashboard
    companies/              # Companies list + [id] detail
    contacts/               # Contacts list + [id] detail
    deals/                  # Deals pipeline/list + [id] detail
    activities/             # Activities list
    import/                 # HubSpot import + backup management
  api/
    auth/                   # login, logout, me
    companies/              # CRUD + nested contacts, deals, notes
    contacts/               # CRUD + nested notes
    deals/                  # CRUD + stage, contacts, notes, history
    activities/             # CRUD
    notes/                  # CRUD
    search/                 # Global search
    dashboard/              # Dashboard metrics
    import/
      backup/              # POST: create backup, GET: list backups
      restore/[id]/        # POST: restore from backup
      hubspot/             # POST: import HubSpot CSV files

components/
  forms/                    # Quick-add modals
  layout/                   # Sidebar, Header
  shared/                   # Global search
  ui/                       # shadcn/ui components

lib/
  auth.ts                   # JWT helpers
  prisma.ts                 # Prisma client singleton
  format.ts                 # Currency, date, badge formatters
  validations.ts            # Zod schemas
  query-client.tsx          # React Query provider
  utils.ts                  # cn() utility

prisma/
  schema.prisma             # Database schema
  seed.ts                   # Seed data

db-backups/                 # Database backup files (gitignored)
```

## API Routes

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/logout` | Clear auth cookie |
| GET | `/api/auth/me` | Get current user |

### Companies
| Method | Route | Description |
|---|---|---|
| GET | `/api/companies` | List companies (paginated, searchable) |
| POST | `/api/companies` | Create a company |
| GET | `/api/companies/[id]` | Get company detail |
| PUT | `/api/companies/[id]` | Update a company |
| DELETE | `/api/companies/[id]` | Delete a company |

### Contacts
| Method | Route | Description |
|---|---|---|
| GET | `/api/contacts` | List contacts (paginated, searchable) |
| POST | `/api/contacts` | Create a contact |
| GET | `/api/contacts/[id]` | Get contact detail |
| PUT | `/api/contacts/[id]` | Update a contact |
| DELETE | `/api/contacts/[id]` | Delete a contact |

### Deals
| Method | Route | Description |
|---|---|---|
| GET | `/api/deals` | List deals (paginated, searchable) |
| POST | `/api/deals` | Create a deal |
| GET | `/api/deals/[id]` | Get deal detail |
| PUT | `/api/deals/[id]` | Update a deal |
| DELETE | `/api/deals/[id]` | Delete a deal |
| PUT | `/api/deals/[id]/stage` | Update deal stage |

### Activities & Notes
| Method | Route | Description |
|---|---|---|
| GET | `/api/activities` | List activities (filterable) |
| POST | `/api/activities` | Create an activity |
| GET/POST | `/api/notes` | List/create notes |

### Import
| Method | Route | Description |
|---|---|---|
| POST | `/api/import/backup` | Create a database backup |
| GET | `/api/import/backup` | List all backups |
| POST | `/api/import/restore/[id]` | Restore from a backup |
| POST | `/api/import/hubspot` | Import HubSpot CSV files |

### Other
| Method | Route | Description |
|---|---|---|
| GET | `/api/search` | Global search across entities |
| GET | `/api/dashboard` | Dashboard metrics and stats |

## Scripts

```bash
npm run dev       # Start dev server (Turbopack)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```
